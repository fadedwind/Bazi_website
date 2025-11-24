# WebSocket 功能独立运行指南

## 📋 说明

本项目支持**仅使用 WebSocket 功能**，无需配置数据库。数据库是可选的，主要用于：
- 查询记录存储
- 用户管理（可选功能）
- 结果缓存（可选功能）

**WebSocket 实时通信功能可以完全独立运行，不依赖数据库。**

## 🚀 快速启动（无需数据库）

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务器

```bash
npm run dev
```

你会看到：
```
🚀 HTTP 服务器运行在端口 3000
🔌 WebSocket 服务器运行在 ws://localhost:3000/ws
📝 环境: development
⚠️  数据库连接失败（不影响 WebSocket 功能）: ...
```

**这是正常的！** WebSocket 功能已经可以使用了。

### 3. 测试 WebSocket

#### 使用浏览器控制台测试

打开浏览器控制台（F12），运行：

```javascript
// 连接 WebSocket
const ws = new WebSocket('ws://localhost:3000/ws');

// 监听连接
ws.onopen = () => {
  console.log('✅ WebSocket 连接成功');
  
  // 发送消息
  ws.send(JSON.stringify({
    type: 'ping'
  }));
};

// 监听消息
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('📨 收到消息:', data);
};

// 监听错误
ws.onerror = (error) => {
  console.error('❌ WebSocket 错误:', error);
};

// 监听关闭
ws.onclose = () => {
  console.log('🔌 WebSocket 连接关闭');
};
```

#### 测试八字计算（实时进度推送）

```javascript
ws.send(JSON.stringify({
  type: 'bazi_calculate',
  payload: {
    datetime: '1990-01-01 12:00:00',
    gender: 1,
    sect: 0
  }
}));
```

你会收到实时的进度推送：
- `bazi_progress` - 计算进度（0% → 100%）
- `bazi_result` - 最终结果

## 📡 WebSocket API

### 连接地址

```
ws://localhost:3000/ws
```

### 支持的消息类型

#### 1. 心跳检测

**客户端发送：**
```json
{
  "type": "ping"
}
```

**服务器响应：**
```json
{
  "type": "pong",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### 2. 八字计算（实时进度）

**客户端发送：**
```json
{
  "type": "bazi_calculate",
  "payload": {
    "datetime": "1990-01-01 12:00:00",
    "gender": 1,
    "sect": 0
  }
}
```

**服务器响应（进度推送）：**
```json
{
  "type": "bazi_progress",
  "progress": 50,
  "message": "正在计算...",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

**服务器响应（最终结果）：**
```json
{
  "type": "bazi_result",
  "progress": 100,
  "data": {
    "datetime": "1990-01-01 12:00:00",
    "gender": 1,
    "sect": 0,
    "result": {
      "pillars": "示例结果",
      "calculatedAt": "2025-01-01T12:00:00.000Z"
    }
  },
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### 3. 订阅频道

**客户端发送：**
```json
{
  "type": "subscribe",
  "channel": "channel_name"
}
```

**服务器响应：**
```json
{
  "type": "subscribe_success",
  "channel": "channel_name",
  "message": "订阅成功",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

## 🔧 前端使用

### 1. 使用 WebSocket 工具类

```javascript
import { initWebSocket, getWebSocketClient } from '@/utils/websocket';

// 初始化连接
const wsClient = await initWebSocket('ws://localhost:3000/ws');

// 监听消息
wsClient.on('bazi_progress', (data) => {
  console.log('进度:', data.progress, data.message);
});

wsClient.on('bazi_result', (data) => {
  console.log('结果:', data.data);
});

// 发送计算请求
wsClient.calculateBazi('1990-01-01 12:00:00', 1, 0);
```

### 2. 使用封装好的 API

```javascript
import { calculateBaziWithWS } from '@/api/websocket';

calculateBaziWithWS(
  { datetime: '1990-01-01 12:00:00', gender: 1, sect: 0 },
  // 进度回调
  (progress, message) => {
    console.log(`${progress}% - ${message}`);
  },
  // 完成回调
  (result) => {
    console.log('计算完成:', result);
  },
  // 错误回调
  (error) => {
    console.error('错误:', error);
  }
);
```

## 📊 功能对比

| 功能 | 需要数据库 | 说明 |
|------|-----------|------|
| WebSocket 实时通信 | ❌ | 完全独立运行 |
| 八字计算（实时进度） | ❌ | 完全独立运行 |
| 消息推送 | ❌ | 完全独立运行 |
| 查询记录存储 | ✅ | 需要数据库 |
| 用户管理 | ✅ | 需要数据库 |
| 结果缓存 | ✅ | 需要数据库 |

## 🎯 网络编程课程重点

### WebSocket 核心概念

1. **双向通信**
   - 客户端和服务器都可以主动发送消息
   - 不同于 HTTP 的请求/响应模式

2. **持久连接**
   - 连接建立后保持打开状态
   - 无需每次请求都建立新连接

3. **实时推送**
   - 服务器可以主动推送数据
   - 适合实时进度、通知等场景

4. **消息格式**
   - 使用 JSON 格式
   - 通过 `type` 字段区分消息类型

### 实际应用场景

- ✅ 实时计算进度推送（八字计算）
- ✅ 在线用户统计
- ✅ 实时通知系统
- ✅ 聊天应用
- ✅ 实时数据监控

## 🔍 调试技巧

### 1. 查看服务器日志

服务器会输出所有 WebSocket 连接和消息：
```
✅ WebSocket 客户端连接: client_1234567890_abc123
📨 收到消息 (client_1234567890_abc123): bazi_calculate
```

### 2. 使用浏览器开发者工具

- Network 标签 → WS (WebSocket)
- 可以看到所有 WebSocket 消息

### 3. 使用 WebSocket 测试工具

- [WebSocket King](https://websocketking.com/)
- [Simple WebSocket Client](https://chrome.google.com/webstore/detail/simple-websocket-client)

## 📝 总结

**WebSocket 功能完全独立，无需数据库即可使用！**

- ✅ 可以立即开始使用 WebSocket
- ✅ 可以测试所有实时通信功能
- ✅ 数据库是可选的，后续需要时再配置

---

**需要数据库时：**
1. 配置 `.env` 文件
2. 运行 `npm run init-db`
3. 重启服务器


