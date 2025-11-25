/**
 * AI 分析 API
 */
import { APP_API, Post } from '@/utils/request';

/**
 * 生成默认提示词
 * @param {Object} baziData - 八字数据
 * @returns {Promise<Object>}
 */
export function generateAIPrompt(baziData) {
  return Post('/ai/generate-prompt', { baziData }, APP_API);
}

/**
 * AI 对话
 * @param {string} message - 用户消息
 * @param {Array} conversationHistory - 对话历史
 * @returns {Promise<Object>}
 */
export function chatWithAI(message, conversationHistory = []) {
  return Post('/ai/chat', { 
    message, 
    conversationHistory 
  }, APP_API);
}


