# 本地运行方法

## 方式一：手动启动（推荐）

### 1. 启动后端服务

```bash
cd backend
npm run dev
```

后端服务将运行在：`http://localhost:3000`
- HTTP API: `http://localhost:3000/api/`
- WebSocket: `ws://localhost:3000/ws`

### 2. 启动前端服务

**新开一个终端窗口**，执行：

```bash
cd 8Char-Uni-App
npm run dev:h5
```

或者使用 yarn：

```bash
cd 8Char-Uni-App
yarn run dev:h5
```

（若没安装 yarn 则先 `npm install -g yarn`）

前端服务将运行在：`http://localhost:5173`

---

## 方式二：使用快速启动脚本（Windows）

如果之前创建了 `run-dev.ps1` 脚本，可以直接运行：

```powershell
.\run-dev.ps1
```

这会自动打开两个终端窗口，分别启动后端和前端。

---

## 注意事项

1. **启动顺序**：建议先启动后端，再启动前端
2. **端口占用**：确保 3000 和 5173 端口未被占用
3. **WebSocket**：前端会自动连接 WebSocket，无需手动配置
4. **环境变量**：后端需要配置 `.env` 文件（数据库、API 密钥等）

---

## 功能说明

- ✅ **HTTP API**：用于获取八字信息、古籍等
- ✅ **WebSocket**：用于实时进度显示（排盘时会显示计算进度）
- ✅ **AI 论命**：需要配置 `DEEPSEEK_API_KEY` 环境变量

---

## 测试

1. 打开浏览器访问：`http://localhost:5173`
2. 填写排盘表单
3. 点击"开始排盘"
4. 观察实时进度提示（WebSocket 功能）
5. 查看排盘结果