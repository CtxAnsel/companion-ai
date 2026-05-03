# 🐱 伴侣 AI — 桌面情绪伙伴

> 程序员专属的桌面 AI 伴侣，感知你的工作状态，陪你度过每一个加班夜

## 特性

- 🎯 **上下文感知** — 知道你在工作、休息还是崩溃
- 💬 **AI 对话** — Claude 驱动的智能陪伴对话
- ⏰ **定时提醒** — 每 2 小时提醒你休息
- 🌙 **深夜模式** — 凌晨自动切换关怀语气
- 🎨 **可爱角色** — 橘猫形象，动画丰富
- 🔒 **本地优先** — 数据存储在本地，不上传隐私

## 快速开始

### 方式一：直接打开

```bash
# 克隆项目
git clone https://github.com/CtxAnsel/companion-ai.git
cd companion-ai

# 直接用浏览器打开
open index.html   # macOS
xdg-open index.html  # Linux
start index.html    # Windows
```

### 方式二：启动本地服务器

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# 然后访问 http://localhost:8000
```

## 配置

1. 点击右下角 ⚙️ 设置按钮
2. 输入你的 Claude API Key（需要从 [ Anthropic Console ](https://console.anthropic.com/) 获取）
3. 设置工作时间段
4. 点击保存

## 技术栈

| 模块 | 技术 |
|------|------|
| 前端 | Vanilla JS + CSS 动画 |
| AI | Claude API (Haiku 模型) |
| 状态感知 | 键盘/鼠标活动 + 时间 |
| 存储 | localStorage |

## Roadmap

- [ ] Tauri 桌面客户端（独立窗口）
- [ ] 宠物联动 v2（远程呼唤家里的猫）
- [ ] 情绪识别（摄像头）
- [ ] 声音交互（语音对话）
- [ ] 跨设备同步

## License

MIT
