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

  /* v11：同步底部 tabbar 的 is-active（顶栏已取消，底栏为唯一导航） */
  function syncActiveView(v) {
    $$('#tabbar .tabbar-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.view === v);
    });
  }

  /* v15 0.1：模块中文名（起始页「继续练习」用） */
  var VIEW_NAMES = { learn: '学习区', comments: '学习笔记', reading: '阅读', listening: '听力', writing: '写作', vocab: '单词', essays: '范文' };
  /* v17 0.6：模块入口即独立页面——每个模块一个 hash 路由（#reading 等），
     首页为 #home；范文详情 #essay/<id> 由 essays.js 自行管理，不进本表。
     pushState 不触发 hashchange，模块切换不会惊动范文子路由。 */
  var VIEW_HASHES = { home: '#home', learn: '#learn', comments: '#comments', me: '#me', reading: '#reading', listening: '#listening', writing: '#writing', vocab: '#vocab', essays: '#essays' };
  var MODULE_VIEWS = { home: 1, learn: 1, comments: 1, me: 1, reading: 1, listening: 1, writing: 1, vocab: 1, essays: 1 };

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
    /* Phase 3：草稿存为对象 {text, updatedAt}，按非空文本判断；
       旧的字符串判断对对象草稿永不命中，致使「继续写作」无法触发。 */
    var draftKey = Object.keys(drafts).filter(function (k) {
      var d = drafts[k];
      return d && typeof d === 'object' && typeof d.text === 'string' && d.text.trim();
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
      /* v27：只切 is-new，不再强制基类（卡片基类已改为 ln-chip） */
      n.classList.toggle('is-new', !!isNew);
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

    /* 范文：收录数在卡片副标题里已有，状态位按评审给收藏数 */
    var eAll = (window.IELTS_ESSAYS || []).length;
    var eFav = (Store.get('essayFavs', []) || []).length;
    chip('lcEssays', eFav ? ('已收藏 ' + eFav + ' 篇') : '暂无收藏', !eFav);
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

    /* ---------- Phase 3（v37）：首页 A–F 数据层（只读 Store；唯一写操作是目标步进，见启动绑定） ---------- */
    /* 通用：本地日期键（与 vdaily 键格式一致） */
    var pp = function (n) { return (n < 10 ? '0' : '') + n; };
    var dateKeyOf = function (ts) {
      var d = new Date(ts);
      return d.getFullYear() + '-' + pp(d.getMonth() + 1) + '-' + pp(d.getDate());
    };
    var todayKey = dateKeyOf(Date.now());
    var daily = Store.get('vdaily', {}) || {};

    /* 活动日期集合（交卷 at / 非空草稿 updatedAt / 有背词的 vdaily 键），供本周天数与最近动态用 */
    var actDays = {};
    var markDay = function (ts) { if (ts) actDays[dateKeyOf(ts)] = true; };
    Object.keys(lsub).forEach(function (k) { var r = lsub[k]; if (r) markDay(r.at); });
    hist.forEach(function (h) { if (h) markDay(h.at); });
    Object.keys(drafts).forEach(function (k) {
      var d = drafts[k];
      var txt = typeof d === 'string' ? d : (d && typeof d.text === 'string' ? d.text : '');
      if (txt.trim() && d && d.updatedAt) markDay(d.updatedAt);
    });
    Object.keys(daily).forEach(function (k) {
      if (daily[k] && ((daily[k].new || 0) + (daily[k].review || 0) > 0)) actDays[k] = true;
    });

    /* C · 今日目标：交卷每套计 1；当日有非空草稿计 1；当日背词（new+review>0）计 1 */
    var target = Store.get('dailyGoalTarget', 2);
    target = (typeof target === 'number' && isFinite(target)) ? Math.max(1, Math.min(10, Math.round(target))) : 2;
    var subToday = 0;
    hist.forEach(function (h) { if (h && dateKeyOf(h.at) === todayKey) subToday++; });
    Object.keys(lsub).forEach(function (k) { var r = lsub[k]; if (r && dateKeyOf(r.at) === todayKey) subToday++; });
    var draftToday = 0;
    Object.keys(drafts).forEach(function (k) {
      var d = drafts[k];
      var txt = typeof d === 'string' ? d : (d && typeof d.text === 'string' ? d.text : '');
      if (txt.trim() && d && d.updatedAt && dateKeyOf(d.updatedAt) === todayKey) draftToday = 1;
    });
    var td0 = daily[todayKey] || { new: 0, review: 0 };
    var vocabToday = ((td0.new || 0) + (td0.review || 0) > 0) ? 1 : 0;
    var done = subToday + draftToday + vocabToday;
    var firstUse = (hist.length === 0) && (Object.keys(lsub).length === 0) && (dN === 0) && (hN === 0) && (Object.keys(daily).length === 0);
    set('hmGoalTarget', String(target));
    var goalRing = document.getElementById('hmGoalRingFill');
    if (goalRing) {
      var circ = 402.1; /* 2π×64，与旧圆环同模 */
      goalRing.style.strokeDasharray = String(circ);
      var pct = target ? Math.min(100, Math.round(done / target * 100)) : 0;
      var setGoalRing = function () { goalRing.style.strokeDashoffset = String(circ * (1 - pct / 100)); };
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) setGoalRing();
      else requestAnimationFrame(function () { requestAnimationFrame(setGoalRing); });
    }
    set('hmGoalNum', done + '/' + target);
    set('hmGoalText', firstUse
      ? '今天还没有学习记录，交一次卷、存一篇草稿或背几个词都算完成 1 项。'
      : (done >= target ? '今日目标已完成，明天继续。' : ('今日已完成 ' + done + ' / ' + target + ' 项。')));

    /* D · 本周概览：周一起算；掌握条口径 v38 已统一（right>=2 且不在错词本，与学习区/我的/词库一致） */
    var dow = (new Date().getDay() + 6) % 7; /* 周一起算：周一=0 */
    var ws = new Date(); ws.setDate(ws.getDate() - dow);
    var weekStartKey = dateKeyOf(ws.getTime());
    var weekDays = 0;
    Object.keys(actDays).forEach(function (k) { if (k >= weekStartKey && k <= todayKey) weekDays++; });
    set('hmWeekDays', String(weekDays));
    /* 连续天数：vdaily 往前推（口径不变） */
    var streak = 0, dd = new Date();
    for (;;) {
      var k2 = dateKeyOf(dd.getTime());
      if (!daily[k2]) break;
      streak++;
      dd.setDate(dd.getDate() - 1);
    }
    set('hmStreak', String(streak));
    set('hmDue', String(due));
    var masteredMe = deck.filter(function (d) { return d && d.right >= 2 && !d.inWrong; }).length;
    set('hmMasteryText', deck.length ? ('掌握 ' + masteredMe + ' / 共 ' + deck.length) : '词库为空');
    var mFill = document.getElementById('hmMasteryFill');
    if (mFill) mFill.style.width = deck.length ? (Math.round(masteredMe / deck.length * 100) + '%') : '0%';

    /* B · 最近一次（hero 行）：三源最新者（背词只有日期，显示 MM-DD） */
    var latest = null; /* {t, text} */
    var consider = function (t, text) { if (t && (!latest || t > latest.t)) latest = { t: t, text: text }; };
    hist.forEach(function (h) { if (h && h.at) consider(h.at, '阅读交卷 · ' + fmtDT(h.at)); });
    Object.keys(lsub).forEach(function (k) { var r = lsub[k]; if (r && r.at) consider(r.at, '听力交卷 · ' + fmtDT(r.at)); });
    Object.keys(drafts).forEach(function (k) {
      var d = drafts[k];
      var txt = typeof d === 'string' ? d : (d && typeof d.text === 'string' ? d.text : '');
      if (txt.trim() && d && d.updatedAt) consider(d.updatedAt, '写作草稿 · ' + fmtDT(d.updatedAt));
    });
    Object.keys(daily).forEach(function (k) {
      if (daily[k] && ((daily[k].new || 0) + (daily[k].review || 0) > 0)) {
        consider(new Date(k + 'T00:00:00').getTime(), '背词 · ' + k.slice(5));
      }
    });
    set('hmLatestLine', latest ? ('最近一次：' + latest.text) : '最近一次：还没有学习记录');

    /* E · 模块卡（复用本函数已算的 hist/lN/dN/hN/deck/due/mastered/eFav/eAll；mastered 取学习区口径） */
    var hasR = false, hasL = false;
    var rans = Store.get('ranswers', {}) || {};
    Object.keys(rans).forEach(function (k) { var v = rans[k]; if (v && typeof v === 'object' && Object.keys(v).length > 0) hasR = true; });
    var lans = Store.get('lanswers', {}) || {};
    Object.keys(lans).forEach(function (k) { var v = lans[k]; if (v && typeof v === 'object' && Object.keys(v).length > 0) hasL = true; });
    set('hmModReading', hist.length ? ('已交 ' + hist.length + '/4 套') : (hasR ? '进行中' : '已交 0/4 套'));
    set('hmModReadingNext', hist.length >= 4 ? '四套都交了，专攻错得多的题型'
      : (hist.length ? ('再交第 ' + (hist.length + 1) + ' 套') : (hasR ? '继续答题，答完交卷' : '做 Test 1，限时 60 分钟')));
    set('hmModListening', lN ? ('已交 ' + lN + '/1 套') : (hasL ? '进行中' : '已交 0/1 套'));
    set('hmModListeningNext', lN ? '重听没听清的句子' : (hasL ? '继续填空，填完交卷' : '听 Section 1，10 道填空'));
    set('hmModWriting', dN ? ('草稿 ' + dN + ' 篇' + (hN ? ' · 历史 ' + hN + ' 条' : ''))
      : (hN ? ('历史 ' + hN + ' 条') : '未开始'));
    set('hmModWritingNext', dN ? '接着写草稿' : (hN ? '再写一篇 Task 2' : '写 Task 2，先列三段提纲'));
    set('hmModVocab', deck.length ? ('掌握 ' + mastered + ' / 共 ' + deck.length + ' · 待复习 ' + due) : '未开始');
    set('hmModVocabNext', deck.length ? (due ? ('复习 ' + due + ' 个到期词') : '新学 10 个') : '载入示例词表，先背 10 个');
    set('hmModEssays', '收藏 ' + eFav + ' / ' + eAll + ' 篇');
    set('hmModEssaysNext', eFav ? ('从收藏的 ' + eFav + ' 篇里挑一篇跟读') : '读一篇 Task 2，跟读三遍');

    /* F · 最近练习（交卷 + 写作存档 + 背词日，按时间倒序 ≤5 条）与分数走势（仅 rhist；vtrend 为单词轮次非分数，不混入） */
    var feed = [];
    hist.forEach(function (h) {
      if (h && h.at) feed.push({ t: h.at, text: '阅读 · ' + (typeof h.band === 'number' ? ('Band ' + h.band.toFixed(1)) : '已交卷') + ' · ' + fmtDT(h.at) });
    });
    Object.keys(lsub).forEach(function (k) {
      var r = lsub[k];
      if (r && r.at) feed.push({ t: r.at, text: '听力 · ' + (typeof r.band === 'number' ? ('Band ' + r.band.toFixed(1)) : '已交卷') + ' · ' + fmtDT(r.at) });
    });
    (Store.get('history', []) || []).forEach(function (w) {
      if (w && w.createdAt) feed.push({ t: w.createdAt, text: '写作 · ' + (w.words || 0) + ' 词 · ' + fmtDT(w.createdAt) });
    });
    Object.keys(daily).forEach(function (k) {
      var dv = daily[k] || {};
      if ((dv.new || 0) + (dv.review || 0) > 0) feed.push({ t: new Date(k + 'T00:00:00').getTime(), text: '单词 · 新学 ' + (dv.new || 0) + ' · 复习 ' + (dv.review || 0) + ' · ' + k.slice(5) });
    });
    feed.sort(function (a, b) { return b.t - a.t; });
    var rl = document.getElementById('hmRecentList');
    if (rl) {
      rl.innerHTML = feed.length ? feed.slice(0, 5).map(function (f) { return '<li>' + f.text + '</li>'; }).join('')
        : '<li>还没有学习记录，交一次卷、存一篇草稿或背几个词，这里就会出现。</li>';
    }
    var trend = hist.slice(0, 4).reverse().map(function (h) { return (typeof h.band === 'number') ? h.band.toFixed(1) : null; }).filter(function (b) { return b !== null; });
    set('hmTrendLine', trend.length >= 2 ? ('阅读 Band 走势：' + trend.join(' → '))
      : (trend.length === 1 ? ('阅读最新 Band ' + trend[0]) : '还没有交卷记录，交一套阅读就能在这里看到分数走势'));

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
    document.body.setAttribute('data-view', target);
    /* v11：视图切换即考试壳状态切换——摘掉作答全屏、清空退出抑制，
       再按各模块 wantsFullscreen() 派生（进行中的卷子切回来恢复全屏）。 */
    if (window.ExamShell && ExamShell.noteViewChange) ExamShell.noteViewChange();
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
    /* v36：同理重算继续按钮——此前回首页只刷五卡不刷 CTA，写作存草稿后直接回首页仍显示旧按钮，需重载或再离首页一次才翻转（v35 实机验证 19:16 发现；与 v30 学习区同款刷新遗漏）。 */
    if (target === 'home') { refreshHomeStats(); refreshHomeContinue(); }
    /* v30：学习区与首页共用 refreshHomeStats 渲染（ln 卡片行）——此前只在
       启动与回首页时刷新，直切学习区（页签直达/hash/前进后退）会显示旧状态；
       切到学习区也重算一次，数据变化即时反映。 */
    if (target === 'learn') refreshHomeStats();

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

  /* v11：顶栏已取消，故顶栏「复习」「我的」入口随顶栏一并移除，不再绑定。
     · 复习功能未删：同一流程由「我的」整页的「复习队列 / 错词本」
      （Vocab.startReview / startWrong）承接；
     · 「我的」入口由底栏 data-view="me" 承接（见 boot 的 tabbar 绑定）。 */

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

    /* v11：底栏为唯一导航（顶栏已取消；「我的」现为 data-view="me" 整页，
       不再走 data-me-open 抽屉入口）。注：旧 bindSeg($('#navSeg')…) 在此
       必须删掉——navSeg 已不存在，bindSeg(null) 会误绑全站 .seg-btn。 */
    $$('#tabbar .tabbar-btn').forEach(function (b) {
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
    /* v23：首页快捷入口 + 热门推荐卡（.hm-go + data-view，直连既有路由） */
    $$('.hm-go').forEach(function (b) {
      b.addEventListener('click', function () { switchView(b.dataset.view); });
    });
    /* v23：进度卡「继续学习」与主按钮同口径（pickContinue，不新增逻辑） */
    var homeProgressGo = $('#homeProgressGo');
    if (homeProgressGo) homeProgressGo.addEventListener('click', function () {
      var pick = pickContinue();
      switchView(pick.view || 'reading');
    });
    var hmSearchBtn = document.getElementById('hmSearchBtn');
    if (hmSearchBtn) hmSearchBtn.addEventListener('click', function () {
      switchView('essays');
      setTimeout(function () {
        var s = document.getElementById('esSearch');
        if (s) s.focus();
      }, 50);
    });
    /* Phase 3（v37）：今日目标步进（新键 dailyGoalTarget，只增不迁移，老数据默认 2；1–10 夹紧） */
    var goalAdj = function (d) {
      var cur = Store.get('dailyGoalTarget', 2);
      cur = (typeof cur === 'number' && isFinite(cur)) ? Math.max(1, Math.min(10, Math.round(cur))) : 2;
      Store.set('dailyGoalTarget', Math.max(1, Math.min(10, cur + d)));
      refreshHomeStats();
    };
    var gMinus = document.getElementById('hmGoalMinus');
    if (gMinus) gMinus.addEventListener('click', function () { goalAdj(-1); });
    var gPlus = document.getElementById('hmGoalPlus');
    if (gPlus) gPlus.addEventListener('click', function () { goalAdj(1); });
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
