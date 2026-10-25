/* ============================================================
 *  Reading 模块 —— 雅思学术类阅读机考还原（综合修订版）
 *  ---------------------------------------------------------------
 *  本次修改点（对应「IELTS 机考模拟器 — 综合修改提示词」）：
 *    1) BUG-2   「重置」改为二次确认，确认后同时重置计时器 **并** 清空本套
 *               全部作答（填空 / 选项 / 题号高亮 / 已答计数）与高亮批注。
 *    2) BUG-4   文章主标题一律显示真实完整标题（数据层已补齐
 *               「Insight or evolution?」「Palm oil」「Does education fuel
 *               economic growth?」「Building the Skyline…Skyscrapers」），
 *               副标题单独渲染为 .art-sub（原先把副标题当正文段落）。
 *    3) BUG-6   交卷后 disabled 锁定全部输入与选项，顶部显示「已交卷」报告；
 *               交卷状态按题源独立持久化（Store 键 'rsubmitted'），切换题源
 *               再回来不会丢失；新增「重新作答」（二次确认 → 解锁 + 清空）。
 *    4) P1-1    交卷后显示总分 x/40、逐题对照表（题号 / 我的答案 / 正确答案
 *               / 对错，答错标红）、按题型分组的正确率；答案来自
 *               reading-answers.js（原书答案页解析）。
 *    5) P2-1    文章划词高亮：选中文本弹小工具条（黄 / 绿 / 粉 / 清除），
 *               高亮按题源存 localStorage（Store 键 'rhl'），随答案一起保存。
 *    6) P2-2    题号格三态：灰（未答）/ 绿（已答）/ 黄（标记待检查）；
 *               点数字跳转、点右上角 ⚑ 切换标记；工具栏「待检查 N」
 *               可循环快速跳转到标记题。
 *    7) P2-3    剩余 10 分钟计时器变红并轻微闪烁（.is-low），剩余 1 分钟
 *               再强提醒一次（.is-crit + toast）。
 *    8) 视觉   · 计时器与「交卷」按钮上移到顶部导航栏右侧（#examHud）；
 *               · 文章正文改衬线字体、行高 1.95、行宽 68ch；
 *               · 段落按 A/B/C… 分节编号（节来自原文，不是自动补齐），
 *                 段落匹配题可一键定位到对应文章 / 段落。
 *  影响范围：仅阅读模块。Store 新增键：rsubmitted / rmarks / rhl；
 *            原有 ranswers / rtimer / rtest 结构不变，旧数据可直接沿用。
 * ============================================================ */
window.Reading = (function () {
  'use strict';

  var DATA = window.IELTS_READING || [];
  var KEY = window.IELTS_READING_KEY || {};
  /* 选项题的作答键（与 UI.Options 的 keys 默认值一致）：
     剑桥答卷规则「Write the correct letter」——选项题存字母，答案键也是字母，
     早期版本误存了选项全文，导致单项/多项选择永远判错（v14 修复） */
  var OPT_KEYS = 'ABCDEFGH';
  function optKeyOf(i) { return OPT_KEYS[i] || String(i + 1); }

  var el = {};
  var cur = null;               // 当前 test
  var answers = {};             // testId -> { qno: value }
  var marks = {};               // testId -> { qno: 1 }      标记待检查
  var subs = {};                // testId -> { at, got, total }  交卷状态
  var hl = {};                  // testId -> [{ pid, s, e, c }]  划词高亮
  var timer = null;
  var timerBar = null;
  var curNo = null;
  var lockers = [];             // 本套题里的 UI.Options 实例（交卷时统一上锁）
  var warned = {};              // 计时提醒去重：'testId:10' / 'testId:1'
  /* super P0-1：本次会话刚交卷 → 回顾默认展开；从存储回来的老交卷 → 默认折叠 */
  var justSubmitted = false;
  var sel = null;               // 最近一次划词：{ pid, s, e }
  /* 作答写入防抖：连续输入时每 500ms 才落盘一次，避免每敲一个字全量写 localStorage */
  var persistAnswers = debounce(function () { Store.set('ranswers', answers); }, 500);

  /* ---------------- 初始化 ---------------- */
  function init() {
    el = {
      sel: $('#rSelTest'), chip: $('#rChip'), passMeta: $('#rPassMeta'),
      prog: $('#rProg'), nav: $('#rNav'), article: $('#rArticle'), qs: $('#rQuestions'),
      timer: $('#rTimer'), num: $('#rTimerNum'), fill: $('#rTimerFill'),
      btnTimer: $('#rBtnTimer'), btnReset: $('#rBtnReset'), btnSubmit: $('#rBtnSubmit'),
      btnTrend: $('#rBtnTrend'), btnTrendClose: $('#rBtnTrendClose'),
      trend: $('#rTrend'), trendBody: $('#rTrendBody'),
      split: $('#rSplit'), paneSeg: $('#rPaneSeg'), paneThumb: $('#rPaneThumb'),
      markChip: $('#rMarkChip'), hud: $('#examHud'),
      qnavPill: $('#qnavPill'),
      startBanner: $('#rStart'), btnGo: $('#rBtnGo'), btnStartClose: $('#rBtnStartClose'),
      navFold: $('#rNavFold')
    };
    if (!DATA.length) return;

    el.sel.innerHTML = DATA.map(function (t) {
      return '<option value="' + t.id + '">' + t.book + ' · ' + t.test + ' · Reading</option>';
    }).join('');

    prepare();
    answers = Store.get('ranswers', {});
    marks = Store.get('rmarks', {});
    subs = Store.get('rsubmitted', {});
    hl = Store.get('rhl', {});

    timer = UI.Timer({
      total: 3600,
      onFinish: function () {
        el.timer.classList.add('is-done');
        el.btnSubmit.classList.add('btn-primary');
        toast('时间到 · 请点「交卷」结束本套题', 4000);
      }
    });
    timerBar = UI.Progress($('#rTimer').querySelector('.bar'), $('#rTimerFill'));
    timer.restore(Store.get('rtimer', null));

    el.sel.addEventListener('change', function () { load(el.sel.value); });
    el.btnTimer.addEventListener('click', function () {
      var running = timer.toggle();
      persistTimer(); renderTimer();
      toast(running ? '计时开始 · 60 分钟' : '已暂停');
    });
    el.btnReset.addEventListener('click', resetAll);
    el.btnSubmit.addEventListener('click', function () { submit(false); });
    if (el.markChip) el.markChip.addEventListener('click', jumpNextMarked);

    /* v18 0.1：顶栏题号胶囊 → 点它滚到题号网格。
       可见性由父级 #examHud 控制（默认 display:none，考试页才显示），
       故这里移除 hidden 属性（.qnav-pill 的 class display 会压过 UA hidden） */
    /* v17 补丁第二轮 v7 P2-2：题号网格可整块收起（收起即让出约 100px
       题目视野；收起是流内隐藏，不是浮层，任何时候都不遮挡题目） */
    if (el.navFold) {
      el.navFold.addEventListener('click', function () {
        var wrap = el.navFold.parentNode;
        while (wrap && wrap.className.indexOf('q-nav-wrap') < 0) wrap = wrap.parentNode;
        if (!wrap) return;
        var fold = wrap.classList.toggle('is-fold');
        el.navFold.textContent = fold ? '展开题号' : '收起题号';
        el.navFold.setAttribute('aria-expanded', fold ? 'false' : 'true');
      });
    }

    if (el.qnavPill) {
      el.qnavPill.hidden = false;
      el.qnavPill.addEventListener('click', function () {
        /* B2-3：题号格收起时点胶囊必须先把网格展开，否则点了没反应 */
        var wrap = el.nav && el.nav.parentNode;
        while (wrap && wrap.className !== undefined && String(wrap.className).indexOf('q-nav-wrap') < 0) wrap = wrap.parentNode;
        if (wrap && wrap.classList.contains('is-fold')) {
          wrap.classList.remove('is-fold');
          if (el.navFold) { el.navFold.textContent = '收起题号'; el.navFold.setAttribute('aria-expanded', 'true'); }
        }
        try { el.nav.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        catch (e) { if (el.nav.scrollIntoView) el.nav.scrollIntoView(); }
      });
    }

    /* v18 0.4：首屏空白卷提示条——直接开始（不计时）/ 收起；
     * 开始计时或首次作答时自动收起，避免与作答区重叠 */
    function hideStartBanner() {
      if (el.startBanner) el.startBanner.hidden = true;
    }
    if (el.btnGo) el.btnGo.addEventListener('click', function () {
      hideStartBanner();
      toast('已直接开始 · 不计时，随时可点「开始计时」进入模考', 3200);
    });
    if (el.btnStartClose) el.btnStartClose.addEventListener('click', hideStartBanner);
    el.btnTimer.addEventListener('click', hideStartBanner);
    window.__readingHideStartBanner = hideStartBanner;

    bindSeg(el.paneSeg, el.paneThumb, function (b) {
      el.split.setAttribute('data-pane', b.dataset.pane);
    });

    bindHighlight();
    bindTrend();

    var last = Store.get('rtest', null);
    load(last && DATA.some(function (t) { return t.id === last; }) ? last : DATA[0].id);

    var n = 0;
    UI.startTicker(function () {
      renderTimer();
      if (++n % 20 === 0) persistTimer();
    });
    /* v18 0.11：刷新回来时若计时已归零（restore 后 running=false，ticker 不再回调），
       在此兜底补一次自动交卷 */
    setTimeout(function () {
      if (timer.started() && timer.remaining() <= 0 && !isSubmitted()) {
        toast('时间到 · 已自动交卷', 4200);
        submit(true);
      }
    }, 700);
    window.addEventListener('beforeunload', function () {
      persistTimer();
      Store.set('ranswers', answers);   /* 防抖尚未落盘的最后一次输入也一并保存 */
    });
  }

  function persistTimer() { Store.set('rtimer', timer.state()); }

  /* ---------------- 数据预处理（分节 / 去字母前缀 / 去控制字符） ----------------
   *  原文里的段落有两种形态：
   *    · 带节字母的段落，形如 "A Stadiums are …"（字母后接空格）；
   *    · 续段，开头残留一个 \u0007（PDF 里那是一个装饰符，提取时变成 BEL）。
   *  这里统一做两件事：把节字母抽出来变成节标题（渲染成左侧 A/B/C 徽标），
   *  把文本里的 \u0007 全部去掉，并给每段分配稳定的 pid 供高亮记录引用。
   *  只有当一篇里出现 ≥3 个「字母 + 空格」开头时才认为是分节文章，
   *  避免把 "A second attempt…" 这类正常句子误判为节。
   * ---------------------------------------------------------------------- */
  function prepare() {
    DATA.forEach(function (t) {
      t._typeOf = {};
      t.groups.forEach(function (g) {
        (g.nos || []).forEach(function (n) {
          t._typeOf[n] = {
            type: g.type,
            bucket: bucketOf(g.type),
            pass: passOf(g.instruction),
            match: /匹配|配对/.test(g.type || '')
          };
        });
      });
      /* pid 在整个 test 内唯一（跨篇连续编号），高亮区间靠它定位段落 */
      var base = 0;
      t.passages.forEach(function (p) { base = prepPassage(p, base); });
    });
  }

  function prepPassage(p, base) {
    var raw = p.paras || [];
    var hits = raw.filter(function (s) { return /^[A-H][ \u00a0\u0007]/.test(s); });
    var lettered = hits.length >= 3;

    var blocks = [];
    base = base || 0;
    raw.forEach(function (txt) {
      var s = String(txt);
      var isFoot = /^\*/.test(s);
      var letter = null;
      if (lettered) {
        var m = /^([A-H])[ \u00a0\u0007]+/.exec(s);
        if (m) { letter = m[1]; s = s.slice(m[0].length); }
      }
      s = s.replace(/\u0007/g, '');
      if (isFoot) {
        s = s.replace(/^\*+\s*/, function (x) { return x.replace(/\s+$/, '') + ' '; });
      }
      s = s.replace(/\s+/g, ' ').trim();
      blocks.push({ text: s, foot: isFoot, letter: letter, pid: -1, secLetter: null });
    });

    /* 按节分组：带字母的段落开启新节，其余续到当前节 */
    var secs = [];
    blocks.forEach(function (b, i) {
      b.pid = base + i;
      if (b.letter) {
        secs.push({ letter: b.letter, blocks: [b] });
        b.secLetter = b.letter;
      } else if (secs.length) {
        secs[secs.length - 1].blocks.push(b);
      } else {
        secs.push({ letter: null, blocks: [b] });
      }
    });

    p._lettered = lettered;
    p._secs = secs;
    p._blocks = blocks;
    return base + blocks.length;
  }

  function bucketOf(type) {
    type = type || '';
    if (type === '判断') return '判断';
    if (/选择/.test(type)) return '选择';
    if (/匹配|配对/.test(type)) return '匹配';
    return '填空';
  }

  function passOf(inst) {
    var m = /Reading Passage\s+(\d)/.exec(inst || '');
    return m ? parseInt(m[1], 10) : 0;
  }

  /* ---------------- 载入一套题 ---------------- */
  function load(id) {
    cur = DATA.filter(function (t) { return t.id === id; })[0] || DATA[0];
    justSubmitted = false;
    el.sel.value = cur.id;
    Store.set('rtest', cur.id);
    curNo = null;
    lockers = [];
    if (!answers[cur.id]) answers[cur.id] = {};
    if (!hl[cur.id]) hl[cur.id] = [];
    if (!marks[cur.id]) marks[cur.id] = {};
    renderArticle();
    renderQuestions();
    renderProgress();
    renderNav();
    renderMarkChip();
    renderTimer();
    renderTrend();   /* v14：载入题源时刷新趋势面板（含空状态） */
    /* v18 0.4：换题后回到空白卷提示态——已交卷或已有作答的不再显示 */
    if (el.startBanner) el.startBanner.hidden = isSubmitted() || answeredCount() > 0;
  }

  function isSubmitted() { return !!subs[cur.id]; }

  function totalNos() {
    var n = 0;
    cur.groups.forEach(function (g) { n += (g.nos || []).length; });
    return n;
  }
  function answeredCount() {
    var a = answers[cur.id] || {}, n = 0;
    Object.keys(a).forEach(function (k) { if (String(a[k]).trim()) n++; });
    return n;
  }
  function getAns(no) { return (answers[cur.id] || {})[no] || ''; }
  function setAns(no, v) {
    if (isSubmitted()) return;
    answers[cur.id][no] = v;
    persistAnswers();
    renderProgress();
    renderNav();
    /* v18 0.4：一旦开始作答（非空输入）即收起空白卷提示条 */
    if (String(v).trim() && window.__readingHideStartBanner) window.__readingHideStartBanner();
    var item = $('#rq-' + no);
    if (item) item.classList.toggle('is-answered', String(v).trim() !== '');
  }

  /* ---------------- 左：文章 ---------------- */
  function renderArticle() {
    var words = 0;
    cur.passages.forEach(function (p) {
      p._blocks.forEach(function (b) { words += b.text.split(/\s+/).length; });
    });
    el.passMeta.textContent = cur.passages.length + ' 篇 · 约 ' + words + ' 词';
    el.chip.textContent = '共 ' + totalNos() + ' 题';

    var html = cur.passages.map(function (p) {
      var head = '<h3 class="art-title" id="art-' + p.no + '-top">' +
        esc(p.title || ('Reading Passage ' + p.no)) + '</h3>';
      if (p.subtitle) head += '<p class="art-sub">' + esc(p.subtitle) + '</p>';
      head += '<div class="ptag">' + esc(cur.book) + ' · ' + esc(cur.test) +
        ' · Reading Passage ' + p.no + ' · ' + p._blocks.length + ' 段</div>';

      var body = p._secs.map(function (sec) {
        var inner = sec.blocks.map(function (b) {
          return '<p' + (b.foot ? ' class="art-foot"' : '') + ' data-pid="' + b.pid + '"' +
            (sec.letter ? ' data-sec="' + sec.letter + '"' : '') + '>' +
            highlightHtml(b) + '</p>';
        }).join('');
        if (!sec.letter) return inner;
        return '<div class="art-sec" id="sec-' + p.no + '-' + sec.letter +
          '" data-sec="' + sec.letter + '">' +
          '<span class="art-letter" aria-hidden="true">' + sec.letter + '</span>' +
          inner + '</div>';
      }).join('');

      return head + '<div class="art-body">' + body + '</div>';
    }).join('<hr class="art-sep">');

    el.article.innerHTML = html + missingNote();
    el.article.classList.toggle('has-sec', cur.passages.some(function (p) { return p._lettered; }));
  }

  /* 按 pid 把高亮区间切进段落文本 */
  function highlightHtml(b) {
    var list = (hl[cur.id] || []).filter(function (h) { return h.pid === b.pid; })
      .sort(function (a, c) { return a.s - c.s; });
    if (!list.length) return esc(b.text);
    var t = b.text, out = '', pos = 0;
    list.forEach(function (h) {
      var s = Math.max(pos, Math.min(h.s, t.length));
      var e = Math.max(s, Math.min(h.e, t.length));
      if (s > pos) out += esc(t.slice(pos, s));
      if (e > s) out += '<mark class="hl hl-' + (h.c || 'y') + '">' + esc(t.slice(s, e)) + '</mark>';
      pos = e;
    });
    out += esc(t.slice(pos));
    return out;
  }

  /* 剑 18 / 剑 19 的占位说明（按要求标注缺失与所需原文） */
  function missingNote() {
    return '<div class="placeholder" style="margin-top:28px">' +
      '<h4>题源范围说明</h4>' +
      '已录入：<b>' + cur.book + ' ' + cur.test + '</b>（原书 PDF 文本层直接提取，文章与题目均为原文）。' +
      '<ul>' +
      '<li><b>缺失</b>：剑桥雅思 <b>18</b>、<b>19</b> 的阅读文章与题目 —— 这两本 PDF 为扫描件，' +
      '没有文本层，OCR 识别会引入错字，无法保证「原样录入」。</li>' +
      '<li><b>所需原文</b>：① 带文本层的 18 / 19 PDF；或 ② 手动校对后的 18 / 19 文章与题目文本；' +
      '或 ③ 明确允许以 OCR 结果（可能存在个别错字）录入。</li>' +
      '<li>补齐方式：把校对后的文章与题目文本发给我们，录入后这里会自动出现新题源，无需你操作。</li>' +
      '</ul></div>';
  }

  /* ---------------- 右：题目 ---------------- */
  function renderQuestions() {
    lockers = [];
    var html = cur.groups.map(function (g, gi) {
      var head = '<div class="qgroup-head">' +
        '<h4>' + esc(g.label) + '</h4>' +
        '<span class="tag tag-accent">' + esc(g.type) + '</span>' +
        '<span class="tag">共 ' + (g.nos || []).length + ' 题</span>' +
        '</div>';
      var inst = g.instruction
        ? '<div class="qgroup-inst">' + esc(g.instruction) + '</div>' : '';
      return '<div class="qgroup">' + head + inst + renderGroup(g, gi) + '</div>';
    }).join('');

    /* super P0-1：着陆页把「回顾」和「做题」分开——
       交卷过：先给一张可操作的着陆卡（重做 / 展开回顾），40 题表格与药丸
       收进 <details> 默认折叠，不再让整页以 disabled 输入框开场；
       没交卷：题目与输入框直接排最前，不做任何折叠。 */
    if (isSubmitted()) {
      el.qs.innerHTML =
        '<div class="r-landing">' + landingHtml() + '</div>' +
        '<details class="rpt-fold"' + (justSubmitted ? ' open' : '') + '>' +
          '<summary><b>' + (justSubmitted ? '本次交卷详情' : '查看上次交卷回顾') + '</b>' +
            '<span>预估 Band、按题型正确率、40 题逐题对照</span></summary>' +
          reportHtml() +
        '</details>';
    } else {
      el.qs.innerHTML = html;
    }
    el.qs.classList.toggle('is-locked', isSubmitted());

    bindMulti();
    bindInputs();
    bindJumps();
    if (isSubmitted()) {
      bindReport();
    }
    renderNav();
  }

  /* 「Choose TWO letters」这类整组共用选项的题：逐题渲染选项 / 输入框 */
  function bindMulti() {
    cur.groups.forEach(function (g) {
      if (g.mode !== 'multi') return;
      (g.nos || []).forEach(function (no) {
        var box = el.qs.querySelector('.qitem-opts[data-no="' + no + '"]');
        if (!box) return;
        if (!(g.opts && g.opts.length)) {
          box.innerHTML = '<input class="ans-inp" data-no="' + no + '" value="' +
            esc(getAns(no)) + '" placeholder="作答" autocomplete="off">';
          return;
        }
        var saved = getAns(no);
        var oi = UI.Options(box, {
          items: g.opts,
          onPick: function (v, i) {
            $$('.opt', box).forEach(function (b) { b.classList.remove('is-right'); });
            $$('.opt', box).forEach(function (b, j) {
              if (g.opts[j] === v) b.classList.add('is-right');
            });
            setAns(no, optKeyOf(i));   /* v14：存字母键，与答案键/答卷规则一致 */
          }
        });
        lockers.push(oi);
        if (saved) {
          $$('.opt', box).forEach(function (b, i) {
            if (optKeyOf(i) === String(saved).trim().toUpperCase()) b.classList.add('is-right');
          });
        }
      });
    });
  }

  /* 判断题的下拉选项：由题干措辞决定是 T/F/NG 还是 Y/N/NG */
  function judgeOptions(g) {
    var yn = /claims of the writer/i.test(g.instruction || '');
    return yn ? ['YES', 'NO', 'NOT GIVEN'] : ['TRUE', 'FALSE', 'NOT GIVEN'];
  }

  function renderGroup(g, gi) {
    if (g.mode === 'cloze') {
      var isJudge = g.type === '判断';
      var opts = isJudge ? judgeOptions(g) : null;
      return g.cloze.map(function (line) {
        var inner = line.map(function (seg) {
          if ('g' in seg) {
            var saved = getAns(seg.g);
            if (isJudge) {
              return '<select class="gap-sel" id="rq-' + seg.g + '" data-no="' + seg.g + '" ' +
                'aria-label="第 ' + seg.g + ' 题">' +
                '<option value="">—</option>' +
                opts.map(function (o) {
                  return '<option value="' + o + '"' +
                    (String(saved).toUpperCase() === o ? ' selected' : '') + '>' + o + '</option>';
                }).join('') + '</select>';
            }
            return '<input class="gap-inp" id="rq-' + seg.g + '" data-no="' + seg.g +
              '" value="' + esc(saved) + '" placeholder="' + seg.g + '" ' +
              'autocomplete="off" spellcheck="false">';
          }
          return esc(seg.t);
        }).join('');
        var indent = /^\s*[•·]/.test(line[0] && line[0].t ? line[0].t : '');
        return '<p class="cloze-line' + (indent ? ' indent' : '') + '">' + inner + '</p>';
      }).join('');
    }

    if (g.mode === 'multi') {
      var prompt = '<div class="qitem"><div class="qitem-top"><span class="qno">' +
        g.nos[0] + '–' + g.nos[g.nos.length - 1] + '</span>' +
        '<div class="qitem-text">' + esc(g.prompt || g.instruction) + '</div></div></div>';
      var rows = g.nos.map(function (no) {
        return '<div class="qitem" id="rq-' + no + '">' +
          '<div class="qitem-top"><span class="qno">' + no + '</span>' +
          '<div class="qitem-text">第 ' + no + ' 题答案</div></div>' +
          '<div class="qitem-opts" data-no="' + no + '"></div>' +
          '</div>';
      }).join('');
      return prompt + rows;
    }

    // items 模式
    var passNo = passOf(g.instruction);
    var canJump = /匹配|配对/.test(g.type || '') && passNo;
    return (g.items || []).map(function (it) {
      var body = '<div class="qitem" id="rq-' + it.no + '">' +
        '<div class="qitem-top"><span class="qno">' + it.no + '</span>' +
        '<div class="qitem-text">' + esc(it.text) + '</div>' +
        (canJump
          ? '<button type="button" class="q-jump" data-pass="' + passNo +
            '" title="定位到 Reading Passage ' + passNo + ' 原文">定位</button>'
          : '') +
        '</div>';
      if (it.opts && it.opts.length) {
        body += '<div class="qitem-opts" data-no="' + it.no + '"></div>';
      } else {
        body += '<input class="ans-inp" data-no="' + it.no + '" value="' + esc(getAns(it.no)) +
          '" placeholder="作答" autocomplete="off">';
      }
      return body + '</div>';
    }).join('');
  }

  function bindInputs() {
    // 选项渲染（items 模式）
    cur.groups.forEach(function (g) {
      if (g.mode !== 'items') return;
      (g.items || []).forEach(function (it) {
        if (!it.opts || !it.opts.length) return;
        var box = el.qs.querySelector('.qitem-opts[data-no="' + it.no + '"]');
        if (!box) return;
        var saved = getAns(it.no);
        var oi = UI.Options(box, {
          items: it.opts,
          onPick: function (v, i) {
            box.querySelectorAll('.opt').forEach(function (b) { b.classList.remove('is-right'); });
            box.querySelectorAll('.opt').forEach(function (b, j) {
              if (it.opts[j] === v) b.classList.add('is-right');
            });
            setAns(it.no, optKeyOf(i));   /* v14：存字母键，与答案键/答卷规则一致 */
          }
        });
        lockers.push(oi);
        if (saved) {
          box.querySelectorAll('.opt').forEach(function (b, i) {
            if (optKeyOf(i) === String(saved).trim().toUpperCase()) b.classList.add('is-right');
          });
        }
      });
    });

    // 文本输入 / 判断下拉
    $$('.ans-inp, .gap-inp, .gap-sel', el.qs).forEach(function (inp) {
      var ev = inp.tagName === 'SELECT' ? 'change' : 'input';
      inp.addEventListener(ev, function () {
        setAns(parseInt(inp.dataset.no, 10), inp.value);
      });
    });

    $$('.qitem', el.qs).forEach(function (q) {
      var m = /^rq-(\d+)$/.exec(q.id || '');
      if (m && String(getAns(m[1])).trim()) q.classList.add('is-answered');
    });
  }

  /* 段落匹配题：点「定位」跳到对应文章 / 段落 */
  function bindJumps() {
    $$('.q-jump', el.qs).forEach(function (b) {
      b.addEventListener('click', function () { jumpArticle(+b.dataset.pass, null); });
    });
  }

  function jumpArticle(pno, letter) {
    if (window.innerWidth <= 900) switchPane('article', true);
    var target = letter ? $('#sec-' + pno + '-' + letter) : $('#art-' + pno + '-top');
    if (!target) return;
    $$('.art-sec.is-cur', el.article).forEach(function (n) { n.classList.remove('is-cur'); });
    if (letter) target.classList.add('is-cur');
    try {
      target.scrollIntoView({ behavior: 'smooth', block: letter ? 'center' : 'start' });
    } catch (e) {
      try { target.scrollIntoView(); } catch (e2) {}
    }
  }

  /* 交卷报告：点击表格行 → 滚动到答案所在段落并高亮 2.5s 后淡出 */
  var locTimer = null;
  function jumpLocate(pid) {
    if (pid == null || isNaN(pid)) return;
    var target = el.article.querySelector('p[data-pid="' + pid + '"]');
    if (!target) return;
    if (window.innerWidth <= 900) switchPane('article', true);
    var sec = target.closest ? target.closest('.art-sec') : null;
    $$('.art-sec.is-cur', el.article).forEach(function (n) { n.classList.remove('is-cur'); });
    if (sec) sec.classList.add('is-cur');
    try {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {
      try { target.scrollIntoView(); } catch (e2) {}
    }
    $$('.loc-flash', el.article).forEach(function (n) { n.classList.remove('loc-flash'); });
    target.classList.add('loc-flash');
    if (locTimer) clearTimeout(locTimer);
    locTimer = setTimeout(function () { target.classList.remove('loc-flash'); }, 2500);
  }

  /* ---------------- 题号导航（三态） ---------------- */
  function renderNav() {
    var max = 0;
    cur.groups.forEach(function (g) {
      (g.nos || []).forEach(function (n) { if (n > max) max = n; });
    });
    var mk = marks[cur.id] || {};
    var html = '';
    for (var i = 1; i <= max; i++) {
      var done = String(getAns(i)).trim() !== '';
      var marked = !!mk[i];
      html += '<button type="button" data-no="' + i + '" class="qnav-cell' +
        (done ? ' done' : '') + (marked ? ' mark' : '') + (curNo === i ? ' cur' : '') + '" ' +
        'title="第 ' + i + ' 题 · 点数字跳转，点右上角 ⚑ 标记待检查" ' +
        'aria-label="第 ' + i + ' 题，' + (done ? '已答' : '未答') + (marked ? '，已标记待检查' : '') + '">' +
        '<span class="qnav-n">' + i + '</span>' +
        '<span class="qnav-f" data-flag="' + i + '" aria-label="标记第 ' + i + ' 题为待检查">⚑</span>' +
        '</button>';
    }
    el.nav.innerHTML = html;
    $$('button', el.nav).forEach(function (b) {
      b.addEventListener('click', function (e) {
        var f = e.target && e.target.closest ? e.target.closest('[data-flag]') : null;
        if (f) {
          e.preventDefault();
          e.stopPropagation();
          toggleMark(parseInt(f.getAttribute('data-flag'), 10));
          return;
        }
        goto(parseInt(b.dataset.no, 10));
      });
    });
    renderMarkChip();
  }

  function toggleMark(no) {
    var m = marks[cur.id] || (marks[cur.id] = {});
    if (m[no]) delete m[no]; else m[no] = 1;
    Store.set('rmarks', marks);
    renderNav();
    var cell = el.nav.querySelector('button[data-no="' + no + '"]');
    if (cell) cell.classList.toggle('mark', !!m[no]);
    toast(m[no] ? '第 ' + no + ' 题已标记待检查' : '第 ' + no + ' 题已取消标记');
  }

  function renderMarkChip() {
    if (!el.markChip) return;
    var n = Object.keys(marks[cur.id] || {}).length;
    el.markChip.textContent = '待检查 ' + n;
    el.markChip.classList.toggle('is-off', n === 0);
    el.markChip.disabled = n === 0;
  }

  function jumpNextMarked() {
    var list = Object.keys(marks[cur.id] || {}).map(Number).sort(function (a, b) { return a - b; });
    if (!list.length) { toast('还没有标记任何题目'); return; }
    var idx = list.indexOf(curNo);
    var next = list[(idx + 1) % list.length];
    goto(next);
    toast('快速跳转到第 ' + next + ' 题（待检查）');
  }

  function switchPane(pane) {
    el.split.setAttribute('data-pane', pane);
    var b = $$('.seg-btn', el.paneSeg).filter(function (x) {
      return x.dataset.pane === pane;
    })[0];
    if (b) {
      $$('.seg-btn', el.paneSeg).forEach(function (x) { x.classList.remove('is-active'); });
      b.classList.add('is-active');
      syncSegThumb(el.paneSeg, el.paneThumb);
    }
  }

  function goto(no) {
    curNo = no;
    // 移动端：先切到题目栏
    if (el.split.getAttribute('data-pane') === 'article' && window.innerWidth <= 900) {
      switchPane('questions');
    }
    $$('.qitem', el.qs).forEach(function (q) { q.classList.remove('is-cur'); });
    var target = $('#rq-' + no);
    if (target) {
      var host = (target.closest && target.closest('.qitem')) || target;
      host.classList.add('is-cur');
      try {
        host.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) {
        if (host.scrollIntoView) host.scrollIntoView();
      }
    }
    renderNav();
  }

  /* ---------------- 进度与计时 ---------------- */
  function renderProgress() {
    var a = answeredCount(), t = totalNos();
    var m = Object.keys(marks[cur.id] || {}).length;
    el.prog.textContent = '已答 ' + a + ' / ' + t + (m ? ' · 待检查 ' + m : '');
    renderQnavPill();
  }

  /* v18 0.1：顶栏题号胶囊文本 = 已答 / 总题数（交卷后显示得分），与听力页同格式 */
  /* B2-1：切回阅读视图时由 App.switchView 调用，重写顶栏胶囊为本套题数 */
  function refreshHud() {
    if (document.body.getAttribute('data-view') !== 'reading') return;
    renderQnavPill();
  }

  function renderQnavPill() {
    if (!el.qnavPill) return;
    var t = totalNos(), a = answeredCount();
    if (isSubmitted()) {
      var s = subs[cur.id] || {};
      el.qnavPill.textContent = '已交卷 ' + (s.got || 0) + ' / ' + t;
    } else {
      el.qnavPill.textContent = '题 ' + a + ' / ' + t;
    }
  }

  function renderTimer() {
    var rem = timer.remaining(), tot = timer.total();
    el.num.textContent = fmtClock(rem);
    timerBar.set(tot ? (rem / tot) * 100 : 0);
    var low = rem > 0 && rem <= 600;
    var crit = rem > 0 && rem <= 60;
    el.timer.classList.toggle('is-low', low);
    el.timer.classList.toggle('is-crit', crit);
    if (rem > 0) el.timer.classList.remove('is-done');

    /* P2-3：剩余 10 分钟变红并提示一次；剩余 1 分钟再提醒一次 */
    if (low && !warned[cur.id + ':10']) {
      warned[cur.id + ':10'] = 1;
      toast('剩余 10 分钟 · 计时器已转红', 3600);
    }
    if (crit && !warned[cur.id + ':1']) {
      warned[cur.id + ':1'] = 1;
      toast('剩余 1 分钟 · 请尽快收尾', 4200);
    }
    /* v18 0.11：时间到 → 自动交卷（雅思机考行为） */
    if (rem <= 0 && timer.started() && !isSubmitted() && !warned[cur.id + ':0']) {
      warned[cur.id + ':0'] = 1;
      toast('时间到 · 已自动交卷', 4200);
      submit(true);
    }
    setBtnText(el.btnTimer, timer.running() ? '暂停'
      : (timer.started() && rem > 0 ? '继续' : '开始计时'));
  }

  /* ---------------- 重置 / 交卷 / 重新作答 ---------------- */
  function resetAll() {
    UI.Confirm({
      title: '重置本套',
      text: '将把计时器重置为 60:00，并清空本套全部作答、题号标记与高亮批注。' +
            '确定要清空吗？此操作不可恢复。',
      ok: '确定重置'
    }, function (yes) {
      if (!yes) return;
      timer.reset();
      el.timer.classList.remove('is-done', 'is-low', 'is-crit');
      warned = {};
      answers[cur.id] = {};
      hl[cur.id] = [];
      marks[cur.id] = {};
      delete subs[cur.id];
      Store.set('ranswers', answers);
      Store.set('rhl', hl);
      Store.set('rmarks', marks);
      Store.set('rsubmitted', subs);
      persistTimer();
      curNo = null;
      renderArticle();
      renderQuestions();
      renderProgress();
      renderNav();
      renderTimer();
      toast('已重置计时与本套作答');
    });
  }

  function submit(force) {
    if (isSubmitted()) { toast('本套已交卷，可点「重新作答」再练一次'); return; }
    var t = totalNos(), a = answeredCount();
    var run = function () {
      var s = score();
      /* v13：交卷后按题顺序短促连播提示音（不一次长鸣、单路）；逐题 stagger 200ms */
      if (window.Feedback && s.has) {
        s.rows.forEach(function (r, i) {
          setTimeout(function () { window.Feedback.playChime(r.ok); }, i * 200);
        });
      }
      var band = bandOf(s.got);
      subs[cur.id] = { at: Date.now(), got: s.got, total: s.total, band: band };
      Store.set('rsubmitted', subs);
      /* 交卷历史：每条记录都带 Band + 各题型正确率 + 各类错题题号，供趋势/统计展示 */
      var hist = Store.get('rhist', []);
      if (!Array.isArray(hist)) hist = [];
      var byTypeRec = {}, wrongRec = {};
      s.rows.forEach(function (r) {
        var bk = r.bucket || '填空';
        if (!byTypeRec[bk]) { byTypeRec[bk] = { got: 0, total: 0 }; wrongRec[bk] = []; }
        byTypeRec[bk].total++;
        if (r.ok) byTypeRec[bk].got++;
        else if (r.mine) wrongRec[bk].push(r.no);   /* 只列做错的题（未作答不计） */
      });
      hist.unshift({
        id: cur.id, got: s.got, total: s.total, band: band, at: Date.now(),
        byType: byTypeRec, wrong: wrongRec
      });
      Store.set('rhist', hist.slice(0, 20));
      renderTrend();   /* v14：交卷后刷新趋势面板数据 */
      timer.pause();
      persistTimer();
      renderTimer();
      justSubmitted = true;
      renderQuestions();
      renderProgress();
      /* 窄屏上题号网格占满一屏，交卷后把报告滚进视野 */
      if (window.innerWidth <= 900) {
        var rpt = $('.rpt', el.qs);
        if (rpt && rpt.scrollIntoView) {
          try { rpt.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
          catch (e) { try { rpt.scrollIntoView(); } catch (e2) {} }
        }
      }
      toast('已交卷 · ' + s.got + ' / ' + s.total, 3200);
    };
    /* v18 0.11：时间到自动交卷（不弹确认）；手动交卷未答满仍要确认 */
    if (!force && a < t) {
      UI.Confirm({
        title: '确认交卷',
        text: '本套还有 ' + (t - a) + ' 题未作答，交卷后作答区会被锁定。确定要交卷吗？',
        ok: '确认交卷',
        danger: false
      }, function (yes) { if (yes) run(); });
      return;
    }
    run();
  }

  function retry() {
    UI.Confirm({
      title: '重新作答',
      text: '将清空本套全部作答与高亮批注并解锁作答区，计时器保持当前状态。' +
            '确定要清空吗？此操作不可恢复。',
      ok: '清空并解锁'
    }, function (yes) {
      if (!yes) return;
      answers[cur.id] = {};
      hl[cur.id] = [];
      marks[cur.id] = {};
      delete subs[cur.id];
      Store.set('ranswers', answers);
      Store.set('rhl', hl);
      Store.set('rmarks', marks);
      Store.set('rsubmitted', subs);
      curNo = null;
      renderArticle();
      renderQuestions();
      renderProgress();
      renderNav();
      toast('已清空本套作答，可以重新作答');
    });
  }

  /* ---------------- 判分 ---------------- */
  function normAns(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .replace(/[\u2018\u2019\u02bc]/g, "'")
      .replace(/(\d),(?=\d)/g, '$1')
      .replace(/\([^)]*\)/g, ' ')          /* 去掉括号内的可选项 */
      .replace(/[^a-z0-9'\- ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* 把 'flavour / flavor' 这类「两种拼写都接受」拆成候选数组 */
  function alts(v) {
    if (Array.isArray(v)) return v.map(function (x) { return normAns(x); }).filter(Boolean);
    return String(v).split('/').map(function (x) { return normAns(x); }).filter(Boolean);
  }
  /* 展示用：保留原书大小写，不做归一化 */
  function shows(v) {
    if (Array.isArray(v)) return v.slice();
    return String(v).split('/').map(function (x) { return x.trim(); }).filter(Boolean);
  }

  /* Academic 阅读原始分 → Band（剑桥官方换算表，逐档真实换算） */
  function bandOf(got) {
    if (got >= 39) return 9.0;
    if (got >= 37) return 8.5;
    if (got >= 35) return 8.0;
    if (got >= 33) return 7.5;
    if (got >= 30) return 7.0;
    if (got >= 27) return 6.5;
    if (got >= 23) return 6.0;
    if (got >= 19) return 5.5;
    if (got >= 15) return 5.0;
    if (got >= 13) return 4.5;
    if (got >= 10) return 4.0;
    if (got >= 8) return 3.5;
    if (got >= 6) return 3.0;
    if (got >= 4) return 2.5;
    if (got >= 3) return 2.0;
    if (got >= 1) return 1.5;
    return 1.0;
  }

  /* 该题答案所在段落 pid（数据见 reading-locate.js） */
  function locateOf(no) {
    var map = (window.IELTS_READING_LOCATE || {})[cur.id] || {};
    var v = map[no];
    return (typeof v === 'number') ? v : null;
  }

  var keyCache = {};
  function keyOf(tid) {
    if (keyCache[tid]) return keyCache[tid];
    var raw = KEY[tid] || {};
    var one = {}, disp = {}, pair = {};
    Object.keys(raw).forEach(function (k) {
      if (k.indexOf('&') >= 0) {
        var ns = k.split('&'), vals = raw[k];
        ns.forEach(function (n) {
          one[n] = alts(vals);
          disp[n] = shows(vals);
          pair[n] = ns.slice();
        });
      } else {
        one[k] = alts(raw[k]);
        disp[k] = shows(raw[k]);
      }
    });
    keyCache[tid] = { one: one, disp: disp, pair: pair, has: Object.keys(one).length > 0 };
    return keyCache[tid];
  }

  function score() {
    var k = keyOf(cur.id);
    var total = totalNos();
    var rows = [], got = 0;
    var byType = {};
    var pairDup = {};

    for (var no = 1; no <= total; no++) {
      var mine = String(getAns(no)).trim();
      var acc = k.one[no] || [];
      var ok = false;
      if (mine && acc.length) ok = acc.indexOf(normAns(mine)) >= 0;

      /* IN EITHER ORDER：两题答案必须互不相同 */
      var pr = k.pair[no];
      if (ok && pr) {
        var groupKey = pr.join('&');
        if (!pairDup[groupKey]) pairDup[groupKey] = {};
        var nm = normAns(mine);
        if (pairDup[groupKey][nm]) ok = false;         /* 同一答案重复使用 */
        else pairDup[groupKey][nm] = 1;
      }

      if (ok) got++;
      /* 正确答案展示：可互换组显示 "C 或 D" */
      var right = pr ? (k.disp[no] || []).join(' 或 ') : (k.disp[no] || []).join(' / ');
      var meta = cur._typeOf[no] || {};
      var bk = meta.bucket || '填空';
      rows.push({ no: no, mine: mine, right: right, ok: ok, type: meta.type || '', bucket: bk });

      if (!byType[bk]) byType[bk] = { got: 0, total: 0 };
      byType[bk].total++;
      if (ok) byType[bk].got++;
    }
    return { total: total, got: got, rows: rows, byType: byType, has: k.has };
  }

  /* ---------------- 交卷后：报告 + 锁定 + 标注 ---------------- */
  function lockAll() {
    $$('input, select, textarea', el.qs).forEach(function (n) { n.disabled = true; });
    lockers.forEach(function (l) { try { l.lock(); } catch (e) {} });
  }

  function markAnswers() {
    var k = keyOf(cur.id);
    if (!k.has) return;
    var s = score();
    s.rows.forEach(function (r) {
      var node = $('#rq-' + r.no);
      if (!node) return;
      if (node.tagName === 'INPUT' || node.tagName === 'SELECT') {
        node.classList.add(r.ok ? 'is-right' : (r.mine ? 'is-wrong' : 'is-blank'));
        return;
      }
      /* 选项：正确项标绿，误选项标红（按选项字母键 .k 比对，与存分规则一致） */
      var box = node.classList.contains('qitem-opts')
        ? node : node.querySelector('.qitem-opts');
      if (box) {
        var acc = k.one[r.no] || [];
        $$('.opt', box).forEach(function (b) {
          var kEl = b.querySelector('.k');
          var val = kEl ? kEl.textContent : (b.querySelector('span:last-child') || b).textContent;
          if (acc.indexOf(normAns(val)) >= 0) b.classList.add('is-right');
          else if (r.mine && normAns(val) === normAns(r.mine)) b.classList.add('is-wrong');
        });
      }
      node.classList.toggle('is-correct', r.ok);
      node.classList.toggle('is-incorrect', !r.ok && !!r.mine);
    });
  }

  function reportHtml() {
    var s = score();
    var sub = subs[cur.id] || {};
    var used = timer.started() ? Math.round(timer.total() - timer.remaining()) : null;
    /* 近期交卷记录（每条带 Band） */
    var hist = Store.get('rhist', []);
    if (!Array.isArray(hist)) hist = [];
    hist = hist.slice(0, 5);
    var histHtml = hist.length
      ? '<div class="rpt-hist"><span class="rpt-hist-t">近期交卷</span>' +
        hist.map(function (h) {
          var b = bandOf(h.got || 0);   /* 始终按最新换算表重算，旧记录也刷新口径 */
          return '<span class="rpt-hist-i">' + fmtDate(h.at).slice(5) + ' · ' +
            h.got + '/' + h.total + ' · Band ' + b.toFixed(1) + '</span>';
        }).join('') + '</div>'
      : '';

    if (!s.has) {
      return '<div class="rpt"><div class="rpt-head">' +
        '<span class="rpt-badge">已交卷</span>' +
        '<b class="rpt-score">—</b>' +
        '<span class="muted">本套暂无标准答案数据，无法判分</span>' +
        '<span class="rpt-grow"></span>' +
        '<button type="button" class="btn btn-sm" id="rRetry">重新作答</button>' +
        '</div></div>';
    }

    var typesHead = '<div class="rpt-types-t">本套题型分布（按题型判分）</div>';
    var types = Object.keys(s.byType).map(function (k) {
      var v = s.byType[k];
      var pct = v.total ? Math.round((v.got / v.total) * 100) : 0;
      return '<span class="rpt-type"><i>' + esc(k) + '</i>' +
        '<b>' + v.got + '/' + v.total + '</b>' +
        '<span class="rpt-bar"><i style="width:' + pct + '%"></i></span>' +
        '<em>' + pct + '%</em></span>';
    }).join('');

    var rows = s.rows.map(function (r) {
      var loc = locateOf(r.no);
      var locAttr = loc != null ? ' data-locate="' + loc + '" title="点击定位到原文该段"' : '';
      var meta = cur._typeOf[r.no] || {};
      return '<tr class="' + (r.ok ? 'ok' : (r.mine ? 'bad' : 'blank')) + '"' + locAttr + '>' +
        '<td class="c-no">' + r.no + '</td>' +
        '<td class="c-mine">' + (r.mine ? esc(r.mine) : '<span class="muted">未作答</span>') + '</td>' +
        '<td class="c-right">' + esc(r.right || '—') + '</td>' +
        '<td class="c-mark">' + (r.ok ? '✓' : '✕') + '</td>' +
        '</tr>';
    }).join('');

    return '<div class="rpt">' +
      '<div class="rpt-head">' +
        '<span class="rpt-badge">已交卷</span>' +
        '<b class="rpt-score">' + s.got + ' <i>/ ' + s.total + '</i></b>' +
        '<span class="rpt-band">预估 Band <b>' + bandOf(s.got).toFixed(1) + '</b>' +
          '<em>按剑桥官方换算表预估，仅供参考</em></span>' +
        '<span class="muted">答对 ' + s.got + ' 题 · 正确率 ' +
          (s.total ? Math.round((s.got / s.total) * 100) : 0) + '%' +
          (used != null ? ' · 用时 ' + fmtClock(used) : '') +
          (sub.at ? ' · 交卷于 ' + fmtDate(sub.at) : '') + '</span>' +
        '<span class="rpt-grow"></span>' +
        '<button type="button" class="btn btn-sm" id="rRetry">重新作答</button>' +
      '</div>' +
      histHtml +
      '<div class="rpt-trend"><div class="rpt-trend-t">Band 趋势 · 最近 ' +
        Math.min(12, getHist().length) + ' 次</div>' + trendChart() + '</div>' +
      typesHead +
      '<div class="rpt-types">' + types + '</div>' +
      '<div class="rpt-scroll"><table class="rpt-table">' +
        '<thead><tr><th>题号</th><th>我的答案</th><th>正确答案</th><th>对错</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>' +
      '<p class="rpt-hint">答案取自剑桥雅思 17 原书答案页；' +
        '「A 或 B」表示两题答案可互换，两种顺序都算对。点击匹配题所在行可跳到对应段落。</p>' +
      '</div>';
  }

  /* super P0-1：交卷着陆卡——一眼看到成绩，且立刻有两个可点的下一步 */
  function landingHtml() {
    var s = score();
    var band = (s.has && s.total) ? bandOf(s.got) : null;
    var sub = subs[cur.id] || {};
    var at = sub.at ? fmtDate(sub.at) : '';
    return '<div class="r-landing-h">' +
        '<span class="r-landing-tag">上次已交卷</span>' +
        '<b class="r-landing-score">' + (s.has ? s.got + '<i>/' + s.total + '</i>' : '—') + '</b>' +
        (band != null ? '<span class="r-landing-band">预估 Band <b>' + band.toFixed(1) + '</b></span>' : '') +
        (at ? '<span class="r-landing-at">' + esc(at) + '</span>' : '') +
      '</div>' +
      '<p class="r-landing-p">作答已锁定。想再练一遍就点「重做本套」；想看答案点右下「展开回顾」。</p>' +
      '<div class="r-landing-acts">' +
        '<button type="button" class="btn btn-primary btn-sm" id="rLandingRetry" data-icon="reset">重做本套</button>' +
      '</div>';
  }

  function bindReport() {
    var lr = $('#rLandingRetry', el.qs);
    if (lr) lr.addEventListener('click', retry);
    var r = $('#rRetry', el.qs);
    if (r) r.addEventListener('click', retry);
    $$('tr[data-locate]', el.qs).forEach(function (tr) {
      tr.addEventListener('click', function () {
        jumpLocate(parseInt(tr.getAttribute('data-locate'), 10));
      });
    });
  }

  /* ---------------- v14：Band 趋势 + 按题型正确率 ---------------- */
  function getHist() { var h = Store.get('rhist', []); return Array.isArray(h) ? h : []; }

  /* Band 柱状图：时间正序、最近 12 次；空状态明确提示，不画假空图 */
  function trendChart() {
    var hist = getHist();
    if (!hist.length) return '<div class="trend-empty">暂无记录，交卷后自动记录</div>';
    var rec = hist.slice(0, 12).reverse();        /* hist 最新在前，反转成时间正序 */
    var bars = rec.map(function (h) {
      var pct = Math.max(4, Math.min(100, ((h.band || 0) / 9) * 100));
      var d = new Date(h.at);
      var ds = (d.getMonth() + 1) + '/' + d.getDate();
      var band = (typeof h.band === 'number') ? h.band.toFixed(1) : '—';
      return '<div class="tcol">' +
        '<span class="tband">' + band + '</span>' +
        '<div class="tbar" style="height:' + pct.toFixed(1) + '%" ' +
        'title="' + h.got + '/' + h.total + ' · ' + fmtDate(h.at) + '"></div>' +
        '<span class="tdate">' + ds + '</span></div>';
    }).join('');
    return '<div class="trend-chart">' + bars + '</div>';
  }

  /* 按题型正确率：最新一次 vs 历史平均，并排条形 */
  function typeCompare() {
    var hist = getHist();
    if (!hist.length) return '';
    var latest = hist[0];
    /* v18 未结项②：仅 1 次交卷时「平均」= 本次，画两条一样的条形会误导，
     * 平均列改为明示「样本不足」，不做无意义对比 */
    var single = hist.length < 2;
    var agg = {};
    hist.forEach(function (h) {
      if (!h.byType) return;
      Object.keys(h.byType).forEach(function (bk) {
        var t = h.byType[bk];
        if (!agg[bk]) agg[bk] = { sum: 0, n: 0 };
        agg[bk].sum += t.total ? (t.got / t.total) : 0;
        agg[bk].n++;
      });
    });
    var lb = latest.byType || {};
    /* v15 旧账2：最新一次若是旧版记录（无 byType 明细），本次列显示「—」并注明，
     * 不画 0/0 的误导条形；历史平均仍按有明细的记录正常计算 */
    var hasLatest = !!latest.byType;
    var names = Object.keys(agg);
    if (!names.length) return '';
    var rows = names.map(function (bk) {
      var l = lb[bk] || { got: 0, total: 0 };
      var lp = l.total ? Math.round((l.got / l.total) * 100) : 0;
      var ap = Math.round((agg[bk].sum / agg[bk].n) * 100);
      return '<div class="tt-row">' +
        '<span class="tt-name">' + esc(bk) + '</span>' +
        '<div class="tt-cell">' +
          (hasLatest
            ? '<div class="tt-bar tt-latest"><i style="width:' + lp + '%"></i></div>' +
              '<em>本次 ' + l.got + '/' + l.total + ' · ' + lp + '%</em>'
            : '<em title="该次交卷为旧版记录，无题型明细">本次 —（旧版记录）</em>') +
        '</div>' +
        '<div class="tt-cell">' +
          (single
            ? '<em class="tt-single" title="交卷次数不足，暂无法形成有意义的平均值">平均 · 样本不足（仅 ' + hist.length + ' 次交卷）</em>'
            : '<div class="tt-bar tt-avg"><i style="width:' + ap + '%"></i></div>' +
              '<em>平均 ' + ap + '%</em>') +
        '</div>' +
        '</div>';
    }).join('');
    return '<div class="trend-types">' +
      '<div class="tt-head"><span>题型</span><span>最新一次</span>' +
      (single ? '<span>历史平均（样本不足）</span>' : '<span>历史平均</span>') +
      '</div>' + rows + '</div>';
  }

  /* 最新一次各类错题题号（点击跳回原文定位，复用 locateOf/jumpLocate） */
  function wrongList() {
    var hist = getHist();
    if (!hist.length) return '';
    var w = hist[0].wrong || {};
    var names = Object.keys(w).filter(function (bk) { return (w[bk] || []).length; });
    if (!names.length) return '';
    var rows = names.map(function (bk) {
      var chips = w[bk].map(function (no) {
        var loc = locateOf(no);
        return (loc != null)
          ? '<span class="wnum is-loc" data-locate="' + loc + '" title="点击定位到原文">' + no + '</span>'
          : '<span class="wnum">' + no + '</span>';
      }).join('');
      return '<div class="wrow"><span class="wname">' + esc(bk) + '</span><span class="wnums">' + chips + '</span></div>';
    }).join('');
    return '<div class="trend-wrong"><div class="tw-title">本次错题题号 · 点击定位原文</div>' + rows + '</div>';
  }

  /* 交卷记录列表 */
  function histList() {
    var hist = getHist();
    if (!hist.length) return '';
    var rows = hist.slice(0, 20).map(function (h) {
      return '<div class="hl-row"><span class="hl-date">' + fmtDate(h.at) + '</span>' +
        '<span class="hl-score">' + h.got + ' / ' + h.total + '</span>' +
        '<span class="hl-band">Band ' + ((typeof h.band === 'number') ? h.band.toFixed(1) : '—') + '</span></div>';
    }).join('');
    return '<div class="trend-hist"><div class="th-title">交卷记录 · 最近 ' + Math.min(20, hist.length) + ' 次</div>' + rows + '</div>';
  }

  function renderTrend() {
    if (!el.trendBody) return;
    el.trendBody.innerHTML = buildTrendHTML();
    bindLocateClicks(el.trendBody, function (loc) { jumpLocate(loc); });
  }

  /* v16：「我的」抽屉复用同一套趋势渲染（HTML 生成 + 定位绑定）。
   * opts.onLocate 可覆盖定位行为（抽屉里点击错题题号：先回阅读视图再定位）；
   * 不传则与阅读模块内行为完全一致。 */
  function renderTrendInto(host, opts) {
    if (!host) return;
    host.innerHTML = buildTrendHTML();
    bindLocateClicks(host, function (loc) {
      if (opts && typeof opts.onLocate === 'function') { opts.onLocate(loc); return; }
      jumpLocate(loc);
    });
  }

  /* 趋势 HTML 生成（renderTrend 与「我的」抽屉共用，保证两处渲染完全一致） */
  function buildTrendHTML() {
    return '<div class="trend-sec"><div class="trend-sec-t">Band 趋势</div>' + trendChart() + '</div>' +
      typeCompare() + wrongList() + histList();
  }

  /* 错题题号点击 → 定位（root 限定作用域，避免重复绑定） */
  function bindLocateClicks(root, fn) {
    $$('.wnum.is-loc', root).forEach(function (n) {
      n.addEventListener('click', function () {
        fn(parseInt(n.getAttribute('data-locate'), 10));
      });
    });
  }

  function bindTrend() {
    if (el.btnTrend) el.btnTrend.addEventListener('click', function () {
      var open = el.trend.hasAttribute('hidden');
      if (open) {
        el.trend.removeAttribute('hidden');
        renderTrend();
        el.btnTrend.classList.add('is-active');
      } else {
        el.trend.setAttribute('hidden', '');
        el.btnTrend.classList.remove('is-active');
      }
    });
    if (el.btnTrendClose) el.btnTrendClose.addEventListener('click', function () {
      el.trend.setAttribute('hidden', '');
      if (el.btnTrend) el.btnTrend.classList.remove('is-active');
    });
  }

  /* ---------------- 划词高亮（P2-1） ---------------- */
  var hlBar = null;

  function ensureHlBar() {
    if (hlBar && hlBar.parentNode) return hlBar;
    var bar = document.createElement('div');
    bar.className = 'hl-bar';
    bar.setAttribute('hidden', '');
    bar.innerHTML =
      '<button type="button" class="hl-sw hl-y" data-c="y" title="黄色高亮" aria-label="黄色高亮"></button>' +
      '<button type="button" class="hl-sw hl-g" data-c="g" title="绿色高亮" aria-label="绿色高亮"></button>' +
      '<button type="button" class="hl-sw hl-p" data-c="p" title="粉色高亮" aria-label="粉色高亮"></button>' +
      '<span class="hl-sep"></span>' +
      '<button type="button" class="hl-x" data-c="none">清除</button>';
    document.body.appendChild(bar);
    bar.addEventListener('mousedown', function (e) { e.preventDefault(); });
    bar.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-c]') : null;
      if (!b || !sel) return;
      e.preventDefault();
      applyHl(sel.pid, sel.s, sel.e, b.getAttribute('data-c'));
      hideHlBar();
    });
    hlBar = bar;
    return bar;
  }

  function bindHighlight() {
    if (!el.article) return;

    /* 立刻读一次当前选区；部分浏览器要到 mouseup 之后才把选区定下来，
       所以第一次拿不到时再延后 10ms 重试一次（而不是无脑延时，避免卡顿感）。 */
    function collect() {
      var s = window.getSelection && window.getSelection();
      if (!s || s.isCollapsed || !s.rangeCount) return false;
      var range = s.getRangeAt(0);
      var a = nodeToPara(range.startContainer);
      var b = nodeToPara(range.endContainer);
      if (!a || a !== b) return false;                /* 仅支持段内选择 */
      var st = offsetIn(a, range.startContainer, range.startOffset);
      var en = offsetIn(a, range.endContainer, range.endOffset);
      if (st < 0 || en <= st) return false;
      sel = { pid: parseInt(a.dataset.pid, 10), s: st, e: en };
      /* Range.getBoundingClientRect 在少数环境里不存在，兜底到屏幕中部 */
      var rect = null;
      try {
        if (typeof range.getBoundingClientRect === 'function') rect = range.getBoundingClientRect();
      } catch (err) { rect = null; }
      showHlBar(rect || { top: 140, bottom: 160, left: window.innerWidth / 2, width: 0 });
      return true;
    }

    var handler = function () {
      if (collect()) return;
      hideHlBar();
      setTimeout(function () { collect(); }, 10);
    };
    el.article.addEventListener('mouseup', handler);
    el.article.addEventListener('touchend', handler);
    document.addEventListener('mousedown', function (e) {
      if (hlBar && !hlBar.hidden && !hlBar.contains(e.target)) hideHlBar();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideHlBar();
    });
  }

  function nodeToPara(node) {
    if (!node) return null;
    var n = node.nodeType === 1 ? node : node.parentNode;
    if (!n || !n.closest) return null;
    var p = n.closest('p[data-pid]');
    return p && el.article.contains(p) ? p : null;
  }

  function offsetIn(host, node, off) {
    try {
      var r = document.createRange();
      r.selectNodeContents(host);
      r.setEnd(node, off);
      return r.toString().length;
    } catch (e) { return -1; }
  }

  function showHlBar(rect) {
    var bar = ensureHlBar();
    bar.removeAttribute('hidden');
    var top = rect.top - 46;
    if (top < 8) top = rect.bottom + 10;
    var left = rect.left + rect.width / 2;
    bar.style.top = Math.max(8, top) + 'px';
    bar.style.left = Math.min(window.innerWidth - 20, Math.max(20, left)) + 'px';
  }

  function hideHlBar() {
    if (hlBar) hlBar.setAttribute('hidden', '');
    sel = null;
  }

  function applyHl(pid, s, e, color) {
    var list = hl[cur.id] || (hl[cur.id] = []);
    /* 先移除与之重叠的旧高亮（含完全相同区间） */
    list = list.filter(function (h) {
      if (h.pid !== pid) return true;
      return h.e <= s || h.s >= e;
    });
    if (color !== 'none') list.push({ pid: pid, s: s, e: e, c: color });
    hl[cur.id] = list;
    Store.set('rhl', hl);
    renderArticle();
    var ss = window.getSelection && window.getSelection();
    if (ss && ss.removeAllRanges) { try { ss.removeAllRanges(); } catch (err) {} }
    toast(color === 'none' ? '已清除该段高亮' : '已高亮 · 随本套作答一起保存');
  }

  /* v16：「我的」抽屉成绩趋势区复用（renderTrendInto）+ 错题题号定位（locate） */
  return { init: init, renderTrendInto: renderTrendInto, locate: jumpLocate, refreshHud: refreshHud };
})();
