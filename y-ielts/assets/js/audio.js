/* ============================================================
 *  词典发音 · 运行时播放器（新增）
 *  ---------------------------------------------------------------
 *  目标平台 / 技术栈
 *    · 纯静态站点（原生 JS，无框架、无构建、无后端）
 *    · 本地资源：site/assets/audio/*.mp3 + index.json（由
 *      scripts/fetch_audio.js 在构建期批量下载生成）
 *    · 浏览器 API：HTMLAudioElement / IndexedDB / speechSynthesis
 *
 *  播放策略（严格按顺序降级，任何一层失败都继续往下走）
 *    1) 本地打包音频        assets/audio/<slug>-<accent>.mp3
 *    2) 运行时缓存          IndexedDB 里的 blob（在线播放成功且可读时写入）
 *    3) 在线接口            有道 / Google 的非官方发音接口
 *        · 首次播放后由 Service Worker 以 opaque 响应写入 Cache Storage，
 *          下次离线也能直接播放（跨域音频无法用 fetch 读字节时的主要回写方式）
 *    4) 系统 TTS            speechSynthesis（lang=en-US / en-GB）
 *    5) 明确提示            以上都不可用时给出「当前设备暂无可用语音」提示
 *
 *  ⚠️ 禁止静默跳过（v6 硬要求）
 *    每一级失败都必须留痕：console.warn 打点 + 界面 toast 提示；
 *    最终兜底必须走到 4) 系统 TTS，TTS 也没有才提示「无可用语音」。
 *    任何情况下不得“点了喇叭却什么也没发生、连个提示都没有”。
 *
 *  ⚠️ 合规提示
 *    在线兜底与批量下载使用的都是**非官方接口**：无文档、无 SLA，可能限流、
 *    变更参数或封禁来源；音频版权归服务方所有，仅供个人学习使用。
 *    正式产品请替换 CFG.online.provider 为你自己的授权数据源。
 *
 *  可替换点（改这里即可换数据源 / 换存储路径）
 *    CFG.base / CFG.index        本地目录与索引路径
 *    CFG.online.providers        在线接口（函数式，返回 URL）
 *    CFG.online.provider         当前使用的在线接口名
 *    CFG.ttsLang                 系统 TTS 的语言映射
 * ============================================================ */
(function () {
  'use strict';

  var CFG = {
    base: 'assets/audio/',
    index: 'assets/audio/index.json',
    /* 口音 → 本地文件名后缀 & 在线参数 */
    accents: { us: 'us', uk: 'uk' },
    defaultAccent: 'us',
    enabled: true,
    localTimeout: 3500,     // 单层播放超时（毫秒）
    onlineTimeout: 6000,
    maxWordLen: 60,         // 超长文本直接跳过（防止把句子塞进 TTS）
    /* 在线接口：函数式，方便整体替换 */
    providers: {
      youdao: function (word, accent) {
        return 'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(word) +
               '&type=' + (accent === 'uk' ? 2 : 1);
      },
      google: function (word, accent) {
        return 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob' +
               '&tl=' + (accent === 'uk' ? 'en-GB' : 'en-US') +
               '&q=' + encodeURIComponent(word);
      }
    },
    online: { provider: 'youdao' },
    ttsLang: { us: 'en-US', uk: 'en-GB' }
  };

  var indexMap = null;        // { word: { us:'a-us.mp3', uk:'a-uk.mp3' } }
  var indexTried = false;
  var dbPromise = null;
  var current = null;         // 当前播放中的 Audio
  var unlocked = false;
  var stats = { local: 0, cache: 0, online: 0, tts: 0, miss: 0, lastReason: '', lastLevel: '' };

  /* ---------------- 可见反馈（禁止静默失败） ----------------
   * 任何一级失败都必须留下痕迹：先打点日志，再走界面提示。
   * 界面提示优先用站点自己的 toast；没有 toast 时至少 console.warn，绝不无声。 */
  function notify(msg, reason) {
    stats.lastReason = reason || msg;
    try { console.warn('[发音]', msg, reason ? '(' + reason + ')' : ''); } catch (e) {}
    try {
      if (CFG.onNotify) { CFG.onNotify(msg, reason); return; }
      if (typeof window.toast === 'function') { window.toast(msg, 2600); return; }
    } catch (e) {}
  }

  /* ---------------- 工具 ---------------- */
  function slug(word) {
    return String(word).toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'word';
  }

  /* 输入校验：空词、纯符号、超长、非英文 → 一律跳过 */
  function normalize(word) {
    if (!CFG.enabled) return null;
    var w = String(word == null ? '' : word).trim()
      .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '');
    if (!w) return null;
    if (w.length > CFG.maxWordLen) return null;
    if (!/[A-Za-z]/.test(w)) return null;
    return w;
  }

  function accentOf(a) {
    return CFG.accents[a] ? a : CFG.defaultAccent;
  }

  /* ---------------- 索引（懒加载，失败不影响播放） ---------------- */
  function loadIndex() {
    if (indexMap || indexTried) return Promise.resolve(indexMap);
    indexTried = true;
    if (typeof fetch !== 'function') return Promise.resolve(null);
    return fetch(CFG.index, { cache: 'force-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (json) {
        indexMap = (json && json.items) || null;
        return indexMap;
      })
      .catch(function () { return null; });
  }

  function localUrl(word, accent) {
    if (indexMap && indexMap[word] && indexMap[word][accent]) {
      return CFG.base + indexMap[word][accent];
    }
    return CFG.base + slug(word) + '-' + accent + '.mp3';
  }

  /* ---------------- IndexedDB 缓存（可失败，失败即降级） ---------------- */
  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve) {
      if (!window.indexedDB) return resolve(null);
      var req;
      try { req = window.indexedDB.open('ielts-audio', 1); } catch (e) { return resolve(null); }
      req.onupgradeneeded = function () {
        try { req.result.createObjectStore('blobs'); } catch (e) { /* 已存在 */ }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { resolve(null); };
      req.onblocked = function () { resolve(null); };
    });
    return dbPromise;
  }

  function cacheGet(key) {
    return db().then(function (d) {
      if (!d) return null;
      return new Promise(function (resolve) {
        try {
          var tx = d.transaction('blobs', 'readonly');
          var rq = tx.objectStore('blobs').get(key);
          rq.onsuccess = function () { resolve(rq.result || null); };
          rq.onerror = function () { resolve(null); };
        } catch (e) { resolve(null); }
      });
    });
  }

  function cachePut(key, blob) {
    return db().then(function (d) {
      if (!d || !blob) return false;
      return new Promise(function (resolve) {
        try {
          var tx = d.transaction('blobs', 'readwrite');
          tx.objectStore('blobs').put(blob, key);
          tx.oncomplete = function () { resolve(true); };
          tx.onerror = function () { resolve(false); };
        } catch (e) { resolve(false); }
      });
    });
  }

  /* ---------------- 播放一层 ---------------- */
  function playSrc(src, timeout) {
    return new Promise(function (resolve) {
      var audio;
      var done = false;
      var timer = null;

      function finish(ok) {
        if (done) return;
        done = true;
        if (timer) clearTimeout(timer);
        resolve(ok);
      }

      try {
        audio = new Audio();
        audio.preload = 'auto';
        audio.volume = 1;
      } catch (e) { return finish(false); }

      audio.addEventListener('playing', function () { finish(true); });
      audio.addEventListener('canplaythrough', function () {
        var p = audio.play();
        if (p && p.catch) p.catch(function () { /* 自动播放被拦截，交由上层降级 */ });
      });
      audio.addEventListener('error', function () { finish(false); });

      timer = setTimeout(function () { finish(false); }, timeout || CFG.localTimeout);

      try {
        audio.src = src;
        var pr = audio.play();
        if (pr && pr.catch) pr.catch(function () { /* 同上 */ });
      } catch (e) { finish(false); }

      current = audio;
    });
  }

  /* 在线音频：先试 fetch（同源/允许 CORS 时可回写 IndexedDB），失败则直接流式播放 */
  function playOnline(url, key) {
    var canFetch = typeof fetch === 'function' && location.protocol !== 'file:';
    var chain = canFetch
      ? fetch(url, { mode: 'cors', credentials: 'omit', cache: 'no-store' })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.blob();
          })
          .then(function (blob) {
            if (!blob || blob.size < 800) throw new Error('EMPTY');
            cachePut(key, blob);                       // 回写本地缓存（不等待）
            return URL.createObjectURL(blob);
          })
      : Promise.reject(new Error('NO_FETCH'));

    return chain.then(function (objUrl) {
      return playSrc(objUrl, CFG.onlineTimeout).then(function (ok) {
        /* objectURL 播完释放，避免内存泄漏 */
        if (objUrl.indexOf('blob:') === 0) setTimeout(function () { URL.revokeObjectURL(objUrl); }, 8000);
        if (ok) return true;
        throw new Error('PLAY_FAIL');
      });
    }).catch(function () {
      /* 跨域不可读 → 直接交给 <audio> 流式播放（Service Worker 会顺手缓存） */
      return playSrc(url, CFG.onlineTimeout);
    });
  }

  /* ---------------- 系统 TTS 兜底 ---------------- */
  function speakTTS(word, accent) {
    try {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return false;
      var u = new SpeechSynthesisUtterance(word);
      u.lang = CFG.ttsLang[accent] || 'en-US';
      u.rate = 0.92;
      u.pitch = 1;
      /* 优先精确匹配对应口音的语音；取不到再退任意 en 语音 */
      var voices = window.speechSynthesis.getVoices() || [];
      var i, hit = null, any = null;
      for (i = 0; i < voices.length; i++) {
        var lg = (voices[i].lang || '').toLowerCase().replace('_', '-');
        if (lg.indexOf(u.lang.toLowerCase()) === 0) { hit = voices[i]; break; }
        if (!any && lg.indexOf('en') === 0) any = voices[i];
      }
      if (hit) u.voice = hit;
      else if (any) u.voice = any;      /* 回退：任意英语语音，绝不用别的语言硬读 */

      /* 看门狗：语音列表为空时 speak 常常“不报错也不出声”，
       * 1.4 秒内没真正开播就明确提示，绝不静默跳过 */
      var started = false;
      u.onstart = function () { started = true; };
      u.onerror = function () {
        notify('朗读失败，点喇叭重试', 'TTS_ERROR');
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      setTimeout(function () {
        if (!started) notify('当前设备暂无可用语音', 'TTS_NO_VOICE');
      }, 1400);
      return true;
    } catch (e) { return false; }
  }

  /* ---------------- iOS 解锁：首次用户手势时播一个静音帧 ---------------- */
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    try {
      var a = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=');
      a.volume = 0;
      var p = a.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) { /* 忽略 */ }
  }

  /* v15：停止当前播放（本地音频兜底与系统 TTS 的单路互斥：
   * TTS 慢启动时若本地音频已在播，停掉本地只留一路声） */
  function stop() {
    try {
      if (current) {
        current.pause();
        try { current.currentTime = 0; } catch (e) {}
      }
    } catch (e) { /* 忽略 */ }
    current = null;
  }

  /* ---------------- 对外 API ---------------- */
  function play(word, accent, opts) {
    var w = normalize(word);
    var ac = accentOf(accent);
    if (!w) {
      /* 空词 / 超长 / 非英文：也算失败，必须给反馈，不许无声返回 */
      stats.miss++;
      notify('这个单词无法朗读（内容为空或不含英文）', 'EMPTY_OR_NON_EN');
      return Promise.resolve('fail');
    }

    unlock();
    loadIndex();

    var key = w.toLowerCase() + '|' + ac;
    var allowOnline = !(opts && opts.offlineOnly === true);

    /* 统一的终极兜底：系统 TTS → 仍失败则明确提示「无可用语音」 */
    function finalFallback(reason) {
      if (speakTTS(w, ac)) { stats.tts++; stats.lastLevel = 'tts'; return 'tts'; }
      stats.miss++;
      stats.lastLevel = 'none';
      notify('当前设备暂无可用语音', reason || 'TTS_UNAVAILABLE');
      return 'fail';
    }

    /* 1) 本地打包音频 */
    return playSrc(localUrl(w, ac), CFG.localTimeout).then(function (ok) {
      if (ok) { stats.local++; stats.lastLevel = 'local'; return 'local'; }
      notify('本地发音不可用，改用缓存', 'LOCAL_FAIL');

      /* 2) IndexedDB 缓存（上次在线播放时写入的 blob） */
      return cacheGet(key).then(function (blob) {
        if (blob && blob.size > 800) {
          var objUrl = URL.createObjectURL(blob);
          return playSrc(objUrl, CFG.localTimeout).then(function (ok2) {
            setTimeout(function () { URL.revokeObjectURL(objUrl); }, 8000);
            if (ok2) { stats.cache++; stats.lastLevel = 'cache'; return 'cache'; }
            throw new Error('CACHE_PLAY_FAIL');
          });
        }
        throw new Error('NO_CACHE');
      }).catch(function (e2) {
        notify('缓存发音不可用', (e2 && e2.message) || 'NO_CACHE');

        /* 3) 在线接口（仅允许联网时） */
        if (!allowOnline) return finalFallback('OFFLINE_ONLY');
        var fn = CFG.providers[CFG.online.provider];
        if (typeof fn !== 'function') return finalFallback('NO_PROVIDER');

        return playOnline(fn(w, ac), key).then(function (ok3) {
          if (ok3) { stats.online++; stats.lastLevel = 'online'; return 'online'; }
          throw new Error('ONLINE_FAIL');
        }).catch(function () {
          notify('在线发音不可用，改用系统语音', 'ONLINE_FAIL');
          /* 4) 系统 TTS —— 失败即明确提示，绝不静默跳过 */
          return finalFallback('ONLINE_FAIL');
        });
      });
    }).catch(function () {
      /* 顶层异常同样不许无声 */
      return finalFallback('UNCAUGHT');
    });
  }

  function init(options) {
    if (options) {
      Object.keys(options).forEach(function (k) {
        if (k === 'online' && options.online) {
          CFG.online = Object.assign({}, CFG.online, options.online);
        } else if (k === 'providers' && options.providers) {
          CFG.providers = Object.assign({}, CFG.providers, options.providers);
        } else {
          CFG[k] = options[k];
        }
      });
    }
    /* 预热索引（不阻塞首屏） */
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(function () { loadIndex(); }, { timeout: 2500 });
    } else {
      setTimeout(function () { loadIndex(); }, 1200);
    }
    /* 首次手势解锁 iOS 音频通道 */
    var once = function () {
      unlock();
      document.removeEventListener('touchstart', once);
      document.removeEventListener('pointerdown', once);
    };
    document.addEventListener('touchstart', once, { passive: true });
    document.addEventListener('pointerdown', once);
    return Promise.resolve();
  }

  window.DictAudio = {
    init: init,
    play: play,
    stop: stop,
    prefetch: function (words, accent) {
      var list = (words || []).slice(0, 80);
      list.forEach(function (w) {
        var ww = normalize(w);
        if (!ww) return;
        try {
          var a = new Audio();
          a.preload = 'metadata';
          a.src = localUrl(ww, accentOf(accent));
        } catch (e) { /* 忽略 */ }
      });
    },
    setNotify: function (fn) { CFG.onNotify = (typeof fn === 'function') ? fn : null; },
    notify: notify,
    /* 系统 TTS 是否可用（用于界面上标明实际使用的发音通道） */
    ttsAvailable: function () {
      return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
    },
    setEnabled: function (on) { CFG.enabled = !!on; return CFG.enabled; },
    isEnabled: function () { return CFG.enabled; },
    stats: function () { return Object.assign({}, stats); },
    clearCache: function () {
      return db().then(function (d) {
        if (!d) return false;
        return new Promise(function (resolve) {
          try {
            var tx = d.transaction('blobs', 'readwrite');
            tx.objectStore('blobs').clear();
            tx.oncomplete = function () { resolve(true); };
            tx.onerror = function () { resolve(false); };
          } catch (e) { resolve(false); }
        });
      });
    },
    config: CFG
  };
})();
