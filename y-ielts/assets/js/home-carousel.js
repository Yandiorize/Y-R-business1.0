/* ============================================================
   首页主轮播（v24：按 ChatGPT 分享最终方案）
   ------------------------------------------------------------
   · 3 张真实内容：继续练习 / 今日学习 / 词库掌握
   · 中央卡 + 两侧倾斜露出（轻微 3D 旋转），左右箭头 + 圆点 +
     计数 01 / 03 + 手指/鼠标滑动切换；无自动播放
   · 侧卡上的透明切换层只负责切换，卡内按钮仅在中央卡可点
   · 减动效下切换变瞬跳；键盘方向键仅在首页激活且未输入时生效
   · 不依赖 app.js：只读轮播 DOM，数据仍由 app.js 的
     refreshHomeStats 按原 id 写入
   ============================================================ */
(function () {
  'use strict';

  var vp = document.getElementById('hmCarViewport');
  if (!vp) return;
  var slides = vp.querySelectorAll('.hmc-slide');
  if (slides.length < 2) return;
  var n = slides.length;
  var cur = 0;

  var prevBtn = vp.querySelector('.hmc-prev');
  var nextBtn = vp.querySelector('.hmc-next');
  var countEl = document.getElementById('hmCarCount');
  var section = vp.parentNode;
  var dots = section ? section.querySelectorAll('.hmc-dot') : [];

  function pad2(x) { return (x < 10 ? '0' : '') + x; }

  function render() {
    for (var j = 0; j < n; j++) {
      var s = slides[j];
      s.classList.remove('is-center', 'is-left', 'is-right', 'is-hidden');
      if (j === cur) s.classList.add('is-center');
      else if (j === (cur + 1) % n) s.classList.add('is-right');
      else if (j === (cur + n - 1) % n) s.classList.add('is-left');
      else s.classList.add('is-hidden');
    }
    for (var d = 0; d < dots.length; d++) {
      if (d < n) dots[d].classList.toggle('is-on', d === cur);
    }
    if (countEl) countEl.textContent = pad2(cur + 1) + ' / ' + pad2(n);
  }

  function goTo(i) {
    cur = ((i % n) + n) % n;
    render();
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { goTo(cur - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goTo(cur + 1); });
  for (var k = 0; k < dots.length; k++) {
    (function (idx) {
      dots[idx].addEventListener('click', function () { goTo(idx); });
    })(k);
  }
  var taps = vp.querySelectorAll('.hmc-tap');
  for (var t = 0; t < taps.length; t++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        if (!isNaN(idx)) goTo(idx);
      });
    })(taps[t]);
  }

  /* 滑动：横向位移超 40px 切卡；未超阈值不动作，不劫持点击 */
  var startX = null;
  vp.addEventListener('pointerdown', function (e) {
    startX = e.clientX;
  });
  vp.addEventListener('pointerup', function (e) {
    if (startX === null) return;
    var dx = e.clientX - startX;
    startX = null;
    if (dx < -40) goTo(cur + 1);
    else if (dx > 40) goTo(cur - 1);
  });
  vp.addEventListener('pointercancel', function () { startX = null; });

  /* 键盘：仅首页激活且焦点不在输入框时响应方向键 */
  document.addEventListener('keydown', function (e) {
    if (document.body.getAttribute('data-view') !== 'home') return;
    var tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') goTo(cur - 1);
    else if (e.key === 'ArrowRight') goTo(cur + 1);
  });

  render();
})();
