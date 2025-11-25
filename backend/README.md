# 八字排盘后端服务

## 📋 项目说明

基于 Node.js + Express + WebSocket 的八字排盘后端服务，支持 HTTP REST API 和 WebSocket 实时通信。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

#### 方式一：本地开发环境

1. 确保已安装 MySQL
2. 复制 `.env.example` 为 `.env`：
   ```bash
   cp .env.example .env
   ```
3. 编辑 `.env` 文件，配置数据库信息：
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=bazi_db
   ```

#### 方式二：虚拟主机环境

虚拟主机通常会提供数据库管理面板，获取以下信息：
- 数据库主机（通常是 `localhost`）
- 数据库端口（通常是 `3306`，某些虚拟主机可能不需要）
- 数据库用户名
- 数据库密码
- 数据库名称

在 `.env` 文件中配置：
```env
DB_HOST=localhost
DB_PORT=3306  # 如果虚拟主机不需要端口，可以删除这一行
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
```

### 3. 初始化数据库

运行数据库初始化脚本，自动创建数据库和表结构：

```bash
npm run init-db
```

这将创建以下表：
- `query_records` - 查询记录表
- `users` - 用户表（可选）
- `bazi_cache` - 八字结果缓存表（可选）

### 4. 启动服务

#### 开发模式（自动重启）

```bash
npm run dev
```

#### 生产模式

```bash
npm start
```

服务启动后：
- HTTP 服务器：`http://localhost:3000`
- WebSocket 服务器：`ws://localhost:3000/ws`
- 健康检查：`http://localhost:3000/health`

## 📁 项目结构

```
backend/
├── src/
│   ├── config/
│   │   └── database.js      # 数据库配置
│   ├── database/
│   │   └── init.js          # 数据库初始化脚本
│   ├── routes/
│   │   ├── bazi.js          # 八字相关路由
│   │   ├── ai.js            # AI 分析路由
│   │   └── record.js        # 查询记录路由
│   ├── utils/
│   │   └── record.js        # 记录工具函数
│   ├── websocket/
│   │   └── server.js        # WebSocket 服务器
│   └── index.js             # 入口文件
├── .env                     # 环境变量配置（需要创建）
├── .env.example            # 环境变量模板
└── package.json
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DB_HOST` | 数据库主机 | `localhost` |
| `DB_PORT` | 数据库端口 | `3306` |
| `DB_USER` | 数据库用户名 | `root` |
| `DB_PASSWORD` | 数据库密码 | 空 |
| `DB_NAME` | 数据库名称 | `bazi_db` |
| `PORT` | 服务器端口 | `3000` |
| `NODE_ENV` | 环境模式 | `development` |
| `FRONTEND_URL` | 前端地址（CORS） | `http://localhost:5173` |

### 虚拟主机部署注意事项

1. **数据库配置**
   - 虚拟主机通常使用 `localhost` 作为数据库主机
   - 某些虚拟主机可能不需要指定端口
   - 数据库用户名和密码由虚拟主机提供

2. **端口配置**
   - 虚拟主机可能使用环境变量或固定端口
   - 某些虚拟主机可能不支持自定义端口

3. **环境变量**
   - 某些虚拟主机可能不支持 `.env` 文件
   - 需要在控制面板中配置环境变量
   - 或使用硬编码配置（不推荐）

4. **文件权限**
   - 确保服务器有读写权限
   - 某些虚拟主机可能需要特定的文件权限设置

## 📡 API 接口

### HTTP REST API

#### 获取提示信息
```
GET /api/8char/get-tips
```

#### 获取版本信息
```
GET /api/8char/get-version
```

#### 获取八字信息
```
POST /api/8char/get-info
Body: {
  "datetime": "1990-01-01 12:00:00",
  "gender": 1,
  "sect": 0
}
```

#### 获取古籍参考
```
POST /api/8char/get-book
```

#### 获取预测信息
```
POST /api/8char/get-prediction
```

### WebSocket API

连接地址：`ws://your-domain.com/ws`

#### 消息格式

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

**服务器响应：**
```json
{
  "type": "bazi_progress",
  "progress": 50,
  "message": "正在计算...",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

## 🛠️ 开发命令

```bash
# 安装依赖
npm install

# 开发模式（自动重启）
npm run dev

# 生产模式
npm start

# 初始化数据库
npm run init-db
```

## 📝 数据库表结构

### query_records（查询记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| datetime | VARCHAR(50) | 出生时间 |
| gender | INT | 性别（1-男，2-女） |
| sect | INT | 流派 |
| query_type | VARCHAR(50) | 查询类型 |
| ip | VARCHAR(50) | 客户端IP |
| created_at | TIMESTAMP | 创建时间 |

## 🔍 故障排查

### 数据库连接失败

1. 检查 MySQL 服务是否运行
2. 检查 `.env` 文件中的数据库配置
3. 检查数据库用户权限
4. 运行 `npm run init-db` 初始化数据库

### WebSocket 连接失败

1. 检查服务器是否启动
2. 检查防火墙设置
3. 检查 WebSocket 路径是否正确（`/ws`）

### 虚拟主机部署问题

1. 检查文件权限
2. 检查 Node.js 版本（建议 16+）
3. 检查环境变量配置
4. 查看虚拟主机日志

## 📚 相关文档

- [Express 文档](https://expressjs.com/)
- [WebSocket (ws) 文档](https://github.com/websockets/ws)
- [MySQL2 文档](https://github.com/sidorares/node-mysql2)

## 📄 许可证

MIT





