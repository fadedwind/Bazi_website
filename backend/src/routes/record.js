const express = require('express');
const router = express.Router();

// 数据库连接（可选）
let pool = null;
try {
  pool = require('../config/database');
} catch (error) {
  console.warn('⚠️  数据库模块加载失败，记录查询功能将不可用');
}

// 获取查询记录
router.get('/list', async (req, res) => {
  if (!pool) {
    return res.json({
      code: 503,
      msg: '数据库未配置，此功能不可用',
      data: null
    });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM query_records ORDER BY created_at DESC LIMIT 100');
    res.json({
      code: 200,
      msg: 'success',
      data: rows
    });
  } catch (error) {
    console.error('获取记录失败:', error);
    res.json({
      code: 500,
      msg: error.message,
      data: null
    });
  }
});

module.exports = router;


