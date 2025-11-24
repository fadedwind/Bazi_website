const pool = require('../config/database');

/**
 * 保存查询记录到数据库
 */
async function saveQueryRecord(data) {
  try {
    const { datetime, gender, sect, query_type, ip } = data;
    
    // 检查表是否存在，如果不存在则创建
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS query_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        datetime VARCHAR(50),
        gender INT,
        sect INT,
        query_type VARCHAR(50),
        ip VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 插入记录
    await pool.execute(
      'INSERT INTO query_records (datetime, gender, sect, query_type, ip) VALUES (?, ?, ?, ?, ?)',
      [datetime, gender, sect, query_type, ip]
    );

    return true;
  } catch (error) {
    console.error('保存查询记录失败:', error);
    throw error;
  }
}

module.exports = {
  saveQueryRecord
};


