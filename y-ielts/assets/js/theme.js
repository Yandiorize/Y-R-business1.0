/* ============================================================
 *  主题控制器（v14：单循环按钮改三段选择，机制与数据不变）
 *  · 三段：light（浅色）/ dark（深色）/ system（跟随系统）
 *  · 持久化沿用项目既有存储方案 —— Store（localStorage 单键 ielts.cbt.v1），
 *    未引入任何新的存储机制或第三方依赖
 *  · 仅切换 <html data-theme>，浅色/深色共用 styles.css 中同一套 CSS 变量
 *  · index.html 顶部内联脚本在首屏绘制前读取同一 localStorage 键，避免刷新闪白
 *  · 旧 cycle() 已删除：三段按钮直接 set + toast，不再循环（循环按钮的标注
 *    显示的是当前模式、容易误读，2026-10-22 已记录；三段选择根治此问题）
 * ============================================================ */
window.Theme = (function () {
  'use strict';

  var KEY = 'theme';                 // 'system' | 'light' | 'dark'
  var ORDER = ['system', 'light', 'dark'];
  var LABEL = { system: '跟随系统', light: '浅色模式', dark: '深色模式' };
  var mode = 'system';
  var mq = null;
  var seg = null;
  var segBtns = [];
  var listeners = [];

  function resolved() {
    if (mode === 'system') {
      return (mq && mq.matches) ? 'dark' : 'light';
    }
    return mode;
  }

  function apply(silent) {
    document.documentElement.setAttribute('data-theme', resolved());
    segBtns.forEach(function (b) {
      var on = b.getAttribute('data-theme') === mode;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    listeners.forEach(function (fn) { try { fn(resolved(), mode); } catch (e) {} });
    if (!silent) toast('主题已切换 · ' + LABEL[mode]);
  }

  function set(m) {
    mode = (ORDER.indexOf(m) >= 0) ? m : 'system';
    Store.set(KEY, mode);
    apply(true);
  }

  function select(m) {
    set(m);
    /* v15：主题确认 toast 显式 3000ms（默认 2000ms 的瞬时提示在
       v14 验收里没被截到——机制本身无问题，见 VERSIONS.md v15 节；
       文案一字未动，主题值/持久化/三段控件一律不动）。 */
    toast('主题：' + LABEL[mode] + ' · 已记住', 3000);
  }

  function init(segSel) {
    seg = $(segSel);
    if (seg) {
      segBtns = Array.prototype.slice.call(seg.querySelectorAll('button[data-theme]'));
      segBtns.forEach(function (b) {
        b.addEventListener('click', function () { select(b.getAttribute('data-theme')); });
      });
    }
    if (window.matchMedia) {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () { if (mode === 'system') apply(true); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
    mode = Store.get(KEY, 'system');
    if (ORDER.indexOf(mode) < 0) mode = 'system';
    apply(true);
  }

  return {
    init: init,
    set: set,
    select: select,
    mode: function () { return mode; },
    resolved: resolved,
    onChange: function (fn) { listeners.push(fn); }
  };
})();
