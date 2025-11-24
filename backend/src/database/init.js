/**
 * 数据库初始化脚本
 * 用于创建数据库和表结构
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库配置（不指定数据库名，用于创建数据库）
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  charset: 'utf8mb4'
};

const DB_NAME = process.env.DB_NAME || 'bazi_db';

async function initDatabase() {
  let connection = null;
  
  try {
    console.log('📦 开始初始化数据库...');
    console.log(`📝 数据库配置:`);
    console.log(`   - 主机: ${config.host}`);
    console.log(`   - 端口: ${config.port || '默认'}`);
    console.log(`   - 用户: ${config.user}`);
    console.log(`   - 数据库: ${DB_NAME}`);
    
    // 检查 MySQL 服务是否运行
    console.log('\n🔍 正在连接 MySQL...');
    
    // 连接 MySQL（不指定数据库）
    connection = await mysql.createConnection(config);
    console.log('✅ MySQL 连接成功');

    // 创建数据库（如果不存在）
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ 数据库 ${DB_NAME} 创建成功或已存在`);

    // 切换到目标数据库
    await connection.query(`USE \`${DB_NAME}\``);

    // 创建查询记录表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`query_records\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`datetime\` VARCHAR(50) NOT NULL COMMENT '出生时间',
        \`gender\` INT DEFAULT 1 COMMENT '性别：1-男，2-女',
        \`sect\` INT DEFAULT 0 COMMENT '流派：0-默认',
        \`query_type\` VARCHAR(50) DEFAULT 'get_info' COMMENT '查询类型',
        \`ip\` VARCHAR(50) DEFAULT '' COMMENT '客户端IP',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        INDEX \`idx_created_at\` (\`created_at\`),
        INDEX \`idx_query_type\` (\`query_type\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='查询记录表'
    `);
    console.log('✅ 查询记录表创建成功');

    // 创建用户表（可选，用于扩展功能）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
        \`email\` VARCHAR(100) COMMENT '邮箱',
        \`password\` VARCHAR(255) COMMENT '密码（加密）',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX \`idx_username\` (\`username\`),
        INDEX \`idx_email\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表'
    `);
    console.log('✅ 用户表创建成功');

    // 创建八字结果缓存表（可选，用于缓存计算结果）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`bazi_cache\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`datetime\` VARCHAR(50) NOT NULL COMMENT '出生时间',
        \`gender\` INT DEFAULT 1 COMMENT '性别',
        \`sect\` INT DEFAULT 0 COMMENT '流派',
        \`result\` TEXT COMMENT '计算结果（JSON）',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`expires_at\` TIMESTAMP NULL COMMENT '过期时间',
        UNIQUE KEY \`uk_params\` (\`datetime\`, \`gender\`, \`sect\`),
        INDEX \`idx_expires_at\` (\`expires_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='八字结果缓存表'
    `);
    console.log('✅ 八字结果缓存表创建成功');

    console.log('\n🎉 数据库初始化完成！');
    console.log(`📊 数据库名: ${DB_NAME}`);
    console.log('📋 已创建的表:');
    console.log('   - query_records (查询记录表)');
    console.log('   - users (用户表)');
    console.log('   - bazi_cache (八字结果缓存表)');

  } catch (error) {
    console.error('\n❌ 数据库初始化失败!');
    console.error(`错误信息: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 可能的原因:');
      console.error('   1. MySQL 服务未启动');
      console.error('   2. 数据库主机或端口配置错误');
      console.error('   3. 防火墙阻止连接');
      console.error('\n🔧 解决方案:');
      console.error('   1. 检查 MySQL 服务是否运行:');
      console.error('      Windows: 打开"服务"管理器，查找 MySQL 服务并启动');
      console.error('      Linux/Mac: sudo service mysql start 或 sudo systemctl start mysql');
      console.error('   2. 检查 .env 文件中的数据库配置是否正确');
      console.error('   3. 确认 MySQL 端口是否正确（默认 3306）');
      console.error('\n📝 当前配置:');
      console.error(`   DB_HOST=${config.host}`);
      console.error(`   DB_PORT=${config.port || '未设置'}`);
      console.error(`   DB_USER=${config.user}`);
      console.error(`   DB_PASSWORD=${config.password ? '***' : '未设置'}`);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 可能的原因:');
      console.error('   1. 数据库用户名或密码错误');
      console.error('   2. 用户没有足够的权限');
      console.error('\n🔧 解决方案:');
      console.error('   1. 检查 .env 文件中的 DB_USER 和 DB_PASSWORD');
      console.error('   2. 确认数据库用户有创建数据库的权限');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 数据库不存在，但连接成功，将尝试创建...');
    } else {
      console.error('\n详细错误:', error);
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 运行初始化
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };

