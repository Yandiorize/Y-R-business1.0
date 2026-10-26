/* ============================================================
 *  Writing 模块 —— 雅思学术类机考写作还原
 *  左：题面（剑桥雅思真题）  右：作答区
 *  Task 1 = 20 分钟 / Task 2 = 40 分钟，倒计时可独立切换与运行
 *  ---------------------------------------------------------------
 *  本次修改点：
 *    1) 计时器改为复用新增的可复用组件 UI.Timer（每道题一个实例），
 *       原有「按题独立计时 + 切换保留 + 墙钟续算 + 本地持久化」行为不变；
 *    2) 按钮文案改用 setBtnText()，避免覆盖注入的线性图标；
 *    3) 计时条 DOM 由 .timer-bar 统一为组件类 .bar。
 *  本次修改点（综合修订）：
 *    4) BUG-1 「清空」按钮改用 UI.Confirm 自定义二次确认弹层（原生 confirm
 *       在受限环境恒返回 false，导致按钮点了没反应）。
 *    5) P1-2 字数条未达标时数字转红并显示「还差 N 词」，达标转绿；
 *       #editor 开启原生拼写检查（spellcheck="true" lang="en"）；
 *       新增衔接词 / 逻辑连接词出现次数统计面板（#cohBox / #cohList）。
 *    6) 空状态：历史记录为空时给出引导按钮，不再只显示一行灰字。
 *  影响范围：仅本模块；localStorage 中的 drafts / history / timers 键结构未变。
 * ============================================================ */
window.Writing = (function () {
  'use strict';

  var P = window.IELTS_PROMPTS;
  var el = {};
  var cur = null;                 // 当前题目
  var ui = { task: 2, book: '剑17', test: 'Test 1' };   /* super：默认进 Task 2（四段提纲可见） */
  var saveTimer = null;

  /* ---------------- 初始化 ---------------- */
  function init() {
    el = {
      taskSeg: $('#taskSeg'), taskThumb: $('#taskThumb'),
      btnRandom: $('#btnRandom'),
      selBook: $('#selBook'), selTest: $('#selTest'),
      timer: $('#timer'), timerNum: $('#timerNum'), timerFill: $('#timerFill'),
      btnTimer: $('#btnTimer'), btnReset: $('#btnReset'),
      btnHistory: $('#btnHistory'), histCount: $('#histCount'),
      qTags: $('#qTags'), qTitle: $('#qTitle'), qMeta: $('#qMeta'),
      qChart: $('#qChart'), qImg: $('#qImg'),
      qLead: $('#qLead'), qStem: $('#qStem'), qAsk: $('#qAsk'), qInst: $('#qInst'),
      outline: $('#wOutline'),
      editor: $('#editor'), wcNum: $('#wcNum'), wcTarget: $('#wcTarget'),
      wcBar: $('#wcBar'), wcFill: $('#wcFill'), wcNote: $('#wcNote'), wcCohTotal: $('#wcCohTotal'),
      cohBox: $('#cohBox'), cohTotal: $('#cohTotal'), cohList: $('#cohList'),
      saveState: $('#saveState'), draftTime: $('#draftTime'),
      btnSave: $('#btnSave'), btnClear: $('#btnClear'), btnCopy: $('#btnCopy'),
      drawer: $('#drawer'), histList: $('#histList'), histChip: $('#histChip'),
      btnExportAll: $('#btnExportAll'),
      lightbox: $('#lightbox'), lbImg: $('#lbImg'), lbClose: $('#lbClose')
    };

    timers = {};
    states = Store.get('timers', {});
    var savedUi = Store.get('ui', null);
    if (savedUi && savedUi.book) ui = savedUi;

    buildSelects();
    bindSeg(el.taskSeg, el.taskThumb, function (b) {
      ui.task = parseInt(b.dataset.task, 10);
      selectPrompt(findPrompt(ui.book, ui.test, ui.task));
    });

    el.selBook.addEventListener('change', function () {
      var prevBook = ui.book, prevTest = ui.test;
      ui.book = el.selBook.value;
      rebuildTests();
      var p = findPrompt(ui.book, ui.test, ui.task);
      if (!p) {
        ui.book = prevBook; ui.test = prevTest;
        el.selBook.value = prevBook; rebuildTests();
        toast('这套还没录入，先换一套试试', 2600);
        return;
      }
      selectPrompt(p);
    });
    el.selTest.addEventListener('change', function () {
      var prevTest = ui.test;
      ui.test = el.selTest.value;
      var p = findPrompt(ui.book, ui.test, ui.task);
      if (!p) {
        ui.test = prevTest; el.selTest.value = prevTest;
        toast('这套还没录入，先换一套试试', 2600);
        return;
      }
      selectPrompt(p);
    });
    el.btnRandom.addEventListener('click', randomPrompt);

    el.btnTimer.addEventListener('click', toggleTimer);
    el.btnReset.addEventListener('click', resetTimer);

    el.editor.addEventListener('input', onInput);
    el.btnSave.addEventListener('click', saveRecord);
    el.btnClear.addEventListener('click', clearDraft);
    el.btnCopy.addEventListener('click', function () {
      var t = el.editor.value;
      if (!t.trim()) { toast('作答区还是空的'); return; }
      copyText(t);
    });

    el.btnHistory.addEventListener('click', openDrawer);
    $$('[data-close]', el.drawer).forEach(function (n) {
      n.addEventListener('click', closeDrawer);
    });
    el.btnExportAll.addEventListener('click', exportAll);

    el.qChart.addEventListener('click', function () {
      el.lbImg.src = el.qImg.src;
      el.lightbox.classList.add('is-open');
    });
    el.lbClose.addEventListener('click', function () { el.lightbox.classList.remove('is-open'); });
    el.lightbox.addEventListener('click', function (e) {
      if (e.target === el.lightbox) el.lightbox.classList.remove('is-open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') el.lightbox.classList.remove('is-open');
    });

    selectPrompt(findPrompt(ui.book, ui.test, ui.task) || P[0]);
    renderHistoryCount();

    var tickCount = 0;
    UI.startTicker(function () {
      renderTimer();
      if (++tickCount % 20 === 0) persistTimers();
    });
    window.addEventListener('beforeunload', function () { flushDraft(true); persistTimers(); });
  }

  /* ---------------- 题库选择 ---------------- */
  function books() {
    var seen = [], out = [];
    P.forEach(function (p) { if (seen.indexOf(p.book) < 0) { seen.push(p.book); out.push(p.book); } });
    return out;
  }

  function findPrompt(book, test, task) {
    for (var i = 0; i < P.length; i++) {
      if (P[i].book === book && P[i].test === test && P[i].task === task) return P[i];
    }
    return null;
  }

  /* super 补丁：选择器写明题量；没有题目的套置灰（暂未录入），
     点灰项给明确提示而不是跳空白。 */
  function countOf(book, test, task) {
    var n = 0;
    for (var i = 0; i < P.length; i++) {
      if (P[i].book === book && (!test || P[i].test === test) && (!task || P[i].task === task)) n++;
    }
    return n;
  }
  function rebuildTests() {
    el.selTest.innerHTML = ['Test 1', 'Test 2', 'Test 3', 'Test 4'].map(function (t) {
      var n = countOf(ui.book, t, null);
      return '<option value="' + t + '"' + (n ? '' : ' disabled') + '>' +
        t + (n ? '' : '（暂未录入）') + '</option>';
    }).join('');
    el.selTest.value = ui.test;
  }
  function buildSelects() {
    el.selBook.innerHTML = books().map(function (b) {
      var n = countOf(b, null, null);
      return '<option value="' + b + '"' + (n ? '' : ' disabled') + '>' +
        b + (n ? '（' + n + ' 题）' : '（暂未录入）') + '</option>';
    }).join('');
    el.selBook.value = ui.book;
    rebuildTests();
  }

  function randomPrompt() {
    var pool = P.filter(function (p) { return p.task === ui.task; });
    var pick = pool[Math.floor(Math.random() * pool.length)];
    ui.book = pick.book; ui.test = pick.test;
    el.selBook.value = ui.book; el.selTest.value = ui.test;
    selectPrompt(pick);
    toast('已随机抽取：' + pick.book + ' ' + pick.test + ' · Task ' + pick.task);
  }

  function selectPrompt(p) {
    if (!p) return;
    flushDraft(true);
    cur = p;
    ui.task = p.task; ui.book = p.book; ui.test = p.test;
    Store.set('ui', ui);
    el.selBook.value = p.book;
    el.selTest.value = p.test;
    $$('.seg-btn', el.taskSeg).forEach(function (b) {
      b.classList.toggle('is-active', parseInt(b.dataset.task, 10) === p.task);
    });
    syncSegThumb(el.taskSeg, el.taskThumb);

    // 题面
    el.qTags.innerHTML = [
      '<span class="tag tag-accent">' + esc(p.book) + '</span>',
      '<span class="tag">' + esc(p.test) + '</span>',
      '<span class="tag">Writing Task ' + p.task + '</span>',
      '<span class="tag">' + esc(p.kind) + '</span>'
    ].join('');
    el.qTitle.textContent = 'Writing Task ' + p.task + (p.task === 1 ? ' · 图表描述' : ' · 议论文');
    el.qMeta.textContent = p.bookFull + ' · 建议用时 ' + p.minutes + ' 分钟 · 最少 ' + p.minWords + ' 词';

    if (p.chart) {
      el.qChart.hidden = false;
      el.qImg.src = p.chart;
      el.qImg.alt = p.book + ' ' + p.test + ' Writing Task 1 图表';
    } else {
      el.qChart.hidden = true;
      el.qImg.removeAttribute('src');
    }

    el.qLead.textContent = 'You should spend about ' + p.minutes + ' minutes on this task.' +
      (p.task === 2 ? ' Write about the following topic:' : '');
    el.qStem.textContent = p.stem;
    el.qAsk.textContent = p.question || '';
    el.qAsk.hidden = !p.question;
    /* super P0-6：只有 Task 2 显示提纲（Task 1 有图表，左栏不空） */
    if (el.outline) el.outline.hidden = Number(p.task) !== 2;
    el.qInst.textContent = p.instruction + ' Write at least ' + p.minWords + ' words.';

    // 作答区
    var draft = Store.get('drafts', {})[p.id];
    el.editor.value = draft ? draft.text : '';
    el.wcTarget.textContent = p.minWords;
    updateWordCount();
    if (draft && draft.updatedAt) {
      el.draftTime.textContent = '上次保存 ' + fmtAgo(draft.updatedAt);
    } else {
      el.draftTime.textContent = '尚未保存过草稿';
    }
    el.saveState.classList.remove('is-saving');
    /* v38：无草稿时说实话（此前无条件写“草稿已同步”，与“尚未保存过草稿”矛盾） */
    var draftTxt = typeof draft === 'string' ? draft : (draft && draft.text) || '';
    el.saveState.textContent = (typeof draftTxt === 'string' && draftTxt.trim()) ? '草稿已同步' : '暂无草稿';

    ensureTimer(p);
    renderTimer();
    /* v11：换题即新的一轮——本任务计时进行中才进全屏，只写草稿不进 */
    if (window.ExamShell) {
      var _t = curTimer();
      if (_t && _t.started() && _t.remaining() > 0) ExamShell.enter('writing', true);
      else ExamShell.clear();
    }
  }

  /* ---------------- 计时器（复用 UI.Timer 组件，每题一个实例） ---------------- */
  var states = {};                   // promptId -> 序列化状态（来自 UI.Timer.state()）
  var timers = {};                   // promptId -> UI.Timer 实例
  var warnedW = {};                   // v18 0.11：10 分钟 / 1 分钟各提醒一次

  function ensureTimer(p) {
    if (!timers[p.id]) {
      timers[p.id] = UI.Timer({
        total: p.minutes * 60,
        onFinish: function () {
          if (cur && p.id === cur.id) {
            el.timer.classList.add('is-done');
            toast('时间到 · Task ' + p.task + ' 结束', 3200);
          }
        }
      });
      timers[p.id].restore(states[p.id]);
    }
    timers[p.id].setTotal(p.minutes * 60);
    return timers[p.id];
  }

  function curTimer() { return cur ? timers[cur.id] : null; }

  function toggleTimer() {
    var t = curTimer();
    if (!t) return;
    if (t.remaining() <= 0) { toast('本任务时间已用完，可点击「重置」重新开始'); return; }
    var running = t.toggle();
    persistTimers();
    renderTimer();
    /* v11：显式开始计时 = 进入作答全屏（force；暂停仍保持全屏，只退出/换题摘掉） */
    if (window.ExamShell) ExamShell.enter('writing', true);
    toast(running ? '计时开始 · ' + cur.minutes + ' 分钟' : '已暂停');
  }

  function resetTimer() {
    var t = curTimer();
    if (!t) return;
    t.reset();
    el.timer.classList.remove('is-done');
    persistTimers();
    renderTimer();
    toast('计时已重置为 ' + cur.minutes + ':00');
  }

  function renderTimer() {
    var t = curTimer();
    if (!t) return;
    /* v18 0.11：与阅读同一套考试提醒（10 分钟 / 1 分钟各一次） */
    var remW = t.remaining();
    if (cur && t.started() && remW > 0) {
      if (remW <= 600 && !warnedW[cur.id + ':10']) { warnedW[cur.id + ':10'] = 1; toast('剩余 10 分钟', 3000); }
      if (remW <= 60 && !warnedW[cur.id + ':1']) { warnedW[cur.id + ':1'] = 1; toast('剩余 1 分钟 · 请尽快收尾', 3600); }
    }
    el.timerNum.textContent = fmtClock(t.remaining());
    var pct = t.total() ? (t.remaining() / t.total()) * 100 : 0;
    el.timerFill.style.width = pct.toFixed(2) + '%';
    el.timer.classList.toggle('is-low', t.remaining() > 0 && t.remaining() <= 60);
    if (t.remaining() > 0) el.timer.classList.remove('is-done');
    setBtnText(el.btnTimer, t.running() ? '暂停'
      : (t.started() && t.remaining() > 0 ? '继续' : '开始计时'));
  }

  function persistTimers() {
    Object.keys(timers).forEach(function (id) { states[id] = timers[id].state(); });
    Store.set('timers', states);
  }

  /* ---------------- 作答与草稿 ---------------- */
  function onInput() {
    updateWordCount();
    el.saveState.classList.add('is-saving');
    el.saveState.textContent = '保存中…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { flushDraft(); }, 600);
    /* v11：编辑器输入即进入作答全屏（连续触发：退出后不再自动重进） */
    if (window.ExamShell) ExamShell.enter('writing');
  }

  function flushDraft(silent) {
    if (!cur) return;
    var drafts = Store.get('drafts', {});
    drafts[cur.id] = { text: el.editor.value, updatedAt: Date.now() };
    Store.set('drafts', drafts);
    if (!silent) {
      el.saveState.classList.remove('is-saving');
      el.saveState.textContent = '草稿已同步';
      el.draftTime.textContent = '上次保存 刚刚';
    }
  }

  /* ---------------- 字数统计与达标提示（P1-2） ---------------- */
  function updateWordCount() {
    var n = countWords(el.editor.value);
    var target = cur ? cur.minWords : 150;
    el.wcNum.textContent = n;
    var pct = Math.min(100, (n / target) * 100);
    el.wcFill.style.width = pct.toFixed(1) + '%';
    var hit = n >= target;
    el.wcBar.classList.toggle('is-hit', hit);

    /* 未达标：数字转红 + 明确「还差 N 词」；达标：转绿 + 打勾 */
    var wc = el.wcBar.parentNode;
    wc.classList.toggle('is-short', n > 0 && !hit);
    wc.classList.toggle('is-hit', hit);
    if (el.wcNote) {
      if (!n) {
        el.wcNote.textContent = '最少 ' + target + ' 词，开始作答后这里会提示还差多少';
        el.wcNote.className = 'wc-note';
      } else if (!hit) {
        el.wcNote.textContent = '还差 ' + (target - n) + ' 词才达到最低字数要求';
        el.wcNote.className = 'wc-note is-short';
      } else {
        el.wcNote.textContent = '已达标 ✓ 共 ' + n + ' 词，超出 ' + (n - target) + ' 词';
        el.wcNote.className = 'wc-note is-hit';
      }
    }
    renderCohesion();
  }

  /* ---------------- 衔接词统计（P1-2） ---------------- */
  var LINKERS = [
    'in addition', 'in contrast', 'on the other hand', 'as a result', 'for example',
    'for instance', 'in conclusion', 'to conclude', 'in particular', 'in other words',
    'in spite of', 'due to', 'in terms of', 'not only', 'more importantly',
    'firstly', 'secondly', 'thirdly', 'finally', 'overall', 'however', 'moreover',
    'furthermore', 'additionally', 'therefore', 'thus', 'consequently', 'nevertheless',
    'nonetheless', 'whereas', 'although', 'though', 'while', 'because', 'since',
    'despite', 'similarly', 'likewise', 'meanwhile', 'subsequently', 'accordingly',
    'hence', 'that is', 'as well as', 'besides', 'instead', 'otherwise'
  ];

  function countLinker(text, phrase) {
    var esc2 = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var re = new RegExp('\\b' + esc2.replace(/\s+/g, '\\s+') + '\\b', 'gi');
    var m = text.match(re);
    return m ? m.length : 0;
  }

  function renderCohesion() {
    if (!el.cohBox) return;
    var text = el.editor.value || '';
    var found = [];
    var total = 0;
    LINKERS.forEach(function (w) {
      var c = countLinker(text, w);
      if (c) { found.push({ w: w, c: c }); total += c; }
    });
    found.sort(function (a, b) { return b.c - a.c || a.w.localeCompare(b.w); });
    /* v38：字数条内计数常驻（空编辑器也写 0，不留旧数）；明细面板仍空时隐藏 */
    if (el.wcCohTotal) el.wcCohTotal.textContent = total;
    if (!text.trim()) { el.cohBox.hidden = true; return; }
    el.cohBox.hidden = false;
    el.cohTotal.textContent = total;
    el.cohList.innerHTML = found.length
      ? found.slice(0, 14).map(function (f) {
          return '<span class="coh-chip">' + esc(f.w) +
            '<b>×' + f.c + '</b></span>';
        }).join('')
      : '<span class="coh-none">还没有出现衔接词 —— 试着用 however / moreover / ' +
        'for example / in contrast 把句子串起来</span>';
  }

  function clearDraft() {
    if (!el.editor.value) { toast('作答区已经是空的'); return; }
    UI.Confirm({
      title: '清空作答区',
      text: '确定要清空吗？此操作不可恢复。',
      ok: '确定清空'
    }, function (yes) {
      if (!yes) return;
      el.editor.value = '';
      updateWordCount();
      flushDraft();
      toast('已清空作答区');
    });
  }

  /* ---------------- 历史记录 ---------------- */
  function elapsedSec() {
    var t = curTimer();
    if (!t) return null;
    if (!t.started()) return null;
    return Math.round(t.total() - t.remaining());
  }

  function saveRecord() {
    flushDraft(true);
    var text = el.editor.value;
    if (!text.trim()) { toast('还没有任何内容可以保存'); return; }
    var list = Store.get('history', []);
    list.unshift({
      id: 'r' + Date.now() + Math.floor(Math.random() * 1000),
      promptId: cur.id,
      book: cur.book, test: cur.test, task: cur.task, kind: cur.kind,
      stem: cur.stem,
      words: countWords(text),
      target: cur.minWords,
      text: text,
      elapsed: elapsedSec(),
      createdAt: Date.now()
    });
    if (list.length > 200) list = list.slice(0, 200);
    Store.set('history', list);
    renderHistoryCount();
    el.draftTime.textContent = '上次保存 刚刚';
    toast('已存入历史记录 · ' + countWords(text) + ' 词');
    if (el.drawer.classList.contains('is-open')) renderHistory();
  }

  function renderHistoryCount() {
    var n = (Store.get('history', [])).length;
    el.histCount.textContent = n;
    el.histChip.textContent = n + ' 条';
  }

  function openDrawer() {
    renderHistory();
    el.drawer.classList.add('is-open');
  }
  function closeDrawer() { el.drawer.classList.remove('is-open'); }

  function renderHistory() {
    var list = Store.get('history', []);
    if (!list.length) {
      UI.Empty(el.histList, 'doc', '还没有保存过作答',
        '写完一段后点「保存本次作答」，或直接点下方按钮把当前草稿存一条',
        {
          label: '保存当前作答',
          onClick: function () { saveRecord(); }
        });
      return;
    }
    el.histList.innerHTML = list.map(function (r) {
      var dur = r.elapsed == null ? '未计时' : fmtClock(r.elapsed);
      var hit = r.words >= (r.target || 0);
      return '<div class="hist-item" data-id="' + r.id + '">' +
        '<div class="hist-top">' +
          '<span class="tag tag-accent">' + esc(r.book) + '</span>' +
          '<span class="tag">' + esc(r.test) + ' · Task ' + r.task + '</span>' +
          '<span class="tag">' + r.words + ' 词</span>' +
          (hit ? '' : '<span class="tag" style="color:var(--warn);border-color:rgba(224,144,43,.35)">未达 ' + r.target + ' 词</span>') +
          '<span class="hist-when">' + fmtDate(r.createdAt) + ' · 用时 ' + dur + '</span>' +
        '</div>' +
        '<div class="hist-pre">' + esc(r.text) + '</div>' +
        '<div class="hist-acts">' +
          '<button class="btn btn-sm" data-act="load">载入到作答区</button>' +
          '<button class="btn btn-ghost btn-sm" data-act="view">查看全文</button>' +
          '<button class="btn btn-ghost btn-sm" data-act="copy">复制</button>' +
          '<button class="btn btn-ghost btn-sm btn-danger" data-act="del">删除</button>' +
        '</div>' +
      '</div>';
    }).join('');

    $$('.hist-item', el.histList).forEach(function (item) {
      var id = item.dataset.id;
      $$('button[data-act]', item).forEach(function (b) {
        b.addEventListener('click', function () {
          var rec = Store.get('history', []).filter(function (x) { return x.id === id; })[0];
          if (!rec) return;
          var act = b.dataset.act;
          if (act === 'load') loadRecord(rec);
          else if (act === 'copy') copyText(rec.text);
          else if (act === 'view') viewRecord(rec);
          else if (act === 'del') deleteRecord(id);
        });
      });
    });
  }

  function loadRecord(rec) {
    var p = P.filter(function (x) { return x.id === rec.promptId; })[0];
    if (p) {
      ui.book = p.book; ui.test = p.test; ui.task = p.task;
      selectPrompt(p);
    }
    el.editor.value = rec.text;
    updateWordCount();
    flushDraft();
    closeDrawer();
    toast('已载入：' + rec.book + ' ' + rec.test + ' · Task ' + rec.task);
    el.editor.focus();
  }

  function viewRecord(rec) {
    var w = window.open('', '_blank', 'width=760,height=760');
    if (!w) { toast('浏览器阻止了弹窗，请用「载入到作答区」查看'); return; }
    var body = '<!doctype html><meta charset="utf-8"><title>' + rec.book + ' ' + rec.test + ' Task ' + rec.task + '</title>' +
      '<style>body{font:15px/1.8 -apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;' +
      'max-width:760px;margin:40px auto;padding:0 24px;color:#161c2e}' +
      'h1{font-size:18px;margin:0 0 4px}.m{color:#838da6;font-size:13px;margin-bottom:18px}' +
      '.q{background:#f4f7ff;border-left:3px solid #4f6ef7;padding:12px 14px;border-radius:8px;' +
      'font-size:13.5px;color:#3a4258;margin-bottom:20px;white-space:pre-wrap}' +
      '.a{white-space:pre-wrap;font-size:15.5px}</style>' +
      '<h1>' + rec.book + ' · ' + rec.test + ' · Writing Task ' + rec.task + '</h1>' +
      '<div class="m">' + fmtDate(rec.createdAt) + ' · ' + rec.words + ' 词 · 用时 ' +
        (rec.elapsed == null ? '未计时' : fmtClock(rec.elapsed)) + '</div>' +
      '<div class="q">' + esc(rec.stem) + '</div>' +
      '<div class="a">' + esc(rec.text) + '</div>';
    w.document.write(body);
    w.document.close();
  }

  function deleteRecord(id) {
    var list = Store.get('history', []).filter(function (x) { return x.id !== id; });
    Store.set('history', list);
    renderHistoryCount();
    renderHistory();
    toast('已删除该条记录');
  }

  function exportAll() {
    var list = Store.get('history', []);
    if (!list.length) { toast('暂无记录可导出'); return; }
    var parts = list.map(function (r, i) {
      return '【' + (i + 1) + '】' + r.book + ' · ' + r.test + ' · Writing Task ' + r.task +
        '\n时间：' + fmtDate(r.createdAt) +
        '\n字数：' + r.words + ' / 要求 ' + r.target +
        '\n用时：' + (r.elapsed == null ? '未计时' : fmtClock(r.elapsed)) +
        '\n题目：' + r.stem +
        '\n作答：\n' + r.text + '\n' +
        '\n----------------------------------------\n';
    });
    var head = (window.Brand && Brand.exportHeader) ? Brand.exportHeader() : '';
    download('IELTS写作作答记录.txt', head + parts.join('\n'), 'text/plain');
    toast('已导出 ' + list.length + ' 条记录');
  }

  function download(name, content, mime) {
    var blob = new Blob([content], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  /* v11：切回计时进行中的写作题时恢复作答全屏（仅写草稿不进） */
  function wantsFullscreen() {
    var t = curTimer();
    return !!(t && t.started() && t.remaining() > 0);
  }

  return { init: init, wantsFullscreen: wantsFullscreen };
})();
