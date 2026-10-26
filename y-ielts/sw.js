/* ============================================================
 *  Y-IELTS · Service Worker（PWA 离线）
 *  ---------------------------------------------------------------
 *  两类缓存，互不影响：
 *    · 页面 / app shell → ielts-page-v56（版本升级时整体替换）
 *    · 音频              → ielts-audio（跨版本保留，沿用旧缓存）
 *  install  ：一次性预缓存 app shell（HTML / 全部 CSS / JS / manifest / 图标）
 *  fetch    ：app shell 与静态资源 cache-first；音频独立 cache-first
 *  导航请求   ：优先返回缓存的 index.html，离线可直接进入主界面
 *  activate ：只清理旧的「页面」缓存（ielts-cbt-* / ielts-page-*），
 *             永远保留 ielts-audio
 *  ui-iter v6：本文件仅加这一行注释（逻辑、PAGE_CACHE、VERSION 一字未动），
 *             目的是让 SW 脚本字节变化、触发浏览器更新，以便新 ui-iter.css
 *             从预缓存中刷新（否则 cache-first 会继续 served 旧版样式）。
 *  ui-iter v7：同 v6，仅加注释触发 SW 更新（v7 改了 index.html / JS / CSS，
 *             均已在预缓存清单里，无需新增条目）。
 *  ui-iter v8：同 v7，仅加注释触发 SW 更新（v8 只改 ui-iter.css，
 *             已在预缓存清单里，无需新增条目）。
 *  ui-iter v9：同 v8，仅加注释触发 SW 更新（v9 只改 v50/ui-iter.css 颜色，
 *             均已在预缓存清单里，无需新增条目）。
 *  ui-iter v10：同 v9，仅加注释触发 SW 更新（v10 只改 ui-iter.css 面板/
 *             弹窗/选中态，均已在预缓存清单里，无需新增条目）。
 *  ui-iter v11：新增 exam-shell.js 预缓存条目（新文件，必须进清单）+
 *             注释触发 SW 更新（其余 v11 改动均已在清单里）。
 *  ui-iter v12：新增 learn-carousel.js 预缓存条目（新文件，必须进清单）+
 *             注释触发 SW 更新（其余 v12 改动均已在清单里）。
 *  ui-iter v13：同 v12，仅加注释触发 SW 更新（v13 改 index.html / me.js /
 *             ui-iter.css，均已在预缓存清单里，无需新增条目）。
 *  ui-iter v14：同 v13，仅加注释触发 SW 更新（v14 改 index.html / theme.js /
 *             learn-carousel.js / ui-iter.css，均已在预缓存清单里，无需新增条目）。
 *  ui-iter v15：新增 tabbar-indicator.js 预缓存条目（新文件，必须进清单）+
 *             注释触发 SW 更新（其余 v15 改动均已在清单里；v15 改 index.html /
 *             theme.js / learn-carousel.js / vocab.js / ui-iter.css / sw.js）。
 *  ui-iter v16：同 v15，仅加注释触发 SW 更新（v16 改 index.html /
 *             learn-carousel.js / ui-iter.css，均已在预缓存清单里，无需新增条目）。
 *  ui-iter v17：同 v16，仅加注释触发 SW 更新（v17 改 index.html / me.js /
 *             learn-carousel.js / ui-iter.css，均已在预缓存清单里，无需新增条目）。
 *  ui-iter v18：同 v17，仅加注释触发 SW 更新（v18 改 me.js / vocab.js /
 *             ui-iter.css，均已在预缓存清单里，无需新增条目）。
 *  ui-iter v19：同 v18，仅加注释触发 SW 更新（v19 改 index.html / me.js /
 *             vocab.js，均已在预缓存清单里，无需新增条目）。
 *  ui-iter v20：同 v19，仅加注释触发 SW 更新（v20 改 vocab.js /
 *             ui-iter.css，均已在预缓存清单里，无需新增条目）。
 *  ui-iter v21：同 v20，仅加注释触发 SW 更新（v21 只改 vocab.js，
 *             已在预缓存清单里，无需新增条目）。
 *  ui-iter v22：同 v21，仅加注释触发 SW 更新（v22 只改 vocab.js，
 *             已在预缓存清单里，无需新增条目）。
 *  v23 首页重做：新增 home-v23.css 预缓存条目（新文件，必须进清单）+
 *             注释触发 SW 更新（其余 v23 改动 index.html / app.js
 *             均已在清单里，无需新增条目）。
 *  v24 首页全套重做：新增 home-carousel.js 预缓存条目（新文件，
 *             必须进清单）+ 注释触发 SW 更新（其余 v24 改动
 *             index.html / home-v23.css / app.js 均已在清单里，
 *             home-v23.css 文件名沿用，内容已是 v24 规则）。
 *  v25 旋转卡片对齐示范图：仅 index.html / home-v23.css 改动，
 *             均已在清单里，仅加注释触发 SW 更新。
 *  v26 首页全页对齐示范图 2：index.html / home-v23.css /
 *             icons.js / app.js 改动，均已在清单里（无新文件），
 *             仅加注释触发 SW 更新。
 *  v27 学习区统一卡片列表：index.html / learn-v27.css（新文件，
 *             已加入清单）/ app.js 改动；learn-carousel.js 休眠，
 *             仍在清单里不删除。
 *  v28 修复：v27 学习区替换时漏了 </section>，致其后全部视图被
 *             嵌套隐藏（模块页空白）；仅补 index.html 一行闭合，
 *             仅加注释触发 SW 更新。
 *  v29 我的：index.html（目标下拉 + 分模块记录归位）/ me-v29.css
 *             （新文件，已加入清单）/ me.js（总览口径统一、草稿非空计、
 *             目标进度）；meDashTarget 旧行已移除，无 JS 引用残留。
 *  v30 改名 + 直达渲染：index.html / comments.js / app.js（留言区改名
 *             学习笔记，仅文案；学习区切入即重算 ln 卡片行）/ me.js
 *             （init 末尾首渲染，修启动直达 #me 显示空态）；仅加注释
 *             触发 SW 更新，12px 窄屏间距改动仍在本地，不随本推上线。
 *  v31 阅读成绩头：reading.js（成绩头补答错/未答题数；成绩表加
 *             只看错题开关，默认全量题序）；仅加注释触发 SW 更新。
 *  v32 阅读文章栏实底：styles.css（文章栏保留 glass 类边框圆角，
 *             仅覆盖背景为实色并关闭模糊；题目栏不动）；仅加注释触发 SW 更新。
 *  v33 听力：listening-data.js（题号→原文句映射 loc，10 题，由脚本与答案键导出）；
 *             listening.js（成绩表行 data-locate + 点击高亮句并滚动，交卷后不写状态）；
 *             index.html（合成语音实话标注；练习态/模考规则说明）；仅加注释触发 SW 更新。
 *  v35 Phase 3 首批：tokens.css（圆角/字阶单一来源，取值保持实效）/
 *             styles.css（删重复定义；视图切换 .46s→.3s）/ liquid-glass-v50.css
 *             （删重复圆角；浅色行动蓝 #0071e3→#1769E8）/ ui-iter.css（主按钮与
 *             字体档选中态同蓝）/ app.js（pickContinue 草稿分支改对象非空文本判断）；
 *             均已在清单里，无新文件；仅加注释触发 SW 更新。12px 窄屏间距仍在本地，不随本推上线。
 *  v36 继续按钮回首页刷新：app.js（回首页分支加 refreshHomeContinue，此前只刷五卡不刷 CTA，
 *             致使 v35 草稿分支需重载才现身）；仅加注释触发 SW 更新。12px 窄屏间距仍在本地，不随本推上线。
 *  v37 首页 A–F 重建：index.html（轮播/铃铛/HOT/口语占位/信息弹窗已删）、app.js（目标/概览/
 *             模块卡/最近/走势数据层）、me.js（注释口径）、home-v23.css（新首页样式全量重写）；
 *             仅加注释触发 SW 更新。12px 窄屏间距仍在本地，不随本推上线。
 *  v38 模块收尾：index.html（字数条内衔接词计数）、writing-v44.js（衔接词双写 + 无草稿说实话）、
 *             vocab.js（词性/例句行内编辑条 + 移除二次确认 + 掌握口径统一）、me.js/app.js（掌握口径统一）、
 *             styles.css（wc-coh 与编辑条样式）；仅加注释触发 SW 更新。12px 窄屏间距仍在本地，不随本推上线。
 *  v39 Clear Glass 2.0 设计系统基础：styles.css（交互主色 #2868DF、文字 #182A43、次要 #5F6F88 校准、
 *             页面底 #F5F8FD、紫光斑改蓝）、liquid-glass-v50.css（装饰主色 #3478F6）、home-v23.css（首页色板/
 *             主玻璃内侧高光/文字按钮用强蓝）、ui-iter.css（主按钮 #2868DF）；仅加注释触发 SW 更新。
 *             12px 窄屏间距仍在本地，不随本推上线。
 *  v40 清理轮：index.html（About 行 v18→v40、掌握注改“不在错词本”口径、更新日志补 v39/v40）；
 *             另经 delete_file 删除未引用 liquid-glass-v56.css；仅加注释触发 SW 更新。
 *             12px 窄屏间距仍在本地，不随本推上线。
 * ============================================================ */
'use strict';

var PAGE_CACHE = 'ielts-page-v56';
var AUDIO_CACHE = 'ielts-audio';   /* 与 audio.js 的 IndexedDB 同名但互不冲突 */
var VERSION = 'v56';

var CORE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',

  './assets/css/styles.css',
  './assets/css/ios.css',
  './assets/css/essays.css',
  './assets/css/audio.css',
  './assets/css/tokens.css',
  './assets/css/ui-iter.css',
  './assets/css/home-v23.css',
  './assets/css/learn-v27.css',
  './assets/css/me-v29.css',
  './assets/css/liquid-glass-v50.css',
  './assets/css/liquid-glass-v52.css',
  './assets/css/liquid-glass-v55.css',
  './assets/css/liquid-glass-v57.css',

  './assets/js/prompts.js',
  './assets/js/reading-data.js',
  './assets/js/reading-answers.js',
  './assets/js/reading-locate.js',
  './assets/js/essay-data.js',
  './assets/js/essay-zh.js',
  './assets/js/store.js',
  './assets/js/icons.js',
  './assets/js/audio.js',
  './assets/js/components.js',
  './assets/js/theme.js',
  './assets/js/writing-v44.js',
  './assets/js/vocab.js',
  './assets/js/glass-v33.js',
  './assets/js/reading.js',
  './assets/js/essays.js',
  './assets/js/listening-data.js',
  './assets/js/listening.js',
  './assets/js/exam-shell.js',
  './assets/js/learn-carousel.js',
  './assets/js/home-carousel.js',
  './assets/js/tabbar-indicator.js',
  './assets/js/app.js?v=51',
  './assets/js/comments.js?v=51',
  './assets/js/me.js',

  './assets/yandi-ventures-icon.png',
  './assets/yandi-ventures-icon-32.png',
  './assets/yandi-ventures-icon-180.png',
  './assets/yandi-ventures-icon-192.png'
];

/* ---------------- install：预缓存 app shell ---------------- */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(PAGE_CACHE)
      .then(function (c) { return c.addAll(CORE); })
      .then(function () { return self.skipWaiting(); })
  );
});

/* ---------------- activate：清旧页面缓存，保留音频 ---------------- */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k === PAGE_CACHE || k === AUDIO_CACHE) return null; /* 保留 */
        /* 只清理本应用的旧「页面」缓存；音频缓存绝不动 */
        if (/^ielts-(cbt|page)-/.test(k)) return caches.delete(k);
        return null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* ---------------- fetch ---------------- */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return; /* 跨域（在线发音接口）走网络 */

  /* 1) 音频：独立缓存，跨版本保留 */
  if (/\/assets\/audio\//.test(url.pathname) || /\.mp3$/i.test(url.pathname)) {
    e.respondWith(
      caches.open(AUDIO_CACHE).then(function (c) {
        return c.match(req).then(function (hit) {
          if (hit) return hit;
          return fetch(req).then(function (res) {
            if (res && res.ok) c.put(req, res.clone());
            return res;
          }).catch(function () { return hit; });
        });
      })
    );
    return;
  }

  /* 2) 页面导航：直接返回缓存的 index.html，离线可进主界面 */
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.open(PAGE_CACHE).then(function (c) {
        return c.match('./index.html').then(function (hit) {
          return hit || fetch(req);
        });
      })
    );
    return;
  }

  /* 3) 其他静态资源：cache-first，未命中回填 */
  e.respondWith(
    caches.open(PAGE_CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (res && res.ok && res.type === 'basic') c.put(req, res.clone());
          return res;
        }).catch(function () { return hit; });
      });
    })
  );
});
