/* ============================================================
 *  V3（D3 旋转模式）：首页练习模块五面 3D 转盘（手动旋转，呈现层 only）
 *  ------------------------------------------------------------
 *  面片是原来的 5 个模块按钮（class hm-go + data-view，图标 / 文案 /
 *  进度与下一步的真实 ID 全部原样），点面片进模块仍走 app.js 的
 *  .hm-go 绑定——本文件不给面片加任何 click 处理，入口行为与原来
 *  点行 byte 级一致。
 *  旋转方式（全部是手动，无自动轮播，本文件无 setInterval/setTimeout）：
 *  左右箭头、圆点、触屏滑动、方向键 / Home / End；首尾循环，边界不抛。
 *  3D：wheel preserve-3d，面片 rotateY(i*72°) translateZ(R)，R 由面片
 *  实宽算出；resize 重算。转动层无 backdrop-filter（手册 8.1）。
 *  动效：transform 280ms（≤300ms）；prefers-reduced-motion 下 CSS
 *  关掉 transition，状态切换保留。
 * ============================================================ */
(function () {
  'use strict';

  var root = document.getElementById('modTurntable');
  if (!root) return;
  var wheel = document.getElementById('t5Wheel');
  if (!wheel) return;
  var faces = wheel.children;
  var n = faces.length;
  if (!n) return;

  var STEP = 360 / n;
  var index = 0;
  var R = 0;
  var stage = root.querySelector('.t5-stage');
  var prevBtn = document.getElementById('t5Prev');
  var nextBtn = document.getElementById('t5Next');
  var dots = root.querySelectorAll('.t5-dot');
  var countEl = document.getElementById('t5Count');
  var startX = null;
  var reduceMotion = false;
  try {
    reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { /* 保持 false */ }

  /* R = (面宽/2) / tan(π/5)：五面正好围成一圈；舞台高度取最高面片。 */
  function measure() {
    var w = faces[0].offsetWidth || 0;
    if (w > 0) R = Math.round((w / 2) / Math.tan(Math.PI / n));
    var h = 0, i;
    for (i = 0; i < n; i++) {
      if (faces[i].offsetHeight > h) h = faces[i].offsetHeight;
    }
    if (stage && h > 0) stage.style.height = (h + 24) + 'px';
  }

  function render() {
    var i;
    if (!reduceMotion) wheel.classList.add('is-anim');
    for (i = 0; i < n; i++) {
      faces[i].style.transform = 'rotateY(' + (i * STEP) + 'deg) translateZ(' + R + 'px)';
      faces[i].classList.toggle('is-front', i === index);
    }
    wheel.style.transform = 'rotateY(' + (-index * STEP) + 'deg)';
    for (i = 0; i < dots.length; i++) {
      var on = i === index;
      dots[i].classList.toggle('is-on', on);
      if (on) dots[i].setAttribute('aria-current', 'true');
      else dots[i].removeAttribute('aria-current');
    }
    if (countEl) countEl.textContent = (index + 1) + ' / ' + n;
  }

  function goTo(i, focusFace) {
    index = ((i % n) + n) % n;
    render();
    if (focusFace && faces[index] && faces[index].focus) faces[index].focus();
  }
  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  wheel.addEventListener('transitionend', function () {
    wheel.classList.remove('is-anim');
  });

  if (prevBtn) prevBtn.addEventListener('click', function () { prev(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { next(); });
  var d;
  for (d = 0; d < dots.length; d++) {
    (function (dot) {
      dot.addEventListener('click', function () {
        goTo(parseInt(dot.getAttribute('data-index'), 10) || 0);
      });
    })(dots[d]);
  }

  /* 键盘：方向键切面并把焦点移到新的正面面片；Home/End 直达两端。
     Tab 走原生焦点顺序（面片/箭头/圆点均为原生 button，焦点可见）。 */
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
      goTo(index - 1, true);
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      goTo(index + 1, true);
      e.preventDefault();
    } else if (e.key === 'Home') {
      goTo(0, true);
      e.preventDefault();
    } else if (e.key === 'End') {
      goTo(n - 1, true);
      e.preventDefault();
    }
  });

  /* 触屏滑动：只读 touchend 的水平位移，不拦截 touchmove，纵向滚动不受影响。 */
  root.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches.length === 1) {
      startX = e.touches[0].clientX;
    } else {
      startX = null;
    }
  }, { passive: true });
  root.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var end = e.changedTouches && e.changedTouches[0];
    if (!end) { startX = null; return; }
    var dx = end.clientX - startX;
    startX = null;
    if (dx < -40) {
      next();
    } else if (dx > 40) {
      prev();
    }
  }, { passive: true });

  window.addEventListener('resize', function () { measure(); render(); });

  measure();
  render();

  /* 供测试与调试：不暴露给界面，仅 jsdom 断言用。 */
  window.ModTurntable = {
    goTo: goTo,
    next: next,
    prev: prev,
    getIndex: function () { return index; },
    getCount: function () { return n; },
    measure: measure,
    render: render
  };
})();
