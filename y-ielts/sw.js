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
