// ============================================
// AI API 调用
// ============================================

const AI = {
  // 上下文感知的消息生成
  async getContextualMessage(state, config) {
    const hour = new Date().getHours();
    const isLate = hour >= 22 || hour < 6;
    const isEarly = hour >= 6 && hour < 9;
    const isNoon = hour >= 12 && hour < 14;
    const isEvening = hour >= 18 && hour < 22;

    const messages = {
      // 状态相关
      'very-tired': [
        '你已经连续工作很久了，要不要休息一下？☕',
        '主人，你已经工作${hours}小时了，休息一下吧！',
        '该站起来动一动了，长时间坐着对身体不好哦～'
      ],
      'tired': [
        '感觉有点累了呢，要不要休息一会儿？',
        '工作辛苦了，要不要喝杯水？'
      ],

      // 时间相关
      'late': [
        '已经${hour}点了，早点休息吧～',
        '夜深了，${hour}点了还不睡吗？',
        '这么晚还在工作呀，记得早点睡哦～'
      ],
      'early': [
        '早上好！新的一天开始了～ ☀️',
        '早安！今天也要加油哦！'
      ],
      'noon': [
        '中午了！记得吃午饭哦～ 🍱',
        '午饭时间到啦，别饿着肚子工作呀'
      ],
      'evening': [
        '晚上好！今天过得怎么样？',
        '${hour}点了，工作还顺利吗？'
      ],

      // 通用
      'random': [
        '今天过得好吗？',
        '有什么我可以帮你的吗？',
        '加油，你做得很好！💪',
        '今天也要开心哦～'
      ]
    };

    // 根据状态选择消息
    let pool = messages['random'];

    if (state === 'very-tired') {
      pool = messages['very-tired'];
    } else if (state === 'tired') {
      pool = messages['tired'];
    } else if (isLate) {
      pool = messages['late'];
    } else if (isEarly) {
      pool = messages['early'];
    } else if (isNoon) {
      pool = messages['noon'];
    } else if (isEvening) {
      pool = messages['evening'];
    }

    // 随机选择一条
    let msg = pool[Math.floor(Math.random() * pool.length)];

    // 替换变量
    const hours = State.getConsecutiveHours().toFixed(1);
    msg = msg.replace('${hours}', hours).replace('${hour}', hour);

    return msg;
  },

  // 调用 AI API 进行对话（支持多 Provider）
  async chat(userMessage) {
    const provider = Config.getProvider();

    if (provider === Config.Provider.MINIMAX) {
      return this.chatMiniMax(userMessage);
    }

    // 默认使用 Claude
    return this.chatClaude(userMessage);
  },

  // 调用 Claude API 进行对话
  async chatClaude(userMessage) {
    const apiKey = Config.getApiKey();
    if (!apiKey) {
      return { error: '请先在设置中配置 Claude API Key' };
    }

    const systemPrompt = `你是「伴侣」，一个为程序员设计的桌面情绪伴侣 AI。

你的特点：
- 温暖、贴心、有点调皮
- 会关心主人的工作状态
- 知道什么时候该提醒休息
- 说话简短（1-3句话），不啰嗦
- 语气自然，像朋友聊天
- 会用 emoji 表情

当前时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

状态：${State.getStatusText()}
连续工作时长：${State.getConsecutiveHours().toFixed(1)}小时`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-haiku-3-5-20241107',
          max_tokens: 256,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          return { error: 'API Key 无效，请检查设置' };
        }
        return { error: `API 调用失败: ${response.status}` };
      }

      const data = await response.json();
      return { message: data.content?.[0]?.text || '...' };
    } catch (error) {
      if (error.message.includes('fetch')) {
        return { error: '网络错误，请检查网络连接' };
      }
      return { error: error.message };
    }
  },

  // 调用 MiniMax API 进行对话
  async chatMiniMax(userMessage) {
    const apiKey = Config.getApiKey(Config.Provider.MINIMAX);
    if (!apiKey) {
      return { error: '请先在设置中配置 MiniMax API Key' };
    }

    const config = Config.load();
    const model = config.minimaxModel || Config.MiniMax.MODEL;

    const systemPrompt = `你是「伴侣」，一个为程序员设计的桌面情绪伴侣 AI。

你的特点：
- 温暖、贴心、有点调皮
- 会关心主人的工作状态
- 知道什么时候该提醒休息
- 说话简短（1-3句话），不啰嗦
- 语气自然，像朋友聊天
- 会用 emoji 表情

当前时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

状态：${State.getStatusText()}
连续工作时长：${State.getConsecutiveHours().toFixed(1)}小时`;

    try {
      const response = await fetch(`${Config.MiniMax.API_BASE}/text/chatcompletion_v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          max_tokens: Config.MiniMax.MAX_TOKENS,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          return { error: 'MiniMax API Key 无效，请检查设置' };
        }
        return { error: `MiniMax API 调用失败: ${response.status}` };
      }

      const data = await response.json();
      // MiniMax 返回格式: { choices: [{ message: { content: "..." } }] }
      return { message: data.choices?.[0]?.message?.content || '...' };
    } catch (error) {
      if (error.message.includes('fetch')) {
        return { error: '网络错误，请检查网络连接' };
      }
      return { error: error.message };
    }
  },

  // 调用 MiniMax 音乐生成 API
  async generateMusic(prompt) {
    const apiKey = Config.getApiKey(Config.Provider.MINIMAX);
    if (!apiKey) {
      return { error: '请先在设置中配置 MiniMax API Key' };
    }

    const config = Config.load();
    const model = config.musicModel || Config.MiniMax.MUSIC_DEFAULT_MODEL;

    try {
      const response = await fetch(`${Config.MiniMax.API_BASE}/music_generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          return { error: 'MiniMax API Key 无效，请检查设置' };
        }
        return { error: `音乐生成失败: ${response.status}` };
      }

      const data = await response.json();
      // MiniMax 音乐生成返回格式: { data: { audio: "hex编码的音频数据", status: 2 }, ... }
      // status: 2 表示成功
      if (data.data && data.data.status === 2 && data.data.audio) {
        return { audioHex: data.data.audio, status: 2 };
      }
      return { error: '音乐生成失败，请重试' };
    } catch (error) {
      if (error.message.includes('fetch')) {
        return { error: '网络错误，请检查网络连接' };
      }
      return { error: error.message };
    }
  }
};

window.AI = AI;
