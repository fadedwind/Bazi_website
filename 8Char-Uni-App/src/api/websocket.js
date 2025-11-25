/**
 * WebSocket API 封装
 * 用于网络编程课程讲解
 */
import { initWebSocket, getWebSocketClient } from '@/utils/websocket';

// WebSocket 客户端实例
let wsClient = null;

/**
 * 初始化 WebSocket 连接
 */
export async function initWS() {
  if (!wsClient) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';
    wsClient = await initWebSocket(wsUrl);
  }
  return wsClient;
}

/**
 * 通过 WebSocket 计算八字（实时推送进度）
 * @param {Object} data 八字计算参数
 * @param {Function} onProgress 进度回调
 * @param {Function} onComplete 完成回调
 * @param {Function} onError 错误回调
 */
export function calculateBaziWithWS(data, onProgress, onComplete, onError) {
  return new Promise(async (resolve, reject) => {
    try {
      // 确保 WebSocket 已连接
      if (!wsClient || !wsClient.isConnected) {
        await initWS();
      }

      // 监听进度消息
      wsClient.on('bazi_progress', (message) => {
        if (onProgress) {
          onProgress(message.progress, message.message);
        }
      });

      // 监听完成消息
      wsClient.on('bazi_result', (message) => {
        if (onComplete) {
          onComplete(message.data);
        }
        resolve(message.data);
      });

      // 监听错误消息
      wsClient.on('bazi_error', (message) => {
        if (onError) {
          onError(message.message);
        }
        reject(new Error(message.message));
      });

      // 发送计算请求
      wsClient.calculateBazi(data.datetime, data.gender, data.sect);

    } catch (error) {
      if (onError) {
        onError(error.message);
      }
      reject(error);
    }
  });
}

/**
 * 获取 WebSocket 客户端状态
 */
export function getWSStatus() {
  if (wsClient) {
    return wsClient.getStatus();
  }
  return { isConnected: false };
}

/**
 * 关闭 WebSocket 连接
 */
export function closeWS() {
  if (wsClient) {
    wsClient.close();
    wsClient = null;
  }
}




