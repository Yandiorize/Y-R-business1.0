/* ============================================================
 *  ui-iter v15-A：底栏玻璃滑块（指示 pill，不改导航行为）
 *  ---------------------------------------------------------------
 *  · 指示器是 #tabbarInner 内一个独立元素 #tabbarInd（玻璃材质、
 *    圆角胶囊、pointer-events:none、z-index 在按钮之下），只起
 *    「当前页高亮」作用；4 个 tab 的标签/图标/顺序/路由一律不动，
 *    选中蓝字蓝图标仍是主信号，pill 只是叠加的第二信号。
 *  · 全部视图切换（点 tab、深链、popstate）都走 app.js switchView
 *    改 .tabbar-btn.is-active——本模块用 MutationObserver 监听
 *    inner 内 class 变化，全路径覆盖，不碰 app.js、不改路由。
 *  · 位置取当前选中按钮的 offsetLeft/offsetWidth/offsetTop/
 *    offsetHeight（已含 inner padding 与栅格间隙），transform +
 *    width 双 280ms ease 滑动；resize 与底栏重现（考试全屏
 *    退出）时 instant 重算，不拖尾影；首屏 instant 落位，无闪烁。
 *  · 考试全屏时 #tabbar 本身 display:none，pill 随之隐藏，
 *    无需特殊处理；prefers-reduced-motion 下 CSS 关掉 transition，
 *    滑动变瞬跳（见 ui-iter.css v15-A 节）。
 *  · 本模块不做拖拽/滑动切换：只是指示器滑动（用户一句话可纠
 *    为拖拽切换，彼时再改）。
 * ============================================================ */
(function () {
  'use strict';

  var tabbar = document.getElementById('tabbar');
  if (!tabbar) return;
  var inner = tabbar.querySelector('.tabbar-inner');
  var ind = document.getElementById('tabbarInd');
  if (!inner || !ind) return;

  function activeBtn() {
    return inner.querySelector('.tabbar-btn.is-active') ||
      inner.querySelector('.tabbar-btn');
  }

  function sync(instant) {
    var b = activeBtn();
    if (!b) {
      /* 无选中项时只在真的亮着时摘掉（无变化不写 DOM，避免无意义的
         属性变动反过来再触发观察者——幂等是本模块的硬要求）。 */
      if (ind.classList.contains('on')) ind.classList.remove('on');
      return;
    }
    var left = b.offsetLeft || 0;
    var top = b.offsetTop || 0;
    var w = b.offsetWidth || 0;
    var h = b.offsetHeight || 0;
    var tx = 'translateX(' + left + 'px)';
    var ws = w + 'px';
    var ts = top + 'px';
    var hs = h + 'px';
    /* 幂等：位置与亮态都与当前一致时一律不写 DOM——否则观察者
       回调里的每次写都会再产生一次变动记录，形成自激循环。 */
    if (ind.style.transform === tx && ind.style.width === ws &&
        ind.style.top === ts && ind.style.height === hs &&
        ind.classList.contains('on')) return;
    if (instant) {
      /* 关掉 transition 写一帧再恢复：落位不滑动、无闪烁。 */
      var prev = ind.style.transition;
      ind.style.transition = 'none';
      ind.style.transform = 'translateX(' + left + 'px)';
      ind.style.width = w + 'px';
      ind.style.top = top + 'px';
      ind.style.height = h + 'px';
      void ind.offsetWidth;
      ind.style.transition = prev;
    } else {
      ind.style.transform = 'translateX(' + left + 'px)';
      ind.style.width = w + 'px';
      ind.style.top = top + 'px';
      ind.style.height = h + 'px';
    }
    ind.classList.add('on');
  }

  if (window.MutationObserver) {
    var mo = new MutationObserver(function () { sync(false); });
    mo.observe(inner, { attributes: true, attributeFilter: ['class'], subtree: true });
  }
  /* 尺寸变化 instant 重算（窗口 resize / 底栏重现时不拖尾影）。 */
  window.addEventListener('resize', function () { sync(true); });
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { sync(true); });
    ro.observe(inner);
  }

  /* 首屏 instant 落位：本脚本在 body 末尾，首绘前已执行。 */
  sync(true);

  /* 供测试与调试：不暴露给界面，仅 jsdom 断言用。 */
  window.TabbarIndicator = { sync: sync, element: ind };
})();
