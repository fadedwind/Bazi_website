const express = require('express');
const router = express.Router();
const AIService = require('../services/aiService');

// 延迟初始化，确保环境变量已加载
let aiService = null;
function getAIService() {
  if (!aiService) {
    try {
      aiService = new AIService();
    } catch (error) {
      console.error('❌ AI 服务初始化失败:', error.message);
      throw error;
    }
  }
  return aiService;
}

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

    const response = await getAIService().chat(message, conversationHistory);
    
    // 确保 response 是字符串
    if (typeof response !== 'string') {
      console.error('AI 返回格式异常:', typeof response, response);
      throw new Error('AI 服务返回数据格式错误');
    }
    
    res.json({
      code: 200,
      msg: 'success',
      data: {
        response: response,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI 对话失败:', error);
    // 如果是配置错误，返回更友好的提示
    const errorMessage = error.message.includes('DEEPSEEK_API_KEY') 
      ? 'AI 服务未配置，请联系管理员' 
      : error.message || 'AI 对话失败';
    res.json({
      code: 500,
      msg: errorMessage,
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

    await getAIService().chatStream(message, conversationHistory, (chunk) => {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('AI 流式对话失败:', error);
    // 如果是配置错误，返回更友好的提示
    const errorMessage = error.message.includes('DEEPSEEK_API_KEY') 
      ? 'AI 服务未配置，请联系管理员' 
      : error.message || 'AI 对话失败';
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

module.exports = router;



