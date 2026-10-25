/* =============================================================
 *  IELTS CBT · 玻璃透明度滑杆（v10 必做1）
 *  ---------------------------------------------------------------
 *  · 拖动滑杆实时调整全站玻璃 alpha（铬层 / 容器层 / 长文层按比例联动）
 *  · 存入 localStorage 唯一键 ielts.cbt.v1.glassOpacity，刷新与切换主题后保持
 *  · 0 = 清晰（接近实色）；100 = 通透（高度透明）；默认 50 = 中间档
 *    映射：chrome 0.85→0.25；container 0.95→0.55；long = max(container, 下限)
 *    下限：浅色 .78 / 深色 .92（v17 补丁 C1 深色近实色，主题切换自动重算）
 *  · 仅改 CSS 变量，不动任何功能逻辑 / 数据 / 题库 / 发音
 * ============================================================= */
(function () {
  var STORE_KEY = 'ielts.cbt.v1';
  var DEFAULT = 50; // 中间档 → 铬层 0.55 / 容器层 0.75 / 长文 0.78

  function clamp(v) {
    v = Number(v);
    if (isNaN(v)) return DEFAULT;
    return Math.max(0, Math.min(100, v));
  }

  /* v18 super 修：滑杆值刷新弹回 50% 的根因是「两个写者」——
     本文件直写 localStorage，而 store.js 持有整包内存快照（data），
     任何一次 Store.set(...) 都会用快照整包覆盖，把 glassOpacity 抹掉
     （实测：设 0 → localStorage.glassOpacity=0 → Store.set('lastView')
      一次 → glassOpacity 消失 → 刷新回 0.55）。
     改法：统一走 Store.get / Store.set，与全站同一个写者，不再竞态。
     Store 缺失时（极端兜底）才回落到直读 localStorage。 */
  function readStored() {
    if (window.Store && window.Store.get) {
      return clamp(window.Store.get('glassOpacity', DEFAULT));
    }
    try {
      var d = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return clamp(typeof d.glassOpacity === 'number' ? d.glassOpacity : DEFAULT);
    } catch (e) { return DEFAULT; }
  }

  function persist(t) {
    if (window.Store && window.Store.set) { window.Store.set('glassOpacity', t); return; }
    try {
      var d = {};
      try { d = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e) {}
      d.glassOpacity = t;
      localStorage.setItem(STORE_KEY, JSON.stringify(d));
    } catch (e) {}
  }

  // t: 0(清晰) → 100(通透)
  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }
  /* v17 补丁 C1：深色长文层下限 .78 → .92（近实色，恢复 v18 0.3 前的
     实底显示，压住深色多色光斑透出）；浅色下限仍 .78 不变。 */
  function longFloor() { return isDark() ? 0.92 : 0.78; }
  function applyVars(t) {
    var x = t / 100;
    var chrome = +(0.85 - 0.6 * x).toFixed(3);        // 0.85 → 0.25
    var container = +(0.95 - 0.4 * x).toFixed(3);     // 0.95 → 0.55
    var longt = +Math.max(container, longFloor()).toFixed(3); // 长文下限（深色 .92 / 浅色 .78）
    var s = document.documentElement.style;
    s.setProperty('--g-chrome', chrome);
    s.setProperty('--g-container', container);
    s.setProperty('--g-long', longt);
  }

  function syncUI(t) {
    var inputs = document.querySelectorAll('.glass-op-range');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      if (document.activeElement !== el && el.value !== String(t)) el.value = t;
    }
    var vals = document.querySelectorAll('.glass-op-val');
    for (var j = 0; j < vals.length; j++) vals[j].textContent = Math.round(t) + '%';
  }

  // 统一入口：设置透明度并持久化 + 同步 UI
  function setOpacity(t, fromUser) {
    t = clamp(t);
    applyVars(t);
    persist(t);
    syncUI(t);
    return { t: t, chrome: +(0.85 - 0.6 * (t / 100)).toFixed(3),
             container: +(0.95 - 0.4 * (t / 100)).toFixed(3),
             long: +Math.max(0.95 - 0.4 * (t / 100), longFloor()).toFixed(3) };
  }

  function init() {
    var t = readStored();
    setOpacity(t, false);
    var inputs = document.querySelectorAll('.glass-op-range');
    for (var i = 0; i < inputs.length; i++) {
      (function (el) {
        el.addEventListener('input', function () {
          setOpacity(parseFloat(el.value), true);
        });
      })(inputs[i]);
    }
    /* v17 补丁 C1：主题切换后重算一次（深色长文下限 .92 / 浅色 .78），
       保证切到深色时长文层立即近实色；theme.js 先于本文件加载（index.html
       978/985 行），data-theme 已由首屏内联脚本预置，初始值本就正确。 */
    if (window.Theme && window.Theme.onChange) {
      try { window.Theme.onChange(function () { applyVars(readStored()); }); } catch (e) {}
    }
    // 暴露给控制台 / 其它模块，便于自检
    window.__glassOp = setOpacity;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
