/* ============================================================
 *  「我的」整页（v11：由半屏抽屉改为独立整页）
 *  ---------------------------------------------------------------
 *  · 入口：底栏「我的」（data-view="me"，与其他主页面同级路由 #me）；
 *    页脚「关于」（#btnAbout）走同一入口并滚到关于区（#meAbout）。
 *    原顶栏 logo 入口随顶栏取消而退役，不再有抽屉形态。
 *  · 内容（自上而下）：学习总览 → 成绩趋势 → 我的词库 →
 *    设置（主题 / 字号 / 玻璃透明度）→ 数据管理 → 关于 → 更新日志；
 *    全部 id 与 v10 抽屉版一字不动，渲染函数原样复用。
 *  · 实时刷新（v5 行为在整页上的实现，两路）：
 *      (1) 页可见时刷新：本页处于 is-active 时，任何一处写数据
 *          （同文档 ielts:store 事件）或另一标签页写 localStorage
 *          （storage 事件）都就地重渲染，不用切走重进；
 *      (2) 进入时刷新：每次进入「我的」页（Me.open）都先
 *          syncFromStorage 再渲染，切回即最新。
 *    退出整页不再有关闭语义：Esc 不导航；页内「错词本 / 复习队列」
 *    照常切到单词页，趋势定位照常切到阅读页。
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

  /* ---------------- 开 / 关（整页语义） ---------------- */
  function isVisible() {
    var v = document.getElementById('view-me');
    return !!(v && v.classList.contains('is-active'));
  }

  function open(about) {
    if (window.App && App.switchView) App.switchView('me');
    renderAll();
    if (about) {
      requestAnimationFrame(function () {
        var a = $('#meAbout');
        if (a && a.scrollIntoView) a.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  function close() {
    /* 整页没有“关闭”动作；保留给旧调用点（趋势定位、词库入口在切视图
       前都会调 close()），现在是空操作，切视图本身就是离开本页。 */
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

  /* ---------------- v13：学习仪表盘（Band.pk 式本地仪表盘；只读既有数据） ----------------
     · Band：取阅读与听力最近一次交卷中时间较晚者的 Band（两者都存 Band；
       只取其一时 meta 写明科目，不混成“总 Band”）；无记录时 '—' + 空态文案。
     · 目标：站内没有任何目标分数记录（无目标设定功能、无目标存储键），
       故目标行如实写“未设”，不编造数字；目标功能若要加，需新功能 +
       新存储键，另起一版，不在本版偷偷加。
     · 分技能正确率：阅读 = 最新 rhist got/total；听力 = 最新 lsubmitted
       got/total（按 at 取最新）；写作不评分，只列草稿篇数与历史条数；
       单词 = 掌握口径（right>=2 且 wrong===0 / 词库总数，与 renderStats 一致）。
     · 连续学习：与首页 ovStreak 同口径（从今天往前推 vdaily），7 点条
       左旧右新、今天在最右，与首页打卡点同一渲染。 */
  function fmtMD(ts) {
    var d = new Date(ts);
    return (d.getMonth() + 1) + '/' + d.getDate();
  }

  function pctOf(got, total) {
    return total ? Math.round((got / total) * 100) : 0;
  }

  function numOf(v) {
    return (typeof v === 'number') ? v : 0;
  }

  function dashSkillRow(name, text, pct, hasBar) {
    var row = '<div class="me-dash-row"><span class="me-dash-name">' + name + '</span>';
    if (hasBar) {
      row += '<span class="me-dash-bar"><i style="width:' + pct + '%"></i></span>';
    }
    row += '<span class="me-dash-val">' + text + '</span></div>';
    return row;
  }

  function renderDashboard() {
    var hist = Store.get('rhist', []);
    hist = Array.isArray(hist) ? hist : [];
    var lsub = Store.get('lsubmitted', {}) || {};
    var drafts = Store.get('drafts', {}) || {};
    var wHist = Store.get('history', []);
    wHist = Array.isArray(wHist) ? wHist : [];
    var deck = Store.get('deck', []);
    deck = Array.isArray(deck) ? deck : [];
    var daily = Store.get('vdaily', {}) || {};

    var rLatest = hist.length ? hist[0] : null;
    var lLatest = null, k;
    for (k in lsub) {
      if (!lsub.hasOwnProperty(k)) continue;
      var e = lsub[k];
      if (e && typeof e.at === 'number' && (!lLatest || e.at > lLatest.at)) lLatest = e;
    }
    var hero = null, heroSkill = '';
    if (rLatest && typeof rLatest.band === 'number') { hero = rLatest; heroSkill = '阅读'; }
    if (lLatest && typeof lLatest.band === 'number' && (!hero || lLatest.at > hero.at)) { hero = lLatest; heroSkill = '听力'; }
    setText('#meDashBand', hero ? hero.band.toFixed(1) : '—');
    /* v17：最新 Band 较上次变化——只读既有交卷记录，同科目比（阅读比阅读、
       听力比听力，不跨科目混比）；只有一次记录时不显示变化，不编造；
       不新增存储键、不新增元素，只接在现有 meta 行末尾。 */
    var prevBand = null;
    if (heroSkill === '阅读') {
      for (var hi = 1; hi < hist.length; hi++) {
        if (hist[hi] && typeof hist[hi].band === 'number') { prevBand = hist[hi].band; break; }
      }
    } else if (heroSkill === '听力') {
      var lAll = [];
      for (var lk in lsub) {
        if (lsub.hasOwnProperty(lk) && lsub[lk] && typeof lsub[lk].at === 'number' && typeof lsub[lk].band === 'number') lAll.push(lsub[lk]);
      }
      lAll.sort(function (a, b) { return b.at - a.at; });
      if (lAll.length > 1) prevBand = lAll[1].band;
    }
    var dashMeta = hero
      ? ('最近一次：' + heroSkill + ' · ' + numOf(hero.got) + '/' + numOf(hero.total) + ' · ' + fmtMD(hero.at))
      : '暂无记录，交卷后自动记录';
    if (hero && prevBand !== null) {
      var dBand = hero.band - prevBand;
      dashMeta += (dBand > 0) ? (' · 较上次 +' + dBand.toFixed(1))
        : (dBand < 0 ? (' · 较上次 ' + dBand.toFixed(1)) : ' · 较上次持平');
    }
    /* v18：最弱科目——只比两个已评分科目的最新 Band（同一量纲），
       与 v17「变化只同科目比」不冲突（变化比先后，最弱比水平）；
       只有一科有分或两科持平时不写，不编造；不新增存储键、不新增元素，
       只接在现有 meta 行末尾。 */
    var rBand = (rLatest && typeof rLatest.band === 'number') ? rLatest.band : null;
    var lBand = (lLatest && typeof lLatest.band === 'number') ? lLatest.band : null;
    if (rBand !== null && lBand !== null && rBand !== lBand) {
      dashMeta += (rBand < lBand) ? (' · 最弱：阅读 ' + rBand.toFixed(1))
        : (' · 最弱：听力 ' + lBand.toFixed(1));
    }
    setText('#meDashBandMeta', dashMeta);

    var rows = '';
    rows += dashSkillRow('阅读',
      rLatest ? (numOf(rLatest.got) + '/' + numOf(rLatest.total) + ' · ' + pctOf(numOf(rLatest.got), numOf(rLatest.total)) + '%') : '暂无记录',
      rLatest ? pctOf(numOf(rLatest.got), numOf(rLatest.total)) : 0, !!rLatest);
    rows += dashSkillRow('听力',
      lLatest ? (numOf(lLatest.got) + '/' + numOf(lLatest.total) + ' · ' + pctOf(numOf(lLatest.got), numOf(lLatest.total)) + '%') : '暂无记录',
      lLatest ? pctOf(numOf(lLatest.got), numOf(lLatest.total)) : 0, !!lLatest);
    var draftN = Object.keys(drafts).length;
    rows += dashSkillRow('写作',
      (draftN || wHist.length) ? ('不评分 · 草稿 ' + draftN + ' 篇 / 历史 ' + wHist.length + ' 条') : '不评分 · 暂无草稿与历史',
      0, false);
    var mastered = deck.filter(function (d) { return d.right >= 2 && d.wrong === 0; }).length;
    var mpct = deck.length ? Math.round((mastered / deck.length) * 100) : 0;
    rows += dashSkillRow('单词',
      deck.length ? ('掌握 ' + mastered + '/' + deck.length + ' 词 · ' + mpct + '%') : '词库为空',
      mpct, !!deck.length);
    var host = document.getElementById('meDashSkills');
    if (host) host.innerHTML = rows;

    var streak = 0, dd = new Date();
    var pp = function (n) { return (n < 10 ? '0' : '') + n; };
    for (;;) {
      var k2 = dd.getFullYear() + '-' + pp(dd.getMonth() + 1) + '-' + pp(dd.getDate());
      if (!daily[k2]) break;
      streak++;
      dd.setDate(dd.getDate() - 1);
    }
    setText('#meDashStreak', streak);
    setText('#meDashStreakHint', streak ? '保持住' : '今天还没开始');
    var dotsEl = document.getElementById('meDashDots');
    if (dotsEl) {
      var dotsHtml = '';
      for (var di = 6; di >= 0; di--) {
        var dd2 = new Date();
        dd2.setDate(dd2.getDate() - di);
        var k3 = dd2.getFullYear() + '-' + pp(dd2.getMonth() + 1) + '-' + pp(dd2.getDate());
        dotsHtml += '<i class="' + (daily[k3] ? 'on' : '') + '"></i>';
      }
      dotsEl.innerHTML = dotsHtml;
    }
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

  /* ---------------- 入口绑定：页脚关于（顶栏 logo 入口已随顶栏退役） ---------------- */
  function bindEntry() {
    var about = $('#btnAbout');
    if (about) about.addEventListener('click', function () { open(true); });
    /* v19：页脚帮助——复用 UI.Confirm 对话框（标题 + 正文 + 知道了/关闭），不新增
       HUD 入口与对话框组件；考试全屏时页脚隐藏，故本帮助服务考前与练习间隙，
       考中帮助标签仍待后续轮次。 */
    var help = $('#btnHelp');
    if (help) help.addEventListener('click', function () {
      UI.Confirm({ title: '考试帮助', text: '阅读：60 分钟，题号共 40 个，已答蓝底白字，当前蓝圈，待检查警告色；没答满就交卷会先请你确认，时间到自动交卷。听力：30 分钟，点播放即开考，题号共 10 个，没答满交卷先请你确认。写作：Task 1 计 20 分钟，Task 2 计 40 分钟，字数实时统计，草稿只存本机。作答开始后试题占满屏，点退出回到开始前的页面，答案还在，不会交卷。', ok: '知道了', cancel: '关闭', danger: false });
    });
  }

  function renderAll() {
    /* ui-iter v5：每次渲染先从 localStorage 重读（跨标签页同步），
       否则本标签页内存快照是旧的，面板数字永远不刷新。 */
    if (window.Store && window.Store.syncFromStorage) {
      try { window.Store.syncFromStorage(); } catch (e) {}
    }
    renderStats();
    renderDashboard();
    renderTrend();
    renderFont();
  }

  function init() {
    /* v11：实时刷新改按“本页可见”门控（原抽屉 opened 门控的整页版）。
       只在 is-active 时重算，避免后台无谓渲染。 */
    window.addEventListener('ielts:store', function () {
      if (isVisible()) renderAll();
    });
    /* 跨标签页同步：另一标签页写 localStorage 时，本页收不到同文档的
       ielts:store 事件，只会收到 storage 事件；renderAll 已先
       syncFromStorage，所以这里直接重渲染即可。 */
    window.addEventListener('storage', function (e) {
      if (!isVisible()) return;
      if (e && e.key && e.key !== 'ielts.cbt.v1') return;
      renderAll();
    });
    document.addEventListener('visibilitychange', function () {
      if (isVisible() && !document.hidden) renderAll();
    });
    bindEntry();
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
