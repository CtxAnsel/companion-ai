// ============================================
// 配置管理
// ============================================

const Config = {
  // 默认配置
  defaults: {
    apiKey: '',
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
  getApiKey() {
    const config = this.load();
    if (config.apiKey) return config.apiKey;
    // 兼容环境变量
    if (typeof ENV !== 'undefined' && ENV.CLAUDE_API_KEY) return ENV.CLAUDE_API_KEY;
    return null;
  }
};

// 导出给其他地方用
window.Config = Config;
