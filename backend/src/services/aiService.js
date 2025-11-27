/**
 * AI 分析服务
 * 使用 DeepSeek API 进行八字分析
 */
const OpenAI = require('openai');
require('dotenv').config();

class AIService {
  constructor() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      // 不抛出错误，而是标记为未配置，允许其他功能正常工作
      this.isConfigured = false;
      this.apiKey = null;
      this.openai = null;
      console.warn('⚠️  DEEPSEEK_API_KEY 未配置，AI 功能将不可用。如需使用 AI 功能，请在 .env 文件中设置 DEEPSEEK_API_KEY');
      return;
    }

    this.isConfigured = true;
    this.apiKey = apiKey;
    this.openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: apiKey,
    });
  }

  /**
   * 生成八字分析提示词
   * @param {Object} baziData - 八字数据
   * @returns {string} 提示词
   */
  static generatePrompt(baziData) {
    const { top, bottom, gender, datetime } = baziData;
    
    // 构建八字字符串
    const baziString = `${top.year}${bottom.year} ${top.month}${bottom.month} ${top.day}${bottom.day} ${top.time}${bottom.time}`;
    const genderText = gender === 1 ? '男' : '女';
    const currentTime = new Date().toLocaleString('zh-CN');

    return `八字分析专家提示词：

你是一位资深命理专家，请基于传统子平八字理论分析以下命造：

【基础信息】
八字：${baziString}
性别：${genderText}
排盘时间：${currentTime}

【分析要求】
1. 日主旺衰分析
2. 格局判定
3. 喜用神详细论证
4. 忌神分析
5. 大运走势分析（重点分析未来10年）
6. 流年提醒
7. 实用建议

【输出格式】
请用专业但易懂的语言，包含具体例证，避免过于玄学术语。`;
  }

  /**
   * 调用 DeepSeek API 进行分析
   * @param {string} userMessage - 用户消息
   * @param {Array} conversationHistory - 对话历史
   * @returns {Promise<string>} AI 回复
   */
  async chat(userMessage, conversationHistory = []) {
    // 检查是否已配置
    if (!this.isConfigured || !this.openai) {
      throw new Error('AI 服务未配置，请在 .env 文件中设置 DEEPSEEK_API_KEY');
    }

    try {
      // 构建消息历史
      const messages = [
        {
          role: 'system',
          content: '你是一位资深命理专家，精通传统子平八字理论，能够准确分析命造格局、喜用神、大运流年等。请用专业但易懂的语言回答用户问题。'
        },
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage
        }
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API 调用失败:', error);
      throw new Error(`AI 分析失败: ${error.message || '未知错误'}`);
    }
  }

  /**
   * 流式调用 DeepSeek API（用于实时显示）
   * @param {string} userMessage - 用户消息
   * @param {Array} conversationHistory - 对话历史
   * @param {Function} onChunk - 接收数据块的回调
   * @returns {Promise<string>} 完整回复
   */
  async chatStream(userMessage, conversationHistory = [], onChunk) {
    // 检查是否已配置
    if (!this.isConfigured || !this.openai) {
      throw new Error('AI 服务未配置，请在 .env 文件中设置 DEEPSEEK_API_KEY');
    }

    try {
      const messages = [
        {
          role: 'system',
          content: '你是一位资深命理专家，精通传统子平八字理论，能够准确分析命造格局、喜用神、大运流年等。请用专业但易懂的语言回答用户问题。'
        },
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage
        }
      ];

      const stream = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true
      });

      let fullContent = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          if (onChunk) {
            onChunk(content);
          }
        }
      }

      return fullContent;
    } catch (error) {
      console.error('DeepSeek API 流式调用失败:', error);
      throw new Error(`AI 分析失败: ${error.message || '未知错误'}`);
    }
  }
}

module.exports = AIService;

