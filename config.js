// ============================================
// 配置管理
// ============================================

const Config = {
  // AI Provider 枚举
  Provider: {
    CLAUDE: 'claude',
    MINIMAX: 'minimax'
  },

  // MiniMax API 配置
  MiniMax: {
    API_BASE: 'https://api.minimaxi.com/v1', // 中国区 endpoint
    MODEL: 'MiniMax-Text-01',
    MAX_TOKENS: 256
  },

  // 默认配置
  defaults: {
    apiKey: '',
    aiProvider: 'claude', // 默认使用 Claude
    workStart: '09:00',
    workEnd: '22:00',
    checkInterval: 30000, // 30秒检查一次状态
    reminderInterval: 2 * 60 * 60 * 1000, // 2小时提醒一次
    longSessionThreshold: 4 * 60 * 60 * 1000, // 4小时判定为长时间
  },

  // 从 localStorage 加载
  load() {
    try {
      const saved = localStorage.getItem('companion-config');
      if (saved) {
        return { ...this.defaults, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load config:', e);
    }
    return { ...this.defaults };
  },

  // 保存到 localStorage
  save(settings) {
    try {
      localStorage.setItem('companion-config', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  },

  // 获取 API Key（优先从配置读取，否则从环境变量）
  getApiKey(provider = null) {
    const config = this.load();
    const aiProvider = provider || config.aiProvider || this.defaults.aiProvider;

    // 根据 provider 返回对应的 API Key
    if (aiProvider === this.Provider.MINIMAX) {
      if (config.minimaxApiKey) return config.minimaxApiKey;
      if (typeof ENV !== 'undefined' && ENV.MINIMAX_API_KEY) return ENV.MINIMAX_API_KEY;
    }

    // Claude 作为默认
    if (config.apiKey) return config.apiKey;
    if (typeof ENV !== 'undefined' && ENV.CLAUDE_API_KEY) return ENV.CLAUDE_API_KEY;
    return null;
  },

  // 获取当前 AI Provider
  getProvider() {
    const config = this.load();
    return config.aiProvider || this.defaults.aiProvider;
  }
};

// 导出给其他地方用
window.Config = Config;
