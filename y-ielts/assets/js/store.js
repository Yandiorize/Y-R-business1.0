/* ============================================================
 *  公共工具 · 本地存储（全部数据只保存在浏览器 localStorage）
 *  ---------------------------------------------------------------
 *  本次修改点：
 *    1) 新增 setBtnText()：把按钮文案写进 <span class="lbl">，
 *       使「开始计时 / 暂停 / 继续」这类动态文案不会覆盖注入的线性图标。
 *    2) 其余工具函数（toast / fmt* / debounce / shuffle / countWords /
 *       copyText / 分段控件）保持不变，被新模块直接复用。
 *  影响范围：全局工具层；主题（theme）、阅读作答（ranswers / rtimer / rtest）
 *            等新增键同样走这里唯一的 localStorage 键 ielts.cbt.v1。
 * ============================================================ */
(function () {
  'use strict';

  /* ---------- 本地存储 ---------- */
  var ROOT = 'ielts.cbt.v1';

  function load() {
    try {
      var raw = localStorage.getItem(ROOT);
      return raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) {
      return {};
    }
  }

  var data = load();
  /* 清空后到刷新前，拒绝一切写回（避免 beforeunload 把内存旧数据又写回去） */
  var cleared = false;

  window.Store = {
    get: function (k, dflt) {
      return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : dflt;
    },
    set: function (k, v) {
      if (cleared) return v;
      data[k] = v;
      try { localStorage.setItem(ROOT, JSON.stringify(data)); } catch (e) { /* 超配额时静默 */ }
      /* super P0：广播一次变更，让「我的」抽屉这类常驻面板能就地刷新，
         不必关掉重开（只带键名，不带数据，监听方自己读）。 */
      try {
        window.dispatchEvent(new CustomEvent('ielts:store', { detail: { key: k } }));
      } catch (e) {}
      return v;
    },
    remove: function (k) {
      if (cleared) return;
      delete data[k];
      try { localStorage.setItem(ROOT, JSON.stringify(data)); } catch (e) {}
      try {
        window.dispatchEvent(new CustomEvent('ielts:store', { detail: { key: k } }));
      } catch (e) {}
    },
    /* 跨标签页同步（ui-iter v5）：本标签页的 data 是内存快照，
       另一标签页写 localStorage 时本页快照不会自动变新；
       调用方在重渲染前先调本函数从 localStorage 重读一次。
       cleared 为真时跳过（清空后不得把已清数据复活）。 */
    syncFromStorage: function () {
      if (cleared) return data;
      try { data = load(); } catch (e) {}
      return data;
    },
    /* 清空本项目全部本地数据（顶栏「清空所有本地数据」入口使用） */
    clearAll: function () {
      cleared = true;
      data = {};
      try { localStorage.removeItem(ROOT); } catch (e) {}
    },
    /* 用导入的数据整包替换当前数据（P0 数据导入）。
       仅接受纯对象；数组 / null / 基本类型一律视为非法并落为空对象。 */
    replaceAll: function (obj) {
      data = (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
      try { localStorage.setItem(ROOT, JSON.stringify(data)); } catch (e) {}
      /* 导入后到刷新前锁定写入，避免 beforeunload 用旧内存覆盖导入结果 */
      cleared = true;
      return data;
    },
    all: function () { return data; }
  };

  /* ---------- DOM 助手 ---------- */
  window.$ = function (sel, root) { return (root || document).querySelector(sel); };
  window.$$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  window.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  /* ---------- 按钮文案（保留注入的图标） ---------- */
  window.setBtnText = function (btn, txt) {
    if (!btn) return;
    var lbl = btn.querySelector('.lbl');
    if (lbl) lbl.textContent = txt;
    else btn.textContent = txt;
  };

  /* ---------- 轻提示 ---------- */
  var TW = null;
  window.toast = function (msg, ms) {
    if (!TW) TW = document.getElementById('toastWrap');
    if (!TW) return;
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    TW.appendChild(el);
    setTimeout(function () {
      el.classList.add('is-out');
      setTimeout(function () { el.remove(); }, 320);
    }, ms || 2000);
  };

  /* ---------- 格式化 ---------- */
  window.fmtClock = function (sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  };

  window.fmtDate = function (ts) {
    var d = new Date(ts);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
           ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  };

  window.fmtAgo = function (ts) {
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return '刚刚';
    if (s < 3600) return Math.floor(s / 60) + ' 分钟前';
    if (s < 86400) return Math.floor(s / 3600) + ' 小时前';
    return Math.floor(s / 86400) + ' 天前';
  };

  window.fmtDue = function (ts) {
    var diff = ts - Date.now();
    if (diff <= 0) return '待复习';
    var m = Math.floor(diff / 60000);
    if (m < 60) return m + ' 分钟后';
    var h = Math.floor(m / 60);
    if (h < 24) return h + ' 小时后';
    return Math.floor(h / 24) + ' 天后';
  };

  window.debounce = function (fn, wait) {
    var t = null;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, wait);
    };
  };

  window.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  /* ---------- 英文单词计数 ---------- */
  window.countWords = function (text) {
    if (!text) return 0;
    var m = text.trim().match(/[A-Za-z0-9'’\-]+/g);
    return m ? m.length : 0;
  };

  /* ---------- 复制到剪贴板 ---------- */
  window.copyText = function (text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast('已复制到剪贴板'); },
        function () { fallbackCopy(text); }
      );
    } else {
      fallbackCopy(text);
    }
  };
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('已复制到剪贴板'); }
    catch (e) { toast('复制失败，请手动选择'); }
    ta.remove();
  }

  /* ---------- 分段控件（滑块跟随） ---------- */
  window.syncSegThumb = function (segEl, thumbEl) {
    var btn = segEl.querySelector('.seg-btn.is-active');
    if (!btn || !thumbEl) return;
    thumbEl.style.width = btn.offsetWidth + 'px';
    thumbEl.style.transform = 'translateX(' + (btn.offsetLeft - 3) + 'px)';
  };

  window.bindSeg = function (segEl, thumbEl, onPick) {
    var btns = $$('.seg-btn', segEl);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('is-active'); });
        b.classList.add('is-active');
        syncSegThumb(segEl, thumbEl);
        onPick(b);
      });
    });
    syncSegThumb(segEl, thumbEl);
    window.addEventListener('resize', function () { syncSegThumb(segEl, thumbEl); });
  };
})();
