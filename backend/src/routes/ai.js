const express = require('express');
const router = express.Router();

// AI 分析路由（占位，待实现）
router.post('/analyze', async (req, res) => {
  res.json({
    code: 200,
    msg: 'success',
    data: { message: 'AI 分析功能待实现' }
  });
});

module.exports = router;


