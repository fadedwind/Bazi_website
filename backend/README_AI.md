# AI 论命功能说明

## 功能概述

AI 论命功能使用 DeepSeek API 提供智能八字分析服务，用户可以通过对话方式获取专业的命理分析。

## 配置说明

### 1. 环境变量配置

在 `backend/.env` 文件中添加：

```env
DEEPSEEK_API_KEY=sk-d6868c7ecf424bfda5a52a79c568ca28
```

如果未配置，代码会使用默认的 API Key（不推荐用于生产环境）。

### 2. 安装依赖

```bash
cd backend
npm install openai
```

## API 接口

### 1. 生成默认提示词

**接口**: `POST /api/ai/generate-prompt`

**请求体**:
```json
{
  "baziData": {
    "top": {
      "year": "甲",
      "month": "辛",
      "day": "丙",
      "time": "丙"
    },
    "bottom": {
      "year": "申",
      "month": "未",
      "day": "申",
      "time": "申"
    },
    "gender": 1,
    "datetime": {
      "solar": "2004-07-16 15:30:00",
      "lunar": "甲申年六月三十"
    }
  }
}
```

**响应**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "prompt": "八字分析专家提示词：\n\n你是一位资深命理专家..."
  }
}
```

### 2. AI 对话接口

**接口**: `POST /api/ai/chat`

**请求体**:
```json
{
  "message": "请分析我的八字格局",
  "conversationHistory": [
    {
      "role": "user",
      "content": "之前的消息"
    },
    {
      "role": "assistant",
      "content": "AI 的回复"
    }
  ]
}
```

**响应**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "response": "根据您的八字分析...",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## 前端使用

### 1. 组件位置

`8Char-Uni-App/src/pages/detail/components/index/ai-chat/ai-chat.vue`

### 2. 功能特性

- ✅ 自动加载默认提示词（基于当前排盘结果）
- ✅ 用户可编辑提示词
- ✅ 支持多轮对话
- ✅ 实时显示 AI 回复
- ✅ 对话历史管理

### 3. 使用流程

1. 用户完成八字排盘
2. 切换到 "AI论命" 标签页
3. 系统自动生成并填充默认提示词
4. 用户可编辑提示词或直接发送
5. AI 返回分析结果
6. 用户可以继续提问，进行多轮对话

## 提示词模板

默认提示词包含以下内容：

1. **基础信息**: 八字、性别、排盘时间
2. **分析要求**:
   - 日主旺衰分析
   - 格局判定
   - 喜用神详细论证
   - 忌神分析
   - 大运走势分析（重点分析未来10年）
   - 流年提醒
   - 实用建议
3. **输出格式**: 专业但易懂的语言

## 注意事项

1. **API 密钥安全**: 生产环境请将 API Key 存储在环境变量中，不要硬编码
2. **请求频率**: DeepSeek API 可能有频率限制，建议添加请求限流
3. **错误处理**: 已实现基本的错误处理，但可根据需要增强
4. **成本控制**: 注意 API 调用成本，可考虑添加缓存机制

## 测试

1. 启动后端服务: `npm run dev`
2. 启动前端服务: `npm run dev:h5`
3. 完成八字排盘
4. 切换到 "AI论命" 标签页
5. 查看是否自动加载默认提示词
6. 发送消息测试 AI 回复

