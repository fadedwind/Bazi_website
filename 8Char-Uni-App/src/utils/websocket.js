/**
 * WebSocket 客户端工具类
 * 用于网络编程课程讲解
 */

class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3秒
    this.listeners = new Map();
    this.isConnected = false;
    this.clientId = null;
  }

  // 连接 WebSocket
  connect() {
    return new Promise((resolve, reject) => {
      try {
        // 在 uni-app 中使用 WebSocket
        this.ws = uni.connectSocket({
          url: this.url,
          success: () => {
            console.log('🔌 WebSocket 连接中...');
          },
          fail: (err) => {
            console.error('❌ WebSocket 连接失败:', err);
            reject(err);
          }
        });

        // 监听连接打开
        this.ws.onOpen(() => {
          console.log('✅ WebSocket 连接成功');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        // 监听消息
        this.ws.onMessage((res) => {
          try {
            const data = JSON.parse(res.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('❌ 消息解析失败:', error);
          }
        });

        // 监听错误
        this.ws.onError((err) => {
          console.error('❌ WebSocket 错误:', err);
          this.isConnected = false;
          this.emit('error', err);
        });

        // 监听关闭
        this.ws.onClose(() => {
          console.log('❌ WebSocket 连接关闭');
          this.isConnected = false;
          this.emit('close');
          
          // 自动重连
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
              this.connect();
            }, this.reconnectInterval);
          }
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // 处理接收到的消息
  handleMessage(data) {
    console.log('📨 收到消息:', data.type, data);

    // 处理连接成功消息
    if (data.type === 'connection' && data.status === 'success') {
      this.clientId = data.clientId;
      console.log('🆔 客户端ID:', this.clientId);
    }

    // 触发对应的事件监听器
    this.emit(data.type, data);
    this.emit('message', data); // 通用消息事件
  }

  // 发送消息
  send(type, payload = {}) {
    if (!this.isConnected || !this.ws) {
      console.error('❌ WebSocket 未连接');
      return false;
    }

    const message = {
      type: type,
      payload: payload,
      timestamp: new Date().toISOString()
    };

    try {
      this.ws.send({
        data: JSON.stringify(message),
        success: () => {
          console.log('📤 发送消息:', type);
        },
        fail: (err) => {
          console.error('❌ 发送消息失败:', err);
        }
      });
      return true;
    } catch (error) {
      console.error('❌ 发送消息异常:', error);
      return false;
    }
  }

  // 发送八字计算请求
  calculateBazi(datetime, gender = 1, sect = 0) {
    return this.send('bazi_calculate', {
      datetime: datetime,
      gender: gender,
      sect: sect
    });
  }

  // 发送心跳
  ping() {
    return this.send('ping');
  }

  // 订阅频道
  subscribe(channel) {
    return this.send('subscribe', { channel: channel });
  }

  // 监听事件
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // 移除监听器
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 触发事件
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ 事件回调错误 (${event}):`, error);
        }
      });
    }
  }

  // 关闭连接
  close() {
    if (this.ws) {
      this.ws.close({
        success: () => {
          console.log('🔌 WebSocket 已关闭');
        }
      });
      this.ws = null;
      this.isConnected = false;
    }
  }

  // 获取连接状态
  getStatus() {
    return {
      isConnected: this.isConnected,
      clientId: this.clientId,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// 创建单例实例
let wsClient = null;

/**
 * 获取 WebSocket 客户端实例
 * @param {string} url WebSocket 服务器地址
 * @returns {WebSocketClient}
 */
export function getWebSocketClient(url = null) {
  if (!wsClient && url) {
    wsClient = new WebSocketClient(url);
  }
  return wsClient;
}

/**
 * 初始化 WebSocket 连接
 * @param {string} url WebSocket 服务器地址，默认从环境变量获取
 * @returns {Promise<WebSocketClient>}
 */
export function initWebSocket(url = null) {
  const wsUrl = url || (import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws');
  wsClient = new WebSocketClient(wsUrl);
  return wsClient.connect().then(() => wsClient);
}

export default WebSocketClient;



