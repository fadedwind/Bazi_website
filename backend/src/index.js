const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // 生产环境建议指定前端域名
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined')); // 日志

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
});
app.use('/api/', limiter);

// 路由
const baziRoutes = require('./routes/bazi');
const aiRoutes = require('./routes/ai');
const recordRoutes = require('./routes/record');

app.use('/api/8char', baziRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/record', recordRoutes);

// WebSocket 服务器
const WebSocketServer = require('./websocket/server');
const wss = new WebSocketServer(server);
app.locals.wss = wss; // 将 WebSocket 服务器挂载到 app 上，供路由使用

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    code: 404, 
    msg: '接口不存在',
    data: null 
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    code: 500, 
    msg: err.message || '服务器内部错误',
    data: null 
  });
});

server.listen(PORT, () => {
  console.log(`🚀 HTTP 服务器运行在端口 ${PORT}`);
  console.log(`🔌 WebSocket 服务器运行在 ws://localhost:${PORT}/ws`);
  console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
});

