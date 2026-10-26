/* ============================================================
 *  v12：学习区旋转封面轮播（手动旋转，呈现层 only）
 *  ---------------------------------------------------------------
 *  封面就是原来的 5 个模块按钮（class home-tile + data-view +
 *  data-icon + lr-name/lr-meta/lr-next/lr-chip/lr-meter 全部原样），
 *  点封面进模块仍走 app.js 的 .home-tile 绑定——本文件不给封面
 *  加任何 click 处理，入口行为与原来点行 byte 级一致。
 *  旋转方式（全部是手动，无自动轮播，本文件无 setInterval/setTimeout）：
 *  触屏滑动、上一封/下一封箭头、圆点、方向键/Home/End；首尾循环
 *  （下一封到头回第一封，上一封到头回最后一封），边界不抛。
 *  动效：transform 280ms（≤300ms）；prefers-reduced-motion 下 CSS
 *  关掉 transition，见 ui-iter.css v12 节。
 * ============================================================ */
(function () {
  'use strict';

  var carousel = document.getElementById('learnCarousel');
  if (!carousel) return;
  var track = document.getElementById('learnTrack');
  if (!track) return;
  var slides = track.children;
  if (!slides || slides.length === 0) return;

  var prevBtn = carousel.querySelector('.lc-prev');
  var nextBtn = carousel.querySelector('.lc-next');
  var dots = carousel.querySelectorAll('.lc-dot');
  var index = 0;
  var startX = null;

  /* v16：学习区下方小条改为介绍——模块名 + 1–2 行既定事实介绍，
     事实表在本文件内，不新增数据文件；无新功能、无新承诺。 */
  var INTRO = {
    reading: '剑桥 17 Test 1–4，40 题，60 分钟，机考双栏练习。',
    listening: '剑桥 17 Test 1 Section 1，10 题，30 分钟，听句填空。',
    writing: 'Task 1 / Task 2，60 分钟计时练习，本地草稿，剑 17 / 18 / 19 Test 1–4，随机抽题。',
    vocab: '50 词一轮示例词表，记忆练习，间隔重复，错词本。',
    essays: '24 篇范文，Task 1 / Task 2 各 12 篇。'
  };

  function slideWidth() {
    var vw = window.innerWidth || 0;
    /* v14：封面加宽（与 ui-iter.css v14 节 .lc-slide 的 min(86vw, 400px) 成对，
       两处常量必须同步改，否则居中偏移错位）。 */
    return Math.min(vw * 0.86, 400);
  }

  function layout() {
    var vw = window.innerWidth || 0;
    var w = slideWidth();
    var gap = 12;
    var offset = (vw - w) / 2 - index * (w + gap);
    track.style.transform = 'translateX(' + offset + 'px)';
    var i;
    for (i = 0; i < slides.length; i++) {
      slides[i].classList.toggle('is-active', i === index);
    }
    for (i = 0; i < dots.length; i++) {
      var on = i === index;
      dots[i].classList.toggle('is-active', on);
      if (on) {
        dots[i].setAttribute('aria-current', 'true');
      } else {
        dots[i].removeAttribute('aria-current');
      }
    }
    /* v17：轮播位置计数——与圆点同一信息的可读数字标签（圆点已有
       aria-current，计数 aria-hidden，不重复播报）；只写文本，不改布局逻辑。 */
    var countEl = document.getElementById('learnCount');
    if (countEl) countEl.textContent = (index + 1) + ' / ' + slides.length;
    /* v16：学习区下方小条改为介绍——跟随居中封面，模块名读该封面
       已有的 .lr-name，介绍读上方 INTRO 事实表；v15 的下一步行与
       用法提示行已移除，本处不再读取 .lr-next。 */
    var stripName = document.getElementById('learnStripName');
    var stripIntro = document.getElementById('learnStripIntro');
    if (slides[index]) {
      var nm = slides[index].querySelector('.lr-name');
      if (stripName && nm) stripName.textContent = nm.textContent;
      var key = slides[index].getAttribute('data-view');
      if (stripIntro && INTRO[key]) stripIntro.textContent = INTRO[key];
    }
  }

  function goTo(i) {
    var n = slides.length;
    index = ((i % n) + n) % n;
    layout();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);
  var d;
  for (d = 0; d < dots.length; d++) {
    (function (dot) {
      dot.addEventListener('click', function () {
        goTo(parseInt(dot.getAttribute('data-index'), 10) || 0);
      });
    })(dots[d]);
  }

  /* 键盘：方向键切封面并把焦点移到新居中封面；Home/End 直达两端。
     Tab 本身走原生焦点顺序（封面/箭头/圆点均为原生 button，焦点可见）。 */
  carousel.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
      prev();
      slides[index].focus();
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      next();
      slides[index].focus();
      e.preventDefault();
    } else if (e.key === 'Home') {
      goTo(0);
      slides[index].focus();
      e.preventDefault();
    } else if (e.key === 'End') {
      goTo(slides.length - 1);
      slides[index].focus();
      e.preventDefault();
    }
  });

  /* 触屏滑动：只读 touchend 的水平位移，不拦截 touchmove，纵向滚动不受影响。
     拖动类操作的单指针替代品就是箭头/圆点/方向键（见上）。 */
  carousel.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches.length === 1) {
      startX = e.touches[0].clientX;
    } else {
      startX = null;
    }
  }, { passive: true });
  carousel.addEventListener('touchend', function (e) {
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

  window.addEventListener('resize', layout);

  layout();

  /* 供测试与调试：不暴露给界面，仅 jsdom 断言用。 */
  window.LearnCarousel = {
    goTo: goTo,
    next: next,
    prev: prev,
    getIndex: function () { return index; },
    getCount: function () { return slides.length; },
    layout: layout
  };
})();
