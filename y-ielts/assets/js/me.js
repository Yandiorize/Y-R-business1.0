/* ============================================================
 *  「我的」抽屉（v16）
 *  ---------------------------------------------------------------
 *  · 入口：顶栏 logo（#brandLogo）点击 / 键盘 Enter·Space → 右侧抽屉滑出；
 *    页脚「关于」（#btnAbout）走同一入口并滚到关于区（#meAbout）
 *  · 不新增独立页面 / 标签页 / 路由：抽屉只是覆盖层，打开与关闭都
 *    不触碰当前视图，关闭后自动回到原模块、原状态
 *  · 内容（自上而下）：学习总览 → 成绩趋势 → 我的词库 →
 *    设置（字号）→ 数据管理 → 关于
 *  · 数据只读 Store（rhist / deck），统计口径与各模块渲染函数一致；
 *    字号 / 数据 / 复习均调用既有导出面（App / Vocab / Reading），不重复实现
 * ============================================================ */
(function () {
  'use strict';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function setText(sel, txt) {
    var n = $(sel);
    if (n) n.textContent = txt;
  }

  var FONT_NAMES = ['较小', '标准', '较大', '特大'];
  var drawer = null;
  var opened = false;

  /* ---------------- 开 / 关（不切换视图，原模块原状态保持） ---------------- */
  function open(about) {
    if (!drawer) drawer = $('#meDrawer');
    if (!drawer) return;
    opened = true;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('me-lock');
    renderAll();
    if (about) {
      requestAnimationFrame(function () {
        var a = $('#meAbout');
        if (a && a.scrollIntoView) a.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  function close() {
    if (!drawer) drawer = $('#meDrawer');
    if (!drawer) return;
    opened = false;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('me-lock');
  }

  /* ---------------- ② 学习总览 + ④ 词库统计（口径与 vocab/reading 渲染一致） ---------------- */
  function renderStats() {
    var hist = Store.get('rhist', []);
    hist = Array.isArray(hist) ? hist : [];
    var deck = Store.get('deck', []);
    deck = Array.isArray(deck) ? deck : [];
    var mastered = deck.filter(function (d) { return d.right >= 2 && d.wrong === 0; }).length;
    var pct = deck.length ? Math.round((mastered / deck.length) * 100) : 0;
    var due = deck.filter(function (d) { return d.m && d.due && d.due <= Date.now(); }).length;
    var wrong = deck.filter(function (d) { return d.inWrong; }).length;
    var band = (hist.length && typeof hist[0].band === 'number') ? hist[0].band.toFixed(1) : '—';

    setText('#meSubmits', hist.length);
    setText('#meBand', band);
    setText('#meWords', deck.length);
    setText('#meMaster', pct + '%');
    setText('#meDue', due);
    setText('#meDeckAll', deck.length);
    setText('#meDeckWrong', wrong);
    setText('#meDeckDue', due);
  }

  /* ---------------- ③ 成绩趋势（复用阅读模块渲染，真图真点） ---------------- */
  function renderTrend() {
    var host = $('#meTrendBody');
    if (!host || !window.Reading || !Reading.renderTrendInto) return;
    Reading.renderTrendInto(host, {
      onLocate: function (loc) {
        close();
        if (window.App && App.switchView) App.switchView('reading');
        /* 视图切换后再定位（隐藏元素 scrollIntoView 无效，等一帧布局） */
        requestAnimationFrame(function () {
          if (window.Reading && Reading.locate) Reading.locate(loc);
        });
      }
    });
  }

  /* ---------------- ⑤ 字号（4 档，App.setFontLevel 与原顶栏按钮同机制） ---------------- */
  function renderFont() {
    var lv = (window.App && App.getFontLevel) ? App.getFontLevel() : 1;
    $$('#meFontBtns button').forEach(function (b) {
      b.classList.toggle('is-active', parseInt(b.dataset.lv, 10) === lv);
    });
  }

  function bindFont() {
    $$('#meFontBtns button').forEach(function (b) {
      b.addEventListener('click', function () {
        var lv = parseInt(b.dataset.lv, 10);
        if (window.App && App.setFontLevel) App.setFontLevel(lv);
        renderFont();
        toast('字号：' + FONT_NAMES[lv] + '（' + (lv + 1) + '/4）');
      });
    });
  }

  /* ---------------- ④ 词库入口：错词本 / 复习队列 ---------------- */
  function goVocab(fn) {
    if (window.App && App.switchView) App.switchView('vocab');
    requestAnimationFrame(function () { requestAnimationFrame(fn); });
  }

  function bindVocab() {
    var w = $('#meBtnWrong');
    if (w) w.addEventListener('click', function () {
      close();
      goVocab(function () { if (window.Vocab && Vocab.startWrong) Vocab.startWrong(); });
    });
    var d = $('#meBtnDue');
    if (d) d.addEventListener('click', function () {
      close();
      goVocab(function () { if (window.Vocab && Vocab.startReview) Vocab.startReview(); });
    });
  }

  /* ---------------- ⑥ 数据管理（清空仍走 App.clearAllData 的二次确认） ---------------- */
  function bindData() {
    var exp = $('#meBtnExport');
    if (exp) exp.addEventListener('click', function () {
      if (window.App && App.exportAllData) App.exportAllData();
    });
    var imp = $('#meBtnImport');
    var file = $('#dataImportFile');
    if (imp && file) {
      imp.addEventListener('click', function () { file.value = ''; file.click(); });
      file.addEventListener('change', function () {
        if (window.App && App.importFile) App.importFile(file.files && file.files[0]);
      });
    }
    var share = $('#meBtnShare');
    if (share) share.addEventListener('click', function () {
      if (window.App && App.copyLink) App.copyLink();
    });
    var clear = $('#meBtnClear');
    if (clear) clear.addEventListener('click', function () {
      if (window.App && App.clearAllData) App.clearAllData();
    });
  }

  /* ---------------- 入口绑定：logo / 页脚关于 / 关闭 / Esc ---------------- */
  function bindEntry() {
    var logo = $('#brandLogo');
    if (logo) {
      logo.addEventListener('click', function () { open(false); });
      logo.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          open(false);
        }
      });
    }
    var about = $('#btnAbout');
    if (about) about.addEventListener('click', function () { open(true); });
  }

  function bindClose() {
    if (drawer) {
      drawer.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('[data-me-close]')) close();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && opened) close();
    });
  }

  function renderAll() {
    renderStats();
    renderTrend();
    renderFont();
  }

  function init() {
    drawer = $('#meDrawer');
    /* super P0：抽屉开着时，任何一处写数据都就地刷新，不用关掉重开。
       只在 opened 为真时重算，避免后台无谓渲染。 */
    window.addEventListener('ielts:store', function () {
      if (opened) renderAll();
    });
    document.addEventListener('visibilitychange', function () {
      if (opened && !document.hidden) renderAll();
    });
    bindEntry();
    bindClose();
    bindFont();
    bindVocab();
    bindData();
  }

  window.Me = {
    open: open,
    close: close,
    openAbout: function () { open(true); },
    refresh: renderAll
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
