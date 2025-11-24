const WebSocket = require('ws');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      perMessageDeflate: false
    });
    this.clients = new Map(); // 存储客户端连接
    this.init();
  }

  init() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const clientInfo = {
        id: clientId,
        ip: req.socket.remoteAddress,
        connectedAt: new Date(),
        ws: ws
      };
      
      this.clients.set(clientId, clientInfo);
      console.log(`✅ WebSocket 客户端连接: ${clientId} (IP: ${clientInfo.ip})`);
      console.log(`📊 当前连接数: ${this.clients.size}`);

      // 发送欢迎消息
      this.send(ws, {
        type: 'connection',
        status: 'success',
        clientId: clientId,
        message: 'WebSocket 连接成功',
        timestamp: new Date().toISOString()
      });

      // 处理消息
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, clientId, data);
        } catch (error) {
          console.error('❌ 消息解析失败:', error);
          this.send(ws, {
            type: 'error',
            message: '消息格式错误',
            timestamp: new Date().toISOString()
          });
        }
      });

      // 处理关闭
      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`❌ WebSocket 客户端断开: ${clientId}`);
        console.log(`📊 当前连接数: ${this.clients.size}`);
      });

      // 处理错误
      ws.on('error', (error) => {
        console.error(`❌ WebSocket 错误 (${clientId}):`, error);
        this.clients.delete(clientId);
      });

      // 心跳检测
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
    });

    // 心跳检测间隔
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30秒检测一次
  }

  // 生成客户端ID
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 处理消息
  handleMessage(ws, clientId, data) {
    console.log(`📨 收到消息 (${clientId}):`, data.type);

    switch (data.type) {
      case 'ping':
        this.send(ws, {
          type: 'pong',
          timestamp: new Date().toISOString()
        });
        break;

      case 'bazi_calculate':
        // 八字计算请求 - 模拟实时计算过程
        this.handleBaziCalculation(ws, clientId, data.payload);
        break;

      case 'subscribe':
        // 订阅特定频道
        this.send(ws, {
          type: 'subscribe_success',
          channel: data.channel,
          message: '订阅成功',
          timestamp: new Date().toISOString()
        });
        break;

      default:
        this.send(ws, {
          type: 'error',
          message: `未知的消息类型: ${data.type}`,
          timestamp: new Date().toISOString()
        });
    }
  }

  // 处理八字计算（使用真实的八字计算逻辑）
  async handleBaziCalculation(ws, clientId, payload) {
    const { datetime, gender, sect } = payload;
    
    if (!datetime) {
      this.send(ws, {
        type: 'bazi_error',
        message: '缺少必要参数',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      // 发送计算开始消息
      this.send(ws, {
        type: 'bazi_progress',
        progress: 0,
        message: '开始计算八字信息...',
        timestamp: new Date().toISOString()
      });

      // 实际计算步骤（分阶段推送）
      const steps = [
        { progress: 20, message: '正在解析出生时间...' },
        { progress: 40, message: '正在计算四柱...' },
        { progress: 60, message: '正在分析十神关系...' },
        { progress: 80, message: '正在计算大运流年...' },
        { progress: 95, message: '正在生成最终结果...' }
      ];

      for (const step of steps) {
        await this.delay(300); // 模拟计算延迟
        this.send(ws, {
          type: 'bazi_progress',
          progress: step.progress,
          message: step.message,
          timestamp: new Date().toISOString()
        });
      }

      // 调用真实的八字计算服务
      const BaziService = require('../services/baziService');
      const baziData = BaziService.calculateBazi(datetime, gender || 1, sect || 0);

      // 发送最终结果
      await this.delay(200);
      this.send(ws, {
        type: 'bazi_result',
        progress: 100,
        data: {
          datetime: datetime,
          gender: gender || 1,
          sect: sect || 0,
          message: '计算完成',
          result: baziData,
          calculatedAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('八字计算错误:', error);
      this.send(ws, {
        type: 'bazi_error',
        message: error.message || '八字计算失败',
        timestamp: new Date().toISOString()
      });
    }
  }

  // 发送消息
  send(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // 广播消息给所有客户端
  broadcast(data) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        this.send(client, data);
      }
    });
  }

  // 发送给特定客户端
  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, data);
      return true;
    }
    return false;
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取连接统计
  getStats() {
    return {
      totalConnections: this.clients.size,
      clients: Array.from(this.clients.values()).map(client => ({
        id: client.id,
        ip: client.ip,
        connectedAt: client.connectedAt
      }))
    };
  }

  // 关闭服务器
  close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close();
  }
}

module.exports = WebSocketServer;


