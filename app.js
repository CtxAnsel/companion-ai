// ============================================
// 伴侣 AI — 主程序
// ============================================

(function() {
  'use strict';

  // DOM 元素
  const elements = {
    companion: null,
    bubble: null,
    statusText: null,
    timeDisplay: null,
    chatPanel: null,
    chatMessages: null,
    chatInput: null,
    chatSend: null,
    chatClose: null,
    settingsBtn: null,
    settingsPanel: null,
    settingsSave: null,
    apiKey: null,
    minimaxApiKey: null,
    aiProvider: null,
    workStart: null,
    workEnd: null,
  };

  // 配置
  let config = null;
  let checkInterval = null;
  let reminderTimeout = null;
  let bubbleTimeout = null;

  // 初始化
  async function init() {
    // 加载配置
    config = Config.load();

    // 缓存 DOM 元素
    cacheElements();

    // 初始化状态
    State.init(config);

    // 绑定事件
    bindEvents();

    // 启动状态检查
    startStatusCheck();

    // 启动时钟更新
    updateClock();
    setInterval(updateClock, 1000);

    // 启动定时提醒
    scheduleReminder();

    // 初始欢迎
    showBubble('你好！我是你的伴侣 AI 💕 点击我和聊天吧～');

    // 设置初始状态
    updateCompanionState('idle');
  }

  // 缓存 DOM 元素
  function cacheElements() {
    elements.companion = document.getElementById('companion');
    elements.bubble = document.getElementById('bubble');
    elements.statusText = document.getElementById('status-text');
    elements.timeDisplay = document.getElementById('time-display');
    elements.chatPanel = document.getElementById('chat-panel');
    elements.chatMessages = document.getElementById('chat-messages');
    elements.chatInput = document.getElementById('chat-input');
    elements.chatSend = document.getElementById('chat-send');
    elements.chatClose = document.getElementById('chat-close');
    elements.settingsBtn = document.getElementById('settings-btn');
    elements.settingsPanel = document.getElementById('settings-panel');
    elements.settingsSave = document.getElementById('save-settings');
    elements.apiKey = document.getElementById('api-key');
    elements.minimaxApiKey = document.getElementById('minimax-api-key');
    elements.aiProvider = document.getElementById('ai-provider');
    elements.workStart = document.getElementById('work-start');
    elements.workEnd = document.getElementById('work-end');

    // 填充已有设置
    elements.apiKey.value = config.apiKey || '';
    elements.minimaxApiKey.value = config.minimaxApiKey || '';
    elements.aiProvider.value = config.aiProvider || 'claude';
    elements.workStart.value = config.workStart || '09:00';
    elements.workEnd.value = config.workEnd || '22:00';

    // 根据当前 provider 显示/隐藏对应的 API Key 输入框
    updateApiKeyVisibility(config.aiProvider || 'claude');
  }

  // 根据选择的 Provider 显示/隐藏对应的 API Key 输入框
  function updateApiKeyVisibility(provider) {
    const claudeLabel = document.getElementById('claude-api-key-label');
    const minimaxLabel = document.getElementById('minimax-api-key-label');
    if (provider === 'minimax') {
      claudeLabel.style.display = 'none';
      minimaxLabel.style.display = 'block';
    } else {
      claudeLabel.style.display = 'block';
      minimaxLabel.style.display = 'none';
    }
  }

  // 绑定事件
  function bindEvents() {
    // 点击角色打开聊天
    elements.companion.addEventListener('click', toggleChat);

    // 聊天关闭
    elements.chatClose.addEventListener('click', () => {
      elements.chatPanel.classList.add('hidden');
      State.recordActivity();
    });

    // 发送消息
    elements.chatSend.addEventListener('click', sendMessage);
    elements.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    // 设置面板
    elements.settingsBtn.addEventListener('click', () => {
      elements.settingsPanel.classList.toggle('hidden');
      State.recordActivity();
    });

    // 保存设置
    elements.settingsSave.addEventListener('click', saveSettings);

    // AI Provider 切换事件
    elements.aiProvider.addEventListener('change', (e) => {
      updateApiKeyVisibility(e.target.value);
    });

    // 键盘活动监听
    document.addEventListener('keypress', () => {
      State.recordActivity();
    });

    // 鼠标活动监听
    document.addEventListener('mousemove', () => {
      State.recordActivity();
    });
  }

  // 切换聊天面板
  function toggleChat() {
    elements.chatPanel.classList.toggle('hidden');
    State.recordActivity();
    if (!elements.chatPanel.classList.contains('hidden')) {
      elements.chatInput.focus();
    }
  }

  // 发送消息
  async function sendMessage() {
    const message = elements.chatInput.value.trim();
    if (!message) return;

    // 显示用户消息
    addMessage(message, 'user');
    elements.chatInput.value = '';

    // 切换到说话状态
    updateCompanionState('speaking');

    // 调用 AI
    const response = await AI.chat(message);

    // 恢复状态
    updateCompanionState(State.getState());

    if (response.error) {
      addMessage(response.error, 'ai');
    } else {
      addMessage(response.message, 'ai');
      State.lastAiMessage = response.message;
    }
  }

  // 添加消息到聊天框
  function addMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.textContent = text;
    elements.chatMessages.appendChild(msg);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  // 保存设置
  function saveSettings() {
    config = {
      ...config,
      aiProvider: elements.aiProvider.value,
      apiKey: elements.apiKey.value.trim(),
      minimaxApiKey: elements.minimaxApiKey.value.trim(),
      workStart: elements.workStart.value,
      workEnd: elements.workEnd.value,
    };
    Config.save(config);
    State.init(config);

    // 隐藏设置面板
    elements.settingsPanel.classList.add('hidden');

    // 重新调度提醒
    scheduleReminder();

    showBubble('设置已保存 ✓');
  }

  // 显示气泡消息
  function showBubble(text) {
    if (bubbleTimeout) clearTimeout(bubbleTimeout);

    elements.bubble.textContent = text;
    elements.bubble.classList.add('show');

    bubbleTimeout = setTimeout(() => {
      elements.bubble.classList.remove('show');
    }, 4000);
  }

  // 更新角色状态
  function updateCompanionState(state) {
    elements.companion.className = `companion ${state}`;
  }

  // 启动状态检查
  function startStatusCheck() {
    const interval = config.checkInterval || 30000;

    checkInterval = setInterval(() => {
      const newState = State.getState();
      const statusText = State.getStatusText();

      elements.statusText.textContent = statusText;
      updateCompanionState(newState);

      // 状态变化时提醒
      if (newState === 'very-tired' && State.current !== 'very-tired') {
        showBubble('你已经连续工作很久了！休息一下吧 ☕');
      } else if (newState === 'tired' && State.current === 'working') {
        showBubble('工作辛苦了，休息一下吧～');
      }
    }, interval);
  }

  // 更新时钟
  function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    elements.timeDisplay.textContent = timeStr;
  }

  // 调度定时提醒
  function scheduleReminder() {
    if (reminderTimeout) clearTimeout(reminderTimeout);

    const interval = config.reminderInterval || 2 * 60 * 60 * 1000;

    reminderTimeout = setInterval(async () => {
      State.updateWorkTimeStatus();
      if (!State.isWorkTime) return; // 非工作时间不提醒

      const msg = await AI.getContextualMessage(State.getState(), config);
      showBubble(msg);

      // 提醒后记录休息
      State.recordBreak();
    }, interval);
  }

  // 启动
  document.addEventListener('DOMContentLoaded', init);
})();
