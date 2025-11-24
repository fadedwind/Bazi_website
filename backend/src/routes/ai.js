const express = require('express');
const router = express.Router();
const AIService = require('../services/aiService');

const aiService = new AIService();

// 生成默认提示词
router.post('/generate-prompt', async (req, res) => {
  try {
    const { baziData } = req.body;
    
    if (!baziData) {
      return res.json({
        code: 400,
        msg: '缺少八字数据',
        data: null
      });
    }

    const prompt = AIService.generatePrompt(baziData);
    
    res.json({
      code: 200,
      msg: 'success',
      data: { prompt }
    });
  } catch (error) {
    console.error('生成提示词失败:', error);
    res.json({
      code: 500,
      msg: error.message || '生成提示词失败',
      data: null
    });
  }
});

// AI 对话接口
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.json({
        code: 400,
        msg: '缺少消息内容',
        data: null
      });
    }

    const response = await aiService.chat(message, conversationHistory);
    
    res.json({
      code: 200,
      msg: 'success',
      data: {
        response,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI 对话失败:', error);
    res.json({
      code: 500,
      msg: error.message || 'AI 对话失败',
      data: null
    });
  }
});

// AI 流式对话接口（WebSocket 或 SSE）
router.post('/chat-stream', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.json({
        code: 400,
        msg: '缺少消息内容',
        data: null
      });
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await aiService.chatStream(message, conversationHistory, (chunk) => {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('AI 流式对话失败:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

module.exports = router;



