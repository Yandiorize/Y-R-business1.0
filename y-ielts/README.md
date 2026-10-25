# Y-IELTS

雅思机考模拟器：纯静态站点，无构建、无后端、无第三方依赖。所有学习数据只存在浏览器本机（`localStorage` 单键 `ielts.cbt.v1`）。

## 能做什么

| 模块 | 内容 |
|---|---|
| 阅读 | 剑 17 四套完整阅读，双栏对照作答，交卷按题型出分，逐题回顾 |
| 听力 | Section 1 逐句听写，10 道填空，可暂停/重播，原文按播放进度解锁 |
| 写作 | Task 1 / Task 2 限时练习，草稿自动保存，字数统计与历史记录 |
| 单词 | 英汉互译 / 拼写默写，错词本与间隔复习队列 |
| 范文 | 剑 17–19 真题范文 24 篇，对照阅读、朗读、收藏 |
| 学习区 | 五个模块的入口，每行显示题数时长、下一步动作与状态 |
| 留言板 | 本机留言，不联网、不上传，示例内容单独标注 |

## 目录

```
index.html            单页应用外壳（8 个 .view 视图 + hash 路由）
sw.js                 Service Worker：app shell 预缓存、音频独立缓存
manifest.json         PWA 清单
assets/
  css/
    styles.css        基础排版与布局
    ios.css           移动端壳（底部标签栏、安全区）
    essays.css        范文库与配色变量
    audio.css         音频播放器
    liquid-glass-v50.css   玻璃材质与全站视觉主文件
    liquid-glass-v52.css   学习区 / 留言板
    liquid-glass-v55.css   底部导航浮层
    liquid-glass-v57.css   设计 token + 玻璃材质修正（最后加载）
  js/                 无框架，按页面拆分的 IIFE 模块
    store.js           localStorage 唯一入口 + 事件广播
    app.js             视图切换、顶栏、学习区数据
    reading.js / listening.js / writing-v44.js / vocab.js / essays.js
    comments.js        留言板
    glass-v33.js       玻璃透明度滑杆（写 CSS 变量）
    theme.js           浅色 / 深色 / 跟随系统
    me.js              我的面板
  audio/               听力音频（本地优先，缺失时回退在线朗读）
  charts/              图表与插图
```

## 本地运行

纯静态，任意静态服务器即可（不要用 `file://` 打开，Service Worker 与模块路径会失效）：

```bash
python3 -m http.server 8901
# 打开 http://127.0.0.1:8901/index.html
```

## 约定

- **数据**：只写 `localStorage` 的 `ielts.cbt.v1`，不新增键；清空入口在「我的 → 数据管理」。
- **样式**：颜色、圆角、字号、动效走 CSS 变量（`--ink-*` / `--lg-*` / `--r-*` / `--fs-*`）。
- **玻璃**：只有壳（顶栏、底栏、卡片、弹窗、抽屉）半透明；阅读文章、写作编辑器、听力句子、范文正文保持实色。
- **无障碍**：正文对比度 ≥ 4.5:1，可点元素 ≥ 44×44，支持 `prefers-reduced-motion`。
- **无后端**：留言、练习记录都不出本机；多人共享需要另接服务端。

## 浏览器支持

Chromium / Safari 15.4+ / Firefox 最新版。`backdrop-filter` 不可用时自动降级为不透明底色。

## 许可

个人学习项目，题目与范文版权归原出版方所有，仅供自用练习。
