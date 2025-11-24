<template>
  <view class="ai-chat-container">
    <yx-sheet :margin="[0, 0]" :round="3" :shadow="2">
      <!-- 消息列表 -->
      <scroll-view 
        scroll-y 
        class="message-list" 
        :scroll-top="scrollTop"
        scroll-with-animation
      >
        <view v-if="messages.length === 0" class="empty-tip">
          <text class="u-font-26 u-color-grey">AI 论命助手已就绪，请输入问题开始对话</text>
        </view>
        
        <view v-for="(msg, index) in messages" :key="index" class="message-item" :class="msg.role">
          <view class="message-avatar">
            <text v-if="msg.role === 'user'">👤</text>
            <text v-else>🤖</text>
          </view>
          <view class="message-content">
            <view class="message-bubble" :class="msg.role">
              <text class="u-font-26" decode>{{ msg.content }}</text>
              <view v-if="msg.role === 'assistant' && msg.loading" class="loading-dots">
                <text>...</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 输入区域 -->
      <view class="input-area">
        <view class="input-wrapper">
          <textarea
            v-model="inputMessage"
            class="input-text"
            placeholder="输入您的问题..."
            :maxlength="1000"
            :auto-height="true"
            :show-confirm-bar="false"
            @confirm="sendMessage"
          />
          <view class="input-actions">
            <u-button 
              v-if="!defaultPromptShown" 
              size="mini" 
              type="primary" 
              @click="loadDefaultPrompt"
            >
              使用默认提示
            </u-button>
            <u-button 
              :loading="sending" 
              type="primary" 
              @click="sendMessage"
              :disabled="!inputMessage.trim()"
            >
              发送
            </u-button>
          </view>
        </view>
      </view>
    </yx-sheet>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useDetailStore } from '@/store/detail';
import { generateAIPrompt, chatWithAI } from '@/api/ai';

const detailStore = useDetailStore();
const messages = ref([]);
const inputMessage = ref('');
const sending = ref(false);
const scrollTop = ref(0);
const defaultPromptShown = ref(false);

// 加载默认提示词
async function loadDefaultPrompt() {
  try {
    uni.showLoading({ title: '生成提示词...' });
    
    // 构建八字数据
    const baziData = {
      top: detailStore.top,
      bottom: detailStore.bottom,
      gender: detailStore.gender,
      datetime: detailStore.datetime
    };

    const res = await generateAIPrompt(baziData);
    
    if (res && res.prompt) {
      inputMessage.value = res.prompt;
      defaultPromptShown.value = true;
    }
    
    uni.hideLoading();
  } catch (error) {
    uni.hideLoading();
    uni.showToast({
      title: '生成提示词失败',
      icon: 'none'
    });
  }
}

// 发送消息
async function sendMessage() {
  const message = inputMessage.value.trim();
  if (!message || sending.value) return;

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: message,
    timestamp: new Date()
  });

  // 清空输入框
  inputMessage.value = '';
  sending.value = true;

  // 滚动到底部
  await scrollToBottom();

  // 添加 AI 回复占位
  const aiMessageIndex = messages.value.length;
  messages.value.push({
    role: 'assistant',
    content: '',
    loading: true,
    timestamp: new Date()
  });

  try {
    // 构建对话历史
    const conversationHistory = messages.value
      .slice(0, -1) // 排除最后一条（当前 AI 消息）
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // 调用 AI API
    const response = await chatWithAI(message, conversationHistory);
    
    if (response && response.response) {
      // 更新 AI 消息
      messages.value[aiMessageIndex] = {
        role: 'assistant',
        content: response.response,
        loading: false,
        timestamp: new Date(response.timestamp)
      };
    } else {
      throw new Error('AI 返回数据格式错误');
    }
  } catch (error) {
    console.error('AI 对话失败:', error);
    messages.value[aiMessageIndex] = {
      role: 'assistant',
      content: `抱歉，AI 分析失败：${error.message || '未知错误'}`,
      loading: false,
      timestamp: new Date()
    };
    uni.showToast({
      title: 'AI 分析失败',
      icon: 'none'
    });
  } finally {
    sending.value = false;
    await scrollToBottom();
  }
}

// 滚动到底部
async function scrollToBottom() {
  await nextTick();
  scrollTop.value = 99999;
}

// 组件挂载时自动加载默认提示词
onMounted(async () => {
  // 延迟加载，确保数据已准备好
  await nextTick();
  setTimeout(() => {
    if (detailStore.top && detailStore.top.year && !defaultPromptShown.value) {
      loadDefaultPrompt();
    }
  }, 300);
});
</script>

<style scoped>
.ai-chat-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.message-list {
  flex: 1;
  min-height: 400px;
  max-height: 600px;
  padding: 20px;
  margin-bottom: 20px;
}

.empty-tip {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 10px;
  background: #f5f5f5;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 8px;
  word-wrap: break-word;
  line-height: 1.6;
}

.message-bubble.user {
  background: #007aff;
  color: white;
  margin-left: auto;
}

.message-bubble.assistant {
  background: #f5f5f5;
  color: #333;
}

.loading-dots {
  display: inline-block;
  animation: blink 1.4s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.input-area {
  border-top: 1px solid #eee;
  padding: 15px;
  background: white;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-text {
  width: 100%;
  min-height: 80px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 26px;
  line-height: 1.5;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

