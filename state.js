// ============================================
// 状态管理
// ============================================

const State = {
  // 当前状态
  current: 'idle', // idle | working | tired | very-tired | speaking
  lastActivity: Date.now(),
  lastBreak: Date.now(),
  workSessionStart: null,
  consecutiveHours: 0,
  isWorkTime: false,
  lastAiMessage: '',
  keystrokeCount: 0,
  lastKeystrokeCheck: Date.now(),

  // 状态配置
  config: null,

  // 初始化
  init(config) {
    this.config = config;
    this.workSessionStart = Date.now();
    this.updateWorkTimeStatus();
  },

  // 更新工作时间段状态
  updateWorkTimeStatus() {
    const now = new Date();
    const [startH, startM] = (this.config?.workStart || '09:00').split(':').map(Number);
    const [endH, endM] = (this.config?.workEnd || '22:00').split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    this.isWorkTime = currentMinutes >= startMinutes && currentMinutes < endMinutes;
  },

  // 记录键盘活动
  recordActivity() {
    this.lastActivity = Date.now();
    this.keystrokeCount++;
  },

  // 计算连续工作时长（小时）
  getConsecutiveHours() {
    return (Date.now() - this.workSessionStart) / (1000 * 60 * 60);
  },

  // 检查是否长时间工作
  checkLongSession() {
    const hours = this.getConsecutiveHours();
    return hours >= 4;
  },

  // 获取当前状态
  getState() {
    this.updateWorkTimeStatus();

    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const hoursSinceBreak = (now - this.lastBreak) / (1000 * 60 * 60);

    // 基于时间和活动判断状态
    if (timeSinceActivity < 5000) {
      // 5秒内有活动
      if (hoursSinceBreak >= 4) {
        return 'very-tired';
      } else if (hoursSinceBreak >= 2) {
        return 'tired';
      }
      return 'working';
    } else if (timeSinceActivity < 300000) {
      // 5分钟内有活动
      return 'idle';
    } else {
      // 长时间无活动
      return 'idle';
    }
  },

  // 记录休息
  recordBreak() {
    this.lastBreak = Date.now();
    this.workSessionStart = Date.now();
  },

  // 重置工作会话
  resetSession() {
    this.workSessionStart = Date.now();
  },

  // 获取状态描述
  getStatusText() {
    const state = this.getState();
    const texts = {
      'idle': '休息中',
      'working': '专注工作中',
      'tired': '有点累了',
      'very-tired': '该休息了！',
      'speaking': '聊天中'
    };
    return texts[state] || '休息中';
  }
};

window.State = State;
