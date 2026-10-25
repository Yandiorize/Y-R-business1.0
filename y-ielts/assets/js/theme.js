/* ============================================================
 *  主题控制器（本次改版新增）
 *  · 三态：system（跟随系统）/ light / dark，点击顶栏开关循环切换
 *  · 持久化沿用项目既有存储方案 —— Store（localStorage 单键 ielts.cbt.v1），
 *    未引入任何新的存储机制或第三方依赖
 *  · 仅切换 <html data-theme>，浅色/深色共用 styles.css 中同一套 CSS 变量
 *  影响范围：全站配色；index.html 顶部有一段内联脚本在首屏绘制前读取同一
 *            localStorage 键，避免刷新闪白。
 * ============================================================ */
window.Theme = (function () {
  'use strict';

  var KEY = 'theme';                 // 'system' | 'light' | 'dark'
  var ORDER = ['system', 'light', 'dark'];
  var LABEL = { system: '跟随系统', light: '浅色模式', dark: '深色模式' };
  var mode = 'system';
  var mq = null;
  var btn = null;
  var listeners = [];

  function resolved() {
    if (mode === 'system') {
      return (mq && mq.matches) ? 'dark' : 'light';
    }
    return mode;
  }

  function apply(silent) {
    document.documentElement.setAttribute('data-theme', resolved());
    if (btn) {
      btn.innerHTML = Icons.get(mode === 'system' ? 'auto' : (resolved() === 'dark' ? 'moon' : 'sun'), 18) +
        '<span class="lbl">主题</span>';
      btn.setAttribute('title', '主题：' + LABEL[mode] + '（点击切换）');
      btn.setAttribute('aria-label', '主题：' + LABEL[mode]);
    }
    listeners.forEach(function (fn) { try { fn(resolved(), mode); } catch (e) {} });
    if (!silent) toast('主题已切换 · ' + LABEL[mode]);
  }

  function set(m) {
    mode = (ORDER.indexOf(m) >= 0) ? m : 'system';
    Store.set(KEY, mode);
    apply(true);
  }

  function cycle() {
    var i = ORDER.indexOf(mode);
    set(ORDER[(i + 1) % ORDER.length]);
    toast('主题：' + LABEL[mode] + ' · 已记住');
  }

  function init(buttonSel) {
    btn = $(buttonSel);
    if (window.matchMedia) {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () { if (mode === 'system') apply(true); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
    mode = Store.get(KEY, 'system');
    if (ORDER.indexOf(mode) < 0) mode = 'system';
    if (btn) btn.addEventListener('click', cycle);
    apply(true);
  }

  return {
    init: init,
    set: set,
    cycle: cycle,
    mode: function () { return mode; },
    resolved: resolved,
    onChange: function (fn) { listeners.push(fn); }
  };
})();
