/* ============================================================
 *  应用入口 · 视图切换 / 主题 / 图标装饰 / iOS 适配
 *  ---------------------------------------------------------------
 *  本次修改点：
 *    1) 新增 Theme.init('#btnTheme')，深色模式默认跟随系统、可手动覆盖并持久化
 *    2) 新增 decorateIcons()：给带 data-icon 的按钮注入线性描边图标，原有文案
 *       包进 <span class="lbl">，这样动态改文案（开始/暂停/继续）不会丢图标
 *    3) 视图由 3 个扩为 5 个（reading / writing / vocab / essays / essay-detail），
 *       切换后重新校准各分段控件滑块位置；同时把底部 Tabbar 的 is-active 同步到
 *       顶部 nav（移动端通过底部 Tabbar 切换，桌面端通过顶部 nav 切换）
 *    4) 新增字号缩放 #btnFont：4 档（小/标准/大/特大），写到 <html class="fs-*">，
 *       通过 Store 键 'fontScale' 持久化
 *    5) 新增 Essays.init() 启动 4 视图（范文列表 + 详情），
 *       并在切换到 essays 时调 Essays.show() 让 hash 路由生效
 *  本次修改点（综合修订）：
 *    6) BUG-5 字号切换改为显式的单调递增序列「较小 → 标准 → 较大 → 特大 → 较小」，
 *       档位定义与文案各自独立成表，不再靠 (cur+1)%4 隐式推导；
 *       同时把 --fs-scale 接到正文（.article / #editor / .qitem-text），
 *       四档之间才有肉眼可见的差异。
 *    7) BUG-7 顶栏新增「清空所有本地数据」按钮 #btnWipe，二次确认后清空
 *       localStorage 唯一键 ielts.cbt.v1 并刷新页面。
 *    8) 视觉 1：阅读视图激活时给 <body> 打 data-view="reading"，
 *       顶栏的考试 HUD（计时器 + 交卷）随之显示/隐藏。
 *  影响范围：全站启动流程；各业务模块的 init() 调用顺序。
 *  本次修改点（v16）：
 *    9) 数据管理弹层 dp-layer 与关于弹层 about-layer 移除，入口统一并入「我的」
 *       抽屉（me.js）；导出 / 导入 / 清空 / 复制分享链接经 window.App 暴露，逻辑不变
 *   10) 顶栏移除字号 #btnFont 与三个数据按钮，字号旧位新增「复习」#btnReviewTop
 *       （Vocab.startReview：今日待复习优先，其次错词本，都空则提示）
 * 本次修改点（v18）：
 *   11) 0.1 顶栏瘦身：三操作改为「复习 / 主题 / 我的」——清空按钮 #btnWipe 移除
 *       （数据管理已在「我的」抽屉），玻璃滑杆移入「我的」·设置，顶栏新增
 *       #btnMeTop（Me.open）；考试页（阅读/听力）顶栏只剩题号胶囊 + 计时 + 交卷
 *       （CSS 见 liquid-glass.css 第 33 节）
 *   12) 0.2 首页真仪表盘：splash 已移除（打开即首页）；「开始练习」第二按钮撤掉，
 *       只留「继续练习」单主按钮；新增 refreshHomeStats() 刷五张模块卡进度行
 *       （口径同 me.js renderStats），切回首页即刷新，并经 App.refreshHomeStats 暴露
 * ============================================================ */
(function () {
  'use strict';

  /* 给按钮注入线性图标；纯文本按钮把文案包进 .lbl，含子元素的按钮只前置图标 */
  function decorateIcons() {
    $$('[data-icon]').forEach(function (btn) {
      if (btn.querySelector('.icon')) return;
      var name = btn.getAttribute('data-icon');
      var plain = btn.children.length === 0;
      var text = btn.textContent.trim();
      if (plain) {
        btn.textContent = '';
        var lbl = document.createElement('span');
        lbl.className = 'lbl';
        lbl.textContent = text;
        btn.insertAdjacentHTML('afterbegin', Icons.get(name, 16));
        btn.appendChild(lbl);
      } else {
        btn.insertAdjacentHTML('afterbegin', Icons.get(name, 16));
      }
    });
  }

  /* 同步顶部 nav 与底部 tabbar 的 is-active */
  function syncActiveView(v) {
    $$('#navSeg .seg-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.view === v);
    });
    $$('#tabbar .tabbar-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.view === v);
    });
  }

  /* v15 0.1：模块中文名（起始页「继续练习」用） */
  var VIEW_NAMES = { learn: '学习区', comments: '留言区', reading: '阅读', listening: '听力', writing: '写作', vocab: '单词', essays: '范文' };
  /* v17 0.6：模块入口即独立页面——每个模块一个 hash 路由（#reading 等），
     首页为 #home；范文详情 #essay/<id> 由 essays.js 自行管理，不进本表。
     pushState 不触发 hashchange，模块切换不会惊动范文子路由。 */
  var VIEW_HASHES = { home: '#home', learn: '#learn', comments: '#comments', reading: '#reading', listening: '#listening', writing: '#writing', vocab: '#vocab', essays: '#essays' };
  var MODULE_VIEWS = { home: 1, learn: 1, comments: 1, reading: 1, listening: 1, writing: 1, vocab: 1, essays: 1 };

  /* super P0：续练口径改为「最近交卷 > 未完成进度 > 通用」，不再跟访问记录。
     返回 { view, reason } —— reason 决定提示文案，避免用户以为在续上次浏览的页面。 */
  function pickContinue() {
    var rsub = Store.get('rsubmitted', {}) || {};
    var lsub = Store.get('lsubmitted', {}) || {};
    var subAt = 0, subView = '';
    Object.keys(rsub).forEach(function (k) {
      var r = rsub[k];
      if (r && r.at > subAt) { subAt = r.at; subView = 'reading'; }
    });
    Object.keys(lsub).forEach(function (k) {
      var r = lsub[k];
      if (r && r.at > subAt) { subAt = r.at; subView = 'listening'; }
    });
    if (subView) return { view: subView, reason: '上次交卷在「' + VIEW_NAMES[subView] + '」' };

    /* 没有交卷：看有没有真的做了一半的进度 */
    var drafts = Store.get('drafts', {}) || {};
    var draftKey = Object.keys(drafts).filter(function (k) {
      var d = drafts[k];
      return d && typeof d === 'string' && d.trim();
    })[0];
    if (draftKey) return { view: 'writing', reason: '写作草稿还没写完' };

    var rans = Store.get('ranswers', {}) || {};
    var hasR = Object.keys(rans).some(function (k) {
      var v = rans[k];
      return v && typeof v === 'object' && Object.keys(v).length > 0;
    });
    if (hasR) return { view: 'reading', reason: '阅读已答了一部分，还没交卷' };

    var lans = Store.get('lanswers', {}) || {};
    var hasL = Object.keys(lans).some(function (k) {
      var v = lans[k];
      return v && typeof v === 'object' && Object.keys(v).length > 0;
    });
    if (hasL) return { view: 'listening', reason: '听力已答了一部分，还没交卷' };

    return { view: '', reason: '' };
  }

  /* v7：300ms 数字滚动（圆环百分比 + 首页整数统计共用；减动效偏好时直接写终值） */
  function countUpNum(id, target, suffix) {
    var n = document.getElementById(id);
    if (!n) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { n.textContent = String(target) + (suffix || ''); return; }
    var t0 = null;
    var step = function (t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / 300);
      n.textContent = String(Math.round(target * p)) + (suffix || '');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function refreshHomeContinue() {
    var btn = $('#homeContinue');
    if (!btn) return;
    var pick = pickContinue();
    var lbl = btn.querySelector('.lbl');
    if (lbl) lbl.textContent = pick.view ? ('继续「' + VIEW_NAMES[pick.view] + '」') : '开始练习';
    var hint = $('#homeContinueHint');
    if (hint) hint.textContent = pick.reason || '从任意模块开始，进度会自动保存';
    btn.setAttribute('data-go', pick.view || 'reading');
  }

  /* v18 0.2：首页五张模块卡的实时进度行。口径与「我的」抽屉 renderStats() 一致：
     阅读 = 最新一次交卷 Band（rhist[0].band）；听力 = 最近交卷时间（lsubmitted 里 at 最大）；
     写作 = 草稿数 + 历史条数；单词 = 词库数 + 今日待复习；范文 = 收录数 + 收藏数。
     全部只读 Store，不写任何数据。 */
  function refreshHomeStats() {
    var set = function (id, txt) { var n = $('#' + id); if (n) n.textContent = txt; };
    var hist = Store.get('rhist', []); hist = Array.isArray(hist) ? hist : [];
    var deck = Store.get('deck', []); deck = Array.isArray(deck) ? deck : [];
    var now = Date.now();
    var due = deck.filter(function (d) { return d.m && d.due && d.due <= now; }).length;

    /* 学习区每行：右侧只放一个状态 chip（只有真实中间进度才配细条），
       左块第二行是「下一步」整句——不截断，手机上也不隐藏。 */
    var chip = function (id, txt, isNew) {
      var n = $('#' + id);
      if (!n) return;
      n.textContent = txt;
      n.className = 'lr-chip' + (isNew ? ' is-new' : '');
    };
    var nextLine = function (id, txt) {
      var n = $('#' + id);
      if (n) n.textContent = '下一步：' + txt;
    };
    var meter = function (id, pct, label) {
      var w = $('#' + id);
      if (!w) return;
      var p = Math.max(0, Math.min(100, pct));
      var show = p > 0 && p < 100;      /* 0% 不摆空轨道；100% 也不用再画 */
      w.hidden = !show;
      if (!show) return;
      var i = w.querySelector('i'), em = w.querySelector('em');
      if (i) i.style.setProperty('--pct', Math.max(4, Math.round(p)) + '%');
      if (em) em.textContent = label || (Math.round(p) + '%');
    };

    /* 阅读：最新 Band；交卷套数只在 0<x<4 时以 x/4 呈现 */
    if (hist.length && typeof hist[0].band === 'number') {
      chip('lcReading', 'Band ' + hist[0].band.toFixed(1));
      nextLine('lnReading', hist.length >= 4
        ? '四套都交了，挑一套重做，专攻错得多的题型'
        : '重做上次错的题，再交第 ' + (hist.length + 1) + ' 套');
      meter('lmReading', (hist.length / 4) * 100, hist.length + '/4 套');
    } else {
      chip('lcReading', '未开始', true);
      nextLine('lnReading', '做 Test 1，限时 60 分钟');
      meter('lmReading', 0);
    }

    /* 听力：最近交卷时间（lsubmitted 以题源 id 为键） */
    var lsub = Store.get('lsubmitted', {}) || {};
    var lN = Object.keys(lsub).length;
    if (lN) {
      chip('lcListening', '已交 ' + lN + ' 次');
      nextLine('lnListening', '重听没听清的句子，再把答案对一遍');
    } else {
      chip('lcListening', '未开始', true);
      nextLine('lnListening', '听 Section 1，10 道填空');
    }
    meter('lmListening', 0);

    /* 写作：草稿优先，其次历史 */
    var drafts = Store.get('drafts', {}) || {};
    var maxDraft = 0, dN = 0;
    Object.keys(drafts).forEach(function (k) {
      var d = drafts[k];
      /* 真实结构是 { text, updatedAt }；旧版按字符串判断会永远读不到草稿 */
      var txt = typeof d === 'string' ? d : (d && typeof d.text === 'string' ? d.text : '');
      if (txt.trim()) {
        dN++;
        if (txt.trim().length > maxDraft) maxDraft = txt.trim().length;
      }
    });
    var hN = (Store.get('history', []) || []).length;
    var wPct = Math.min(100, (maxDraft / 250) * 100);
    if (dN) {
      chip('lcWriting', '草稿 ' + dN + ' 篇');
      nextLine('lnWriting', maxDraft < 250
        ? ('接着写，这篇还差 ' + (250 - maxDraft) + ' 字')
        : '通读一遍，检查 Task 2 的两处论证');
      meter('lmWriting', wPct, Math.round(wPct) + '%');
    } else if (hN) {
      chip('lcWriting', '写完 ' + hN + ' 篇');
      nextLine('lnWriting', '再写一篇 Task 2，换个题目类型');
      meter('lmWriting', 0);
    } else {
      chip('lcWriting', '未开始', true);
      nextLine('lnWriting', '写 Task 2，先列三段提纲');
      meter('lmWriting', 0);
    }

    /* 单词：词库数 + 今日到期 */
    var mastered = deck.filter(function (d) { return d && d.right >= 2 && !d.inWrong; }).length;
    if (deck.length) {
      chip('lcVocab', deck.length + ' 词');
      nextLine('lnVocab', due ? ('复习 ' + due + ' 个到期词，再新学 10 个')
                             : '今天没有到期词，新学 10 个');
      meter('lmVocab', (mastered / deck.length) * 100, mastered + '/' + deck.length + ' 熟了');
    } else {
      chip('lcVocab', '未开始', true);
      nextLine('lnVocab', '载入示例词表，先背 10 个');
      meter('lmVocab', 0);
    }

    /* 范文：收录数固定，收藏数进下一步 */
    var eAll = (window.IELTS_ESSAYS || []).length;
    var eFav = (Store.get('essayFavs', []) || []).length;
    chip('lcEssays', eAll + ' 篇');
    nextLine('lnEssays', eFav ? ('从收藏的 ' + eFav + ' 篇里挑一篇跟读')
                              : '读一篇 Task 2，跟读三遍');

    /* 页头：只有练过才出现一句累计；没练过就整块不显示 */
    var lm = document.getElementById('learnMeta');
    if (lm) {
      var totalSub = hist.length + lN;
      if (totalSub || deck.length) {
        lm.hidden = false;
        lm.textContent = '累计交卷 ' + totalSub + ' 次 · 词库 ' + deck.length + ' 词';
      } else {
        lm.hidden = true;
        lm.textContent = '';
      }
    }

    /* ---------- v18 0.2：今日概览条 ---------- */
    countUpNum('ovDue', due);
    set('ovDueHint', deck.length ? ('词库 ' + deck.length + ' 词') : '词库为空');

    var rAt = (hist.length && hist[0].at) ? hist[0].at : 0;
    var rBand = (hist.length && typeof hist[0].band === 'number') ? hist[0].band : null;
    var lb = null, lbAt = 0;
    Object.keys(lsub).forEach(function (k) {
      var r = lsub[k];
      if (r && r.at > lbAt) { lbAt = r.at; lb = (typeof r.band === 'number') ? r.band : null; }
    });
    var band = rBand, bandFrom = '阅读';
    if (lb != null && lbAt >= rAt) { band = lb; bandFrom = '听力'; }
    set('ovBand', band != null ? band.toFixed(1) : '—');
    set('ovBandHint', band != null ? (bandFrom + ' · 最近一次') : '尚无交卷');

    /* 连续学习天数：从今天往前推 vdaily */
    var daily = Store.get('vdaily', {}) || {};
    var streak = 0, dd = new Date();
    var pp = function (n) { return (n < 10 ? '0' : '') + n; };
    for (;;) {
      var k2 = dd.getFullYear() + '-' + pp(dd.getMonth() + 1) + '-' + pp(dd.getDate());
      if (!daily[k2]) break;
      streak++;
      dd.setDate(dd.getDate() - 1);
    }
    countUpNum('ovStreak', streak);
    set('ovStreakHint', streak ? '保持住' : '今天还没开始');

    /* ---------- v7：首页圆环 + 打卡点 + 下一步细分条（只读 Store，不写数据） ---------- */
    /* 掌握口径与「我的」面板 renderStats 一致（right>=2 且 wrong===0），
       与学习区单词行用的 !inWrong 口径不同——圆环取面板口径，特此说明。 */
    var masteredMe = deck.filter(function (d) { return d && d.right >= 2 && d.wrong === 0; }).length;
    var ringPct = deck.length ? Math.round(masteredMe / deck.length * 100) : 0;
    var ringEl = document.getElementById('homeRingFill');
    if (ringEl) {
      var circ = 402.1; /* 2π×64 */
      ringEl.style.strokeDasharray = String(circ);
      /* CSS 里先给满偏移（0%）；下一帧再写目标值，transition 才能画出入场弧 */
      var setRing = function () { ringEl.style.strokeDashoffset = String(circ * (1 - ringPct / 100)); };
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) setRing();
      else requestAnimationFrame(function () { requestAnimationFrame(setRing); });
    }
    countUpNum('homeRingNum', ringPct, '%');
    set('homeRingToGo', !deck.length
      ? '词库还是空的，载入示例词表开始'
      : (masteredMe >= deck.length ? '词库已全部掌握' : ('还差 ' + (deck.length - masteredMe) + ' 词掌握')));

    /* 近 7 天打卡点：左旧右新（今天在最右），只读 vdaily 键 */
    var dotsEl = document.getElementById('homeStreakDots');
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

    /* 下一步细分条：只有真实分母时才出现（阅读=交卷套数/4，写作=草稿字数/250；
       听力与未开始没有分母，不画装饰条） */
    var pick2 = pickContinue();
    var bar2 = document.getElementById('homeNextBar');
    if (bar2) {
      var showBar = false, barPct = 0, barLabel = '';
      if (pick2.view === 'reading' && hist.length > 0 && hist.length < 4) {
        showBar = true; barPct = Math.round(hist.length / 4 * 100); barLabel = hist.length + '/4 套';
      } else if (pick2.view === 'writing' && dN > 0 && maxDraft < 250) {
        showBar = true; barPct = Math.round(wPct); barLabel = Math.round(wPct) + '%';
      }
      bar2.hidden = !showBar;
      if (showBar) {
        var fill2 = document.getElementById('homeNextFill');
        if (fill2) fill2.style.width = Math.max(4, barPct) + '%';
        set('homeNextBarLabel', barLabel);
      }
    }

  }
  /* 时间格式：MM-DD HH:mm（首页进度行用） */
  function fmtDT(t) {
    var d = new Date(t);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function switchView(v, opts) {
    opts = opts || {};
    // 范文详情其实是 essays 视图下的子状态 —— 用 view-essay-detail 容器
    var target = v === 'essay-detail' ? 'essay-detail' : v;
    $$('.view').forEach(function (sec) {
      sec.classList.toggle('is-active', sec.id === 'view-' + target);
    });
    syncActiveView(v === 'essay-detail' ? 'essays' : v);
    /* 顶栏考试 HUD（计时器 + 交卷）只在阅读视图出现 */
    document.body.setAttribute('data-view', target);
    /* v17 0.6：同步地址栏 hash（pushState 不派发 hashchange）。
       essay-detail 的 hash 由 essays.js 管理，这里跳过；
       opts.silent 用于 popstate/启动等「URL 已是目标态」的场景，避免补推历史。 */
    try {
      var vh = VIEW_HASHES[target];
      if (vh && !opts.silent && window.history && history.pushState && location.hash !== vh) {
        history.pushState({ view: target }, '', vh);
      }
    } catch (e) { /* file:// 等不支持 history 的环境忽略 */ }
    /* v15 0.1：记住上次练习模块（新键 lastView，只写不迁移，老数据零改动） */
    if (target !== 'home') {
      Store.set('lastView', target === 'essay-detail' ? 'essays' : target);
      refreshHomeContinue();
    }
    /* v18 0.2：每次回到首页都重算五卡进度（交卷/导入/收藏等变更即时反映） */
    if (target === 'home') refreshHomeStats();

    // 视图显示后再校准分段控件滑块（隐藏时量不到宽度）
    requestAnimationFrame(function () {
      if (v === 'writing') syncSegThumb($('#taskSeg'), $('#taskThumb'));
      if (v === 'vocab') {
        /* v18 0.7：#modeSeg 已移入全屏练习页，这里只刷新数据 */
        if (window.Vocab && Vocab.refresh) Vocab.refresh();
      }
      if (v === 'reading') syncSegThumb($('#rPaneSeg'), $('#rPaneThumb'));
      /* B2-1：顶栏胶囊与阅读/听力共用同一个 #qnavPill，
         切视图时必须由当前模块重写，否则会留着上一个模块的「题 0 / 10」。 */
      if (v === 'reading' && window.Reading && Reading.refreshHud) Reading.refreshHud();
      if (v === 'listening' && window.Listening && Listening.refreshHud) Listening.refreshHud();
      if (v === 'essays' || v === 'essay-detail') {
        if (window.Essays && Essays.show) Essays.show();
      }
    });
    /* v17 0.6：模块即新页面——进入模块回到页顶（范文详情翻页不走本函数，不受影响） */
    try { window.scrollTo(0, 0); } catch (e) { /* 无头环境忽略 */ }
  }

  /* 字号缩放：4 档（0 较小 / 1 标准 / 2 较大 / 3 特大）。
   * v16 起入口移入「我的」抽屉（me.js 调 App.setFontLevel），顶栏 #btnFont 已移除；
   * 档位仍写 <html class="fs-*"> + Store 键 'fontScale'，机制与数据不变。 */
  var FONT_LEVELS = [0, 1, 2, 3];
  function applyFontLevel(n) {
    n = Math.max(0, Math.min(FONT_LEVELS.length - 1, n | 0));
    document.documentElement.classList.remove('fs-0', 'fs-1', 'fs-2', 'fs-3');
    document.documentElement.classList.add('fs-' + n);
    Store.set('fontScale', n);
  }

  /* 清空所有本地数据（二次确认；顶栏按钮与数据面板共用） */
  function clearAllData() {
    if (!window.UI || !UI.Confirm) return;
    UI.Confirm({
      title: '清空所有本地数据',
      text: '将删除全部写作草稿与历史、阅读作答与高亮、单词词库与学习记录，' +
            '并恢复默认主题与字号。确定要清空吗？此操作不可恢复。',
      ok: '全部清空'
    }, function (yes) {
      if (!yes) return;
      Store.clearAll();
      toast('已清空全部本地数据', 1600);
      setTimeout(function () { location.reload(); }, 700);
    });
  }

  function bindWipe() {
    var btn = $('#btnWipe');
    if (btn) btn.addEventListener('click', clearAllData);
  }

  /* ---------------- 数据管理（v16：入口移入「我的」抽屉，逻辑不变） ----------------
   * openDataPanel / refreshDataStat / bindDataPanel 随 dp-layer 一并移除；
   * 导出 / 导入 / 清空 / 复制分享链接经 window.App 暴露给 me.js 调用。 */

  function exportAllData() {
    var d = Store.all() || {};
    var dt = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    var name = 'ielts-backup-' + dt.getFullYear() + '-' + p(dt.getMonth() + 1) +
               '-' + p(dt.getDate()) + '.json';
    try {
      var blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 600);
      toast('已导出 ' + name);
    } catch (e) {
      toast('导出失败：浏览器不支持文件下载', 3000);
    }
  }

  function importData(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var obj;
      try { obj = JSON.parse(String(reader.result)); }
      catch (e) { toast('导入失败：文件不是合法的 JSON', 3000); return; }
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        toast('导入失败：数据格式不正确（应为对象）', 3000);
        return;
      }
      var keys = Object.keys(obj);
      if (!keys.length) { toast('导入失败：文件里没有数据', 3000); return; }
      UI.Confirm({
        title: '导入数据',
        text: '将用文件中的 ' + keys.length + ' 类数据覆盖当前全部数据，并刷新页面。' +
              '确定要导入吗？此操作不可恢复。',
        ok: '覆盖导入'
      }, function (yes) {
        if (!yes) return;
        Store.replaceAll(obj);
        toast('导入成功，正在刷新…', 1200);
        setTimeout(function () { location.reload(); }, 700);
      });
    };
    reader.onerror = function () { toast('读取文件失败，请重试', 3000); };
    reader.readAsText(file);
  }

  /* v16 0.3：顶栏「复习」→ 直接进入单词复习流程（智能选轮：今日待复习优先，其次错词本） */
  function bindReviewTop() {
    var btn = $('#btnReviewTop');
    if (!btn) return;
    btn.addEventListener('click', function () {
      switchView('vocab');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (window.Vocab && Vocab.startReview) Vocab.startReview();
        });
      });
    });
  }

  /* v18 0.1：顶栏「我的」入口 → 打开「我的」抽屉（与点 logo 同行为） */
  function bindMeTop() {
    var btn = $('#btnMeTop');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (window.Me && Me.open) Me.open(false);
    });
  }

  /* 离线发音缓存：Service Worker 只在 https / localhost 注册（file:// 无法启用） */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    var host = location.hostname;
    var okProto = location.protocol === 'https:' || host === 'localhost' || host === '127.0.0.1';
    if (!okProto) return;
    try {
      navigator.serviceWorker.register('sw.js?v=56')   /* v18：带版本号绕过 CDN 对 sw.js 的缓存，确保新壳立即生效 */.then(null, function () { /* 静默：不影响主流程 */ });
    } catch (e) { /* 静默 */ }
  }

  function boot() {
    /* v16：浏览器 reload / 前进后退会恢复上次滚动位，而顶栏是 sticky、其包含块
     * （body）高度受控——深滚后 reload 落到短视图（如横屏起始页）时顶栏会被
     * clamp 出视口，清空/复习/主题点不到。关闭滚动恢复 + 加载即回顶。 */
    try { if (history.scrollRestoration) history.scrollRestoration = 'manual'; } catch (e) {}
    window.scrollTo(0, 0);

    decorateIcons();
    Theme.init('#btnTheme');
    applyFontLevel(Store.get('fontScale', 1) | 0);

    /* 顶部 nav：桌面端使用 */
    bindSeg($('#navSeg'), $('#navThumb'), function (b) { switchView(b.dataset.view); });
    /* 底部 tabbar：移动端使用（与顶部 nav 互为镜像） */
    $$('#tabbar .tabbar-btn').forEach(function (b) {
      if (b.hasAttribute('data-me-open')) {
        b.addEventListener('click', function () {
          if (window.Me && Me.open) Me.open(false);
        });
        return;
      }
      b.addEventListener('click', function () { switchView(b.dataset.view); });
    });
    /* 首页「进入学习区」 */
    var goLearn = $('#homeGoLearn');
    if (goLearn) goLearn.addEventListener('click', function () { switchView('learn'); });

    Writing.init();
    Vocab.init();
    Reading.init();
    Listening.init();
    Essays.init();
    bindWipe();
    bindReviewTop();
    bindMeTop();
    registerSW();

    /* v13：独立的「提示音」开关（与「发音」开关分开；默认开，状态存 localStorage） */
    var chkChime = $('#chkChime');
    if (chkChime && window.Feedback) {
      chkChime.checked = window.Feedback.isEnabled();
      chkChime.addEventListener('change', function () {
        window.Feedback.setEnabled(chkChime.checked);
      });
    }

    /* v15 0.1：首页唯一主按钮 = 继续练习（接上次模块/进度；无记录时进阅读）。
       v18 0.2：原「开始练习」第二按钮撤掉，首页只保留一个主按钮。 */
    var homeContinue = $('#homeContinue');
    if (homeContinue) homeContinue.addEventListener('click', function () {
      /* super P0：按「最近交卷 > 未完成进度 > 通用」跳，跟访问记录无关 */
      var pick = pickContinue();
      switchView(pick.view || 'reading');
    });
    $$('.home-tile').forEach(function (t) {
      t.addEventListener('click', function () { switchView(t.dataset.view); });
    });
    refreshHomeContinue();

    // 首屏：v15 0.1 起默认落起始页；v17 0.6 起 hash 直达对应模块
    // （#essay/<id> 深链由 essays.js 的 hash 路由展开成详情）
    var h = (location.hash || '').replace(/^#\/?/, '');
    var initial = 'home';
    if (MODULE_VIEWS[h]) initial = h;
    else if (h.indexOf('essay/') === 0) initial = 'essays';
    /* 无 hash 时补一个 #home（replaceState，不占历史），保证「返回」能回到首页 */
    try {
      if (!location.hash && window.history && history.replaceState) {
        history.replaceState({ view: 'home' }, '', '#home');
      }
    } catch (e) { /* 忽略 */ }
    switchView(initial, { silent: true });
    requestAnimationFrame(function () { syncSegThumb($('#navSeg'), $('#navThumb')); });
    /* v18 0.2：首屏即首页仪表盘——刷新五卡进度行 */
    refreshHomeStats();

    /* v17 0.6：浏览器前进/后退 = 页面级导航，按 hash 落到对应模块 */
    window.addEventListener('popstate', function () {
      var hh = (location.hash || '').replace(/^#\/?/, '');
      if (hh.indexOf('essay/') === 0) {
        /* 范文详情显隐由 essays.js 的 hashchange 处理；这里只保证 data-view 正确，
           且不在已是范文模块时重切视图（避免把详情抢回列表） */
        var cur = document.body.getAttribute('data-view');
        if (cur !== 'essays' && cur !== 'essay-detail') switchView('essays', { silent: true });
        return;
      }
      if (MODULE_VIEWS[hh]) switchView(hh, { silent: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* v16：「我的」抽屉（me.js）与顶栏「复习」按钮的调用面。
   * app.js 本身仍是纯 IIFE，只额外暴露这几个只读/既有行为入口，
   * 不改变任何内部逻辑与数据流。 */
  window.App = {
    switchView: switchView,
    setFontLevel: applyFontLevel,
    getFontLevel: function () { return Store.get('fontScale', 1) | 0; },
    exportAllData: exportAllData,
    importFile: importData,
    clearAllData: clearAllData,
    refreshHomeStats: refreshHomeStats,
    copyLink: function () { copyText(location.href.split('#')[0]); }
  };
})();
