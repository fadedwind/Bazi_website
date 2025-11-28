# WebSocket 使用说明

## 📋 概述

项目已集成 WebSocket 功能，用于实时进度显示和双向通信。

---

## 🔌 WebSocket 架构

### 后端

**文件**：`backend/src/websocket/server.js`

**功能**：
- WebSocket 服务器，监听 `/ws` 路径
- 处理客户端连接、消息、断开
- 支持八字计算请求（`bazi_calculate`）
- 实时推送计算进度（`bazi_progress`）
- 返回计算结果（`bazi_result`）

### 前端

**文件**：
- `8Char-Uni-App/src/utils/websocket.js` - WebSocket 客户端工具类
- `8Char-Uni-App/src/api/websocket.js` - WebSocket API 封装

**功能**：
- 连接 WebSocket 服务器
- 发送八字计算请求
- 接收实时进度更新
- 处理连接、断开、错误事件

---

## 📊 排八字流程（使用 WebSocket）

### 完整流程

1. **用户填写表单**（姓名、性别、时间、流派）
2. **点击"开始排盘"**
3. **前端自动连接 WebSocket**（如果未连接）
4. **发送计算请求**（`bazi_calculate`）
5. **接收实时进度消息**：
   - `0%` - 开始计算八字信息...
   - `20%` - 正在解析出生时间...
   - `40%` - 正在计算四柱...
   - `60%` - 正在分析十神关系...
   - `80%` - 正在计算大运流年...
   - `95%` - 正在生成最终结果...
   - `100%` - 计算完成
6. **接收最终结果**（`bazi_result`）
7. **保存数据并跳转到详情页**

### 代码示例

```javascript
// 前端调用
import { calculateBaziWithWS } from '@/api/websocket';

await calculateBaziWithWS(
  {
    datetime: "1990-01-01 12:00:00",
    gender: 1,
    sect: 0
  },
  // 进度回调
  (progress, message) => {
    uni.showLoading({
      title: `${message} (${progress}%)`
    });
  },
  // 完成回调
  async (data) => {
    // 处理返回数据
    detailStore.set(data.result);
    toDetail();
  },
  // 错误回调
  (error) => {
    uni.$u.toast(`计算失败：${error}`);
  }
);
```

---

## 📡 消息格式

### 客户端 → 服务器

```javascript
{
  type: 'bazi_calculate',
  payload: {
    datetime: "1990-01-01 12:00:00",
    gender: 1,
    sect: 0
  },
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

### 服务器 → 客户端（进度消息）

```javascript
{
  type: 'bazi_progress',
  progress: 40,
  message: "正在计算四柱...",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

### 服务器 → 客户端（结果消息）

```javascript
{
  type: 'bazi_result',
  progress: 100,
  data: {
    datetime: "1990-01-01 12:00:00",
    gender: 1,
    sect: 0,
    result: {
      // 完整的八字数据
      top: { year: '甲', month: '辛', day: '丙', time: '丙' },
      bottom: { year: '申', month: '未', day: '申', time: '申' },
      // ... 其他数据
    }
  },
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

### 服务器 → 客户端（错误消息）

```javascript
{
  type: 'bazi_error',
  message: "错误信息",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

---

## 🎯 使用场景

### 1. 排盘实时进度（已实现）

排盘时显示实时计算进度，提升用户体验。

### 2. 流式 AI 对话（可选）

AI 论命可以使用 WebSocket 实现流式响应，实时显示 AI 回复内容。

### 3. 实时通知（可选）

系统通知、计算结果推送等。

---

## 🔧 配置

### 开发环境

前端自动连接到：`ws://localhost:3000/ws`

### 生产环境

前端自动连接到：`wss://你的域名.com/ws`（如果使用 HTTPS）

**无需手动配置**，代码会自动检测当前域名和协议。

---

## ⚠️ 注意事项

1. **连接管理**：WebSocket 连接会保持打开状态，直到页面关闭
2. **错误处理**：如果 WebSocket 连接失败，当前代码会显示错误，但不会自动降级到 HTTP
3. **性能**：如果长时间不使用，可以考虑自动关闭连接

---

## 🚀 测试

1. 启动后端和前端服务
2. 打开浏览器开发者工具（F12）→ Network 标签 → WS 标签
3. 尝试排盘功能
4. 观察 WebSocket 连接和消息

---

## 📝 相关文档

- [完整部署指南](./完整部署指南.md)
- [项目运行方法](../8Char-Uni-App/ToRun.md)


