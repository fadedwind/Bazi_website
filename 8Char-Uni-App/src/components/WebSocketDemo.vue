<template>
  <view class="websocket-demo">
    <view class="header">
      <text class="title">WebSocket 实时通信演示</text>
      <text class="status" :class="{ connected: wsStatus.isConnected }">
        {{ wsStatus.isConnected ? '🟢 已连接' : '🔴 未连接' }}
      </text>
    </view>

    <view class="section">
      <text class="section-title">连接控制</text>
      <view class="button-group">
        <button @click="connectWS" :disabled="wsStatus.isConnected">连接</button>
        <button @click="disconnectWS" :disabled="!wsStatus.isConnected">断开</button>
        <button @click="sendPing">发送心跳</button>
      </view>
    </view>

    <view class="section">
      <text class="section-title">八字计算（实时进度）</text>
      <view class="input-group">
        <input v-model="baziData.datetime" placeholder="出生时间 (YYYY-MM-DD HH:mm:ss)" />
        <picker mode="selector" :range="genderOptions" @change="onGenderChange">
          <view>性别: {{ genderOptions[baziData.gender] }}</view>
        </picker>
      </view>
      <button @click="calculateBazi" :disabled="!wsStatus.isConnected || calculating">
        {{ calculating ? '计算中...' : '开始计算' }}
      </button>
      
      <!-- 进度条 -->
      <view v-if="progress > 0" class="progress-container">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progress + '%' }"></view>
        </view>
        <text class="progress-text">{{ progress }}% - {{ progressMessage }}</text>
      </view>

      <!-- 结果显示 -->
      <view v-if="result" class="result-container">
        <text class="result-title">计算结果：</text>
        <text class="result-content">{{ JSON.stringify(result, null, 2) }}</text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">消息日志</text>
      <view class="log-container">
        <view v-for="(log, index) in messageLogs" :key="index" class="log-item">
          <text class="log-time">{{ log.time }}</text>
          <text class="log-type">{{ log.type }}</text>
          <text class="log-message">{{ log.message }}</text>
        </view>
      </view>
      <button @click="clearLogs">清空日志</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { initWebSocket, getWebSocketClient } from '@/utils/websocket';
import { calculateBaziWithWS, closeWS, getWSStatus } from '@/api/websocket';

const wsStatus = ref({ isConnected: false });
const wsClient = ref(null);
const messageLogs = ref([]);
const calculating = ref(false);
const progress = ref(0);
const progressMessage = ref('');
const result = ref(null);

const baziData = ref({
  datetime: '1990-01-01 12:00:00',
  gender: 0
});

const genderOptions = ['男', '女'];

function addLog(type, message) {
  messageLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    type: type,
    message: message
  });
  // 限制日志数量
  if (messageLogs.value.length > 50) {
    messageLogs.value = messageLogs.value.slice(0, 50);
  }
}

function clearLogs() {
  messageLogs.value = [];
}

function onGenderChange(e) {
  baziData.value.gender = e.detail.value;
}

async function connectWS() {
  try {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';
    wsClient.value = await initWebSocket(wsUrl);
    
    // 监听连接事件
    wsClient.value.on('connection', (data) => {
      wsStatus.value = wsClient.value.getStatus();
      addLog('连接', `连接成功，客户端ID: ${data.clientId}`);
    });

    // 监听所有消息
    wsClient.value.on('message', (data) => {
      addLog('消息', JSON.stringify(data));
    });

    // 监听错误
    wsClient.value.on('error', (error) => {
      addLog('错误', error.message || '连接错误');
      wsStatus.value = wsClient.value.getStatus();
    });

    // 监听关闭
    wsClient.value.on('close', () => {
      addLog('连接', '连接已关闭');
      wsStatus.value = { isConnected: false };
    });

    wsStatus.value = wsClient.value.getStatus();
    addLog('连接', '正在连接...');
  } catch (error) {
    addLog('错误', error.message);
  }
}

function disconnectWS() {
  if (wsClient.value) {
    closeWS();
    wsStatus.value = { isConnected: false };
    addLog('连接', '已断开连接');
  }
}

function sendPing() {
  if (wsClient.value) {
    wsClient.value.ping();
    addLog('发送', '发送心跳包');
  }
}

async function calculateBazi() {
  if (!wsStatus.value.isConnected) {
    uni.showToast({ title: '请先连接 WebSocket', icon: 'none' });
    return;
  }

  calculating.value = true;
  progress.value = 0;
  progressMessage.value = '';
  result.value = null;

  try {
    await calculateBaziWithWS(
      baziData.value,
      // 进度回调
      (prog, msg) => {
        progress.value = prog;
        progressMessage.value = msg;
        addLog('进度', `${prog}% - ${msg}`);
      },
      // 完成回调
      (data) => {
        result.value = data;
        calculating.value = false;
        progress.value = 100;
        addLog('完成', '计算完成');
        uni.showToast({ title: '计算完成', icon: 'success' });
      },
      // 错误回调
      (error) => {
        calculating.value = false;
        addLog('错误', error);
        uni.showToast({ title: error, icon: 'none' });
      }
    );
  } catch (error) {
    calculating.value = false;
    addLog('错误', error.message);
  }
}

onMounted(() => {
  wsStatus.value = getWSStatus();
});

onUnmounted(() => {
  disconnectWS();
});
</script>

<style scoped>
.websocket-demo {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.status {
  font-size: 14px;
}

.status.connected {
  color: #4caf50;
}

.section {
  margin-bottom: 30px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  display: block;
}

.button-group {
  display: flex;
  gap: 10px;
}

.button-group button {
  flex: 1;
  padding: 10px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 4px;
}

.input-group {
  margin-bottom: 15px;
}

.input-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

.progress-container {
  margin-top: 15px;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: #4caf50;
  transition: width 0.3s;
}

.progress-text {
  font-size: 14px;
  color: #666;
}

.result-container {
  margin-top: 15px;
  padding: 15px;
  background: white;
  border-radius: 4px;
}

.result-title {
  font-weight: bold;
  margin-bottom: 10px;
  display: block;
}

.result-content {
  font-size: 12px;
  color: #333;
  white-space: pre-wrap;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  background: white;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.log-item {
  padding: 5px 0;
  border-bottom: 1px solid #eee;
  font-size: 12px;
}

.log-time {
  color: #999;
  margin-right: 10px;
}

.log-type {
  color: #007aff;
  margin-right: 10px;
  font-weight: bold;
}

.log-message {
  color: #333;
}
</style>












