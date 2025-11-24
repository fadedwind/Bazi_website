const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接池配置
// 支持虚拟主机环境（某些虚拟主机可能不需要指定 port）
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bazi_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  // 虚拟主机兼容性配置
  timezone: '+00:00',
  // 如果虚拟主机不支持某些功能，可以禁用
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// 如果配置了端口，则添加端口配置（某些虚拟主机可能不需要）
if (process.env.DB_PORT) {
  dbConfig.port = parseInt(process.env.DB_PORT) || 3306;
}

const pool = mysql.createPool(dbConfig);

// 测试连接（延迟测试，避免启动时阻塞）
// 数据库连接失败不会阻止服务器启动，WebSocket 功能可以独立运行
setTimeout(() => {
  pool.getConnection()
    .then(connection => {
      console.log('✅ 数据库连接成功');
      console.log(`📊 数据库: ${dbConfig.database} @ ${dbConfig.host}`);
      connection.release();
    })
    .catch(err => {
      console.warn('⚠️  数据库连接失败（不影响 WebSocket 功能）:', err.message);
      console.warn('💡 提示: WebSocket 功能可以正常使用，但数据库相关功能将不可用');
      console.warn('💡 如需使用数据库，请检查 .env 文件配置并运行 "npm run init-db"');
    });
}, 1000); // 延迟1秒测试连接

module.exports = pool;

