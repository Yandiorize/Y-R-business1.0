/* ============================================================
 *  听力模块 · Listening
 *  ---------------------------------------------------------------
 *  · 播放：优先 audio 文件（若数据里配置了 mp3），否则用浏览器系统语音
 *    逐句朗读；进度条与「当前句」文本随朗读同步。
 *  · 作答：笔记填空（10 题），复用阅读的交互模式。
 *  · 交卷：二次确认 → 锁定 → 逐题对照表 + 听力 Band（按题量折算 40 分制）。
 *  · 数据：answers / submitted 走 Store，与其他模块一致。
 * ============================================================ */
window.Listening = (function () {
  'use strict';

  var DATA = window.IELTS_LISTENING || [];
  var el = {};
  var cur = null;
  var answers = {};
  var subs = {};
  var L = { playing: false, done: false, idx: 0, started: false, retry: 0, utt: null, audio: null, wd: null, stuck: null, gap: null, ended: false, silent: null, voiceUnlocked: false };

  /* ---------------- 初始化 ---------------- */
  function init() {
    el = {
      sel: $('#lSelTest'), chip: $('#lChip'), meta: $('#lMeta'), prog: $('#lProg'),
      qs: $('#lQuestions'), play: $('#lBtnPlay'), pause: $('#lBtnPause'),
      replay: $('#lBtnReplay'),
      reset: $('#lBtnReset'), submit: $('#lBtnSubmit'), now: $('#lNow'), fill: $('#lFill'),
      cur: $('#lCur'), dur: $('#lDur'), transcript: $('#lTranscript'),
      /* v18 0.1/0.5：顶栏考试 HUD 的题号胶囊与交卷（听力交卷主入口在顶栏） */
      qnavPill: $('#qnavPill'), submitTop: $('#lBtnSubmitTop'),
      nav: $('#lNav'), navFold: $('#lNavFold'),
      timer: $('#lTimer'), timerNum: $('#lTimerNum'), timerFill: $('#lTimerFill')
    };
    if (!DATA.length || !el.qs) return;

    answers = Store.get('lanswers', {}) || {};
    subs = Store.get('lsubmitted', {}) || {};

    el.sel.innerHTML = DATA.map(function (t) {
      return '<option value="' + t.id + '">' + t.book + ' · ' + t.test + ' · ' + t.section + '</option>';
    }).join('');

    el.sel.addEventListener('change', function () { load(el.sel.value); });
    el.play.addEventListener('click', togglePlay);
    /* v15 旧账4：独立「暂停」按钮（播放中出现，点了保留当前句可续播） */
    if (el.pause) el.pause.addEventListener('click', pause);
    if (el.replay) el.replay.addEventListener('click', replay);
    el.reset.addEventListener('click', resetAll);
    el.submit.addEventListener('click', function () { submit(false); });
    /* v18 0.1：顶栏交卷与工具栏交卷同一 submit（双入口同行为）。
       可见性由父级 #examHud 控制，故移除 hidden（.btn 的 class display
       会压过 UA [hidden]，等同特异性下作者样式赢） */
    if (el.submitTop) {
      el.submitTop.hidden = false;
      el.submitTop.addEventListener('click', function () { submit(false); });
    }
    /* v18 0.1：题号胶囊点击 → 平滑滚动到题目栏（同上移除 hidden） */
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
        var q = $('#lQuestions');
        if (q && q.scrollIntoView) q.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    /* v15 0.6：失败提示本身可点 = 一键重试当前句 */
    if (el.now) el.now.addEventListener('click', function () {
      if (el.now.classList.contains('is-fail')) startPlay(L.idx || 0, true);
    });
    document.addEventListener('visibilitychange', onVisibility);

    var last = Store.get('ltest', null);
    load(DATA.some(function (t) { return t.id === last; }) ? last : DATA[0].id);
    initTimer();
  }

  function load(id) {
    stopAudio();
    cur = DATA.filter(function (t) { return t.id === id; })[0] || DATA[0];
    el.sel.value = cur.id;
    Store.set('ltest', cur.id);
    if (!answers[cur.id]) answers[cur.id] = {};
    el.chip.textContent = '共 ' + totalNos() + ' 题';
    el.meta.textContent = cur.meta || '';
    renderQuestions();
    renderProg();
    renderTranscript();
    highlightSeg(-1);
    el.now.classList.remove('is-fail');
    el.now.textContent = '点击「播放」开始';
    el.now.classList.remove('is-live');
    setPlayLabel('播放');
    /* v11：换题即新的一轮——进行中的卷子进全屏，未开始的不进 */
    if (window.ExamShell) {
      if (!isSubmitted() && ((ltimer && ltimer.started()) || answeredCount() > 0)) ExamShell.enter('listening', true);
      else ExamShell.clear();
    }
  }

  /* ---------------- P2-9 听力考试计时（30 分钟） ----------------
   * 雅思听力 30 分钟；首次点「播放」即开考（此前为练习态，不计时）。
   * 到 0 自动交卷（不再弹确认，避免时间到了还被对话框卡住）；
   * 手动交卷仍走未答满确认。计时按题源持久化，刷新不丢。 */
  var ltimer = null;
  function fmtRem(sec) {
    sec = Math.max(0, Math.ceil(sec));
    var m = Math.floor(sec / 60), s2 = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s2 < 10 ? '0' : '') + s2;
  }
  function renderLTimer() {
    if (!ltimer || !el.timerNum) return;
    var rem = Math.max(0, ltimer.remaining()), tot = ltimer.total() || 1;
    el.timerNum.textContent = fmtRem(rem);
    if (el.timerFill) el.timerFill.style.width = (rem / tot * 100).toFixed(1) + '%';
    if (el.timer) {
      el.timer.classList.toggle('is-low', rem <= 300 && rem > 60);
      el.timer.classList.toggle('is-crit', rem <= 60 && rem > 0);
      el.timer.classList.toggle('is-done', rem <= 0);
    }
  }
  function persistLTimer() {
    if (ltimer) Store.set('ltimer', { id: cur.id, s: ltimer.state() });
  }
  function initTimer() {
    if (!el.timer || !window.UI || !UI.Timer) return;
    ltimer = UI.Timer({
      total: 30 * 60,
      onTick: renderLTimer,
      onFinish: function () {
        renderLTimer(); persistLTimer();
        if (!isSubmitted()) {
          toast('时间到 · 已自动交卷', 3600);
          submit(true);
        }
      }
    });
    var saved = Store.get('ltimer', null);
    if (saved && saved.id === cur.id && saved.s) ltimer.restore(saved.s);
    /* B3-2：data-exam 只在本次会话点过「播放」后设置，不再按持久化计时恢复——
       否则回访时工具栏（题源/重置）会被隐藏，用户找不到重置。 */
    renderLTimer();
  }

  function isSubmitted() { return !!subs[cur.id]; }

  /* v11：切回进行中的卷子时恢复作答全屏（未开始 / 已交卷不进） */
  function wantsFullscreen() {
    return !isSubmitted() && ((ltimer && ltimer.started()) || answeredCount() > 0);
  }
  function totalNos() {
    var n = 0;
    cur.groups.forEach(function (g) { n += (g.nos || []).length; });
    return n;
  }
  function getAns(no) { return (answers[cur.id] || {})[no] || ''; }
  function answeredCount() {
    var a = answers[cur.id] || {}, n = 0;
    Object.keys(a).forEach(function (k) { if (String(a[k]).trim()) n++; });
    return n;
  }
  function setAns(no, v) {
    if (isSubmitted()) return;
    answers[cur.id][no] = v;
    Store.set('lanswers', answers);
    renderProg();
  }

  /* ---------------- 题目渲染 ---------------- */
  function renderQuestions() {
    var html = (isSubmitted() ? reportHtml() : '') + cur.groups.map(function (g) {
      var head = '<div class="qgroup-head"><h4>' + esc(g.label) + '</h4>' +
        '<span class="tag tag-accent">' + esc(g.type) + '</span>' +
        '<span class="tag">共 ' + (g.nos || []).length + ' 题</span></div>';
      var inst = g.instruction ? '<div class="qgroup-inst">' + esc(g.instruction) + '</div>' : '';
      var body = (g.cloze || []).map(function (line) {
        return '<p class="cloze-line">' + line.map(function (seg) {
          if ('g' in seg) {
            return '<input class="gap-inp" id="lq-' + seg.g + '" data-no="' + seg.g + '" ' +
              'value="' + esc(getAns(seg.g)) + '" placeholder="' + seg.g + '" ' +
              'autocomplete="off" spellcheck="false">';
          }
          return esc(seg.t);
        }).join('') + '</p>';
      }).join('');
      return '<div class="qgroup">' + head + inst + body + '</div>';
    }).join('');

    el.qs.innerHTML = html;
    $$('.gap-inp', el.qs).forEach(function (inp) {
      inp.addEventListener('input', function () {
        setAns(parseInt(inp.getAttribute('data-no'), 10), inp.value);
        /* v11：填空作答即进入作答全屏（连续触发：退出后不再自动重进） */
        if (window.ExamShell) ExamShell.enter('listening');
      });
    });
    if (isSubmitted()) {
      $$('input', el.qs).forEach(function (n) { n.disabled = true; });
      var r = $('#lRetry', el.qs);
      if (r) r.addEventListener('click', retry);
    }
    renderProg();
  }

  function renderProg() {
    if (el.prog) el.prog.textContent = '已答 ' + answeredCount() + ' / ' + totalNos();
    renderNav();
    renderQnavPill();
  }

  /* v17 补丁第二轮 v7 P2-9：听力题号导航（10 格密排，与阅读同一视觉）。
     流内固定占位，绝不以浮层盖住题目；点数字跳到该题输入框。 */
  function renderNav() {
    if (!el.nav) return;
    var t = totalNos(), html = '';
    for (var i = 1; i <= t; i++) {
      var done = String(getAns(i)).trim() !== '';
      html += '<button type="button" data-no="' + i + '" class="qnav-cell' + (done ? ' done' : '') + '" ' +
        'title="第 ' + i + ' 题 · 点击跳转" aria-label="第 ' + i + ' 题' + (done ? '，已答' : '，未答') + '">' +
        '<span class="qnav-n">' + i + '</span></button>';
    }
    el.nav.innerHTML = html;
    $$('button', el.nav).forEach(function (b) {
      b.addEventListener('click', function () {
        var no = b.getAttribute('data-no');
        var inp = document.querySelector('#lQuestions [data-no="' + no + '"]');
        if (!inp) return;
        try { inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        catch (e) { if (inp.scrollIntoView) inp.scrollIntoView(); }
        try { inp.focus({ preventScroll: true }); } catch (e) {}
      });
    });
  }

  /* B2-1：切回听力视图时由 App.switchView 调用，重写顶栏胶囊 */
  function refreshHud() {
    if (document.body.getAttribute('data-view') !== 'listening') return;
    renderQnavPill();
  }

  /* v18 0.1：顶栏题号胶囊文本 = 已答 / 总题数（交卷后显示得分） */
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

  /* ---------------- 播放器（单路 / 逐句 / 防卡死） ---------------- */
  function setPlayLabel(txt) {
    /* v17 补丁 B9：播放中主按钮显示「播放中」而非「暂停」——
       本按钮在播放中不再响应点击（见 togglePlay），文案不得
       再诱导点击；暂停/停止一律走独立暂停键 #lBtnPause。 */
    setBtnText(el.play, txt || (L.playing ? '播放中' : (L.done ? '重播' : '播放')));
    syncPauseBtn();
  }
  /* v15 旧账4：独立暂停按钮——只在播放中出现，其余时刻隐藏（不占位、不误导） */
  function syncPauseBtn() {
    if (el.pause) el.pause.hidden = !L.playing;
  }

  /* 单路纪律：任何时刻只放行一路声音。播听力前先停掉单词发音（跨模块互斥） */
  function claimAudio() {
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    if (window.Vocab && window.Vocab.stopSpeak) { try { window.Vocab.stopSpeak(); } catch (e) {} }
    if (L.audio) { try { L.audio.pause(); } catch (e) {} }
  }

  /* 播放前在用户手势里解锁语音通道（iOS 要求），并等 voiceschanged 就绪。
     v17 补丁 B9：静音 dummy speak 每次播放都调一次 → 连点时白白攒
     静音 utterance；改为整个页面生命周期只解锁一次（通道一经手势
     解锁即保持可用，cancel 不会重新上锁）。 */
  function unlockVoice() {
    if (L.voiceUnlocked) return;
    L.voiceUnlocked = true;
    if (window.Vocab && window.Vocab.ensureVoice) { try { window.Vocab.ensureVoice(); } catch (e) {} }
    else if (window.speechSynthesis) {
      try {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        var u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = voiceLang();
        window.speechSynthesis.speak(u);
      } catch (e) {}
    }
  }
  /* 复用 v11 单词模块的同一套语音（口音 / 选声 / 失败兜底同源） */
  function voiceLang() {
    if (window.Vocab && window.Vocab.getVoiceLang) return window.Vocab.getVoiceLang();
    var a = Store.get('accent', 'us'); return a === 'uk' ? 'en-GB' : 'en-US';
  }
  function pickVoice() {
    if (window.Vocab && window.Vocab.pickVoice) return window.Vocab.pickVoice();
    if (!window.speechSynthesis || !window.speechSynthesis.getVoices) return null;
    var lang = voiceLang().toLowerCase(), vs = window.speechSynthesis.getVoices() || [], v = null, i;
    for (i = 0; i < vs.length; i++) if ((vs[i].lang || '').toLowerCase().indexOf(lang) === 0) { v = vs[i]; break; }
    if (!v) for (i = 0; i < vs.length; i++) if (/^en/i.test(vs[i].lang || '')) { v = vs[i]; break; }
    return v;
  }

  /* v17 补丁 B9：连点排队 bug 修复。
     改前：播放中再点主按钮 = pause（toggle），连点 5–8 下时
     toggle 奇偶交替 → 重新起播 3–4 次，且每次 startPlay 都重跑
     unlockVoice 的静音 speak，队列里攒下多条 utterance（实测
     连点 8 次 __speak=8）。
     改后：播放中主按钮一律忽略（置灰等效），一次连点只播 1 遍；
     暂停/停止由独立暂停键 #lBtnPause 承担（播放中出现、48px），
     播完后主按钮恢复「重播」。 */
  function togglePlay() {
    if (L.playing) { return; }
    if (L.done) { replay(); return; }            /* 播完后按「播放」= 重播 */
    startPlay(L.idx || 0, true);                 /* 续播：不从 0 重置 */
  }
  function replay() { startPlay(0, false); }     /* 重播：从本段开头播（真重播） */

  /* resume=true 表示「继续」：文件音频不重置 currentTime，从暂停处接着播 */
  function startPlay(fromIdx, resume) {
    if (!cur) return;
    /* v11：显式播放/重播 = 进入作答全屏（force；播放中连点已被忽略，不会重复进） */
    if (window.ExamShell) ExamShell.enter('listening', true);
    /* P2-9：首次播放 = 开考（30 分钟倒计时；到点自动交卷） */
    if (ltimer && !ltimer.started() && !isSubmitted()) {
      ltimer.start(); persistLTimer(); renderLTimer();
      document.body.setAttribute('data-exam', '1');   /* 开考：进入考试态（隐藏练习 chrome） */
    }
    if (cur.audio) { playFile(!resume); return; }  /* 本地音频优先（文件验真见 playFile） */
    unlockVoice();                               /* 用户手势里解锁语音通道（整页只做一次） */
    L.playing = true; L.done = false; L.started = false; L.retry = 0;
    setPlayLabel('播放中');                       /* 状态立即变化（验收项）；B9 后主按钮播放中不可点 */
    el.now.classList.remove('is-fail');
    speakFrom(fromIdx || 0);
  }

  function pause() {                             /* 暂停：保留当前句，可从当前句续播 */
    L.playing = false;
    clearTimers();
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    if (L.audio) { try { L.audio.pause(); } catch (e) {} }
    setPlayLabel('继续');
  }

  function speakFrom(i) {
    if (!cur) return;
    if (i < 0) i = 0;
    if (i >= cur.script.length) { finishAudio(); return; }
    L.idx = i; L.started = false; L.ended = false;
    clearTimers();

    var seg = cur.script[i];
    revealSeg(i);                                /* B3-1：这一句开播即可见 */
    renderNow(seg, i);
    highlightSeg(i);
    el.cur.textContent = '第 ' + (i + 1) + ' 句';
    el.dur.textContent = '共 ' + cur.script.length + ' 句';
    updateProg(i / cur.script.length);

    claimAudio();                                /* 单路：每次 speak 前必 cancel，不攒队列 */

    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { showNoTTS(); return; }
    var u = new SpeechSynthesisUtterance(seg.text);
    u.lang = voiceLang();
    u.rate = 0.95; u.volume = 1;                 /* 语速 0.9–1.0、音量 1（只读单词本身，这里读整句） */
    var v = pickVoice(); if (v) u.voice = v;

    u.onstart = function () {
      L.started = true;
      el.now.classList.remove('is-fail');
      clearTimeout(L.wd);                          /* 已开播：撤销「未开播」看门狗 */
      L.stuck = setTimeout(function () {           /* 已开始却迟迟不结束（卡住）→ 重试一次 */
        if (!L.playing) return;
        if (L.retry < 1) { L.retry = 1; cancelAndRetry(); }
        else showFailure();
      }, 15000);
    };
    u.onend = function () {
      if (!L.playing) return;
      L.ended = true;
      clearTimers();
      var next = L.idx + 1;
      if (next < cur.script.length) {
        L.gap = setTimeout(function () { speakFrom(next); }, 350);   /* 句间停顿 300–500ms，逐句顺序播 */
      } else { finishAudio(); }
    };
    u.onerror = function (ev) {                   /* 某句失败：重试一次，仍失败明确提示，绝不静默 */
      if (!L.playing) return;
      /* 主动取消（暂停 / 切题 / 重播复位）不是失败 */
      var err = ev && ev.error;
      if (err === 'canceled' || err === 'interrupted') return;
      L.ended = true;
      if (L.retry < 1) { L.retry = 1; cancelAndRetry(); }
      else showFailure();
    };
    L.utt = u;

    /* 防卡死看门狗：
     *  · 首句：5 秒无开播 → 直接弹「播放失败，点我重试」（不静默卡在第一句）
     *  · 中段句：15 秒无开播 → 重试一次，仍失败才弹提示 */
    var limit = (i === 0) ? 5000 : 15000;
    L.wd = setTimeout(function () {
      if (!L.playing) return;
      if (!L.started) {
        if (i === 0) showFailure();
        else if (L.retry < 1) { L.retry = 1; cancelAndRetry(); }
        else showFailure();
      }
    }, limit);

    /* v15 旧账4：静默死亡看门狗——onstart 触发过、但引擎既不 progress 也不报错
     * （Linux 无语音包等场景：speak 成功却全程无声，旧代码只能干等 15–30s）。
     * 每 900ms 巡检一次：已开播未结束、而 speaking/pending 双双为 false
     * 持续两次巡检 → 判静默死亡，重试一次，仍死则明确报错。 */
    var silentStrikes = 0;
    L.silent = setInterval(function () {
      if (!L.playing || !L.utt || !L.started || L.ended) { silentStrikes = 0; return; }
      var sy = window.speechSynthesis;
      if (!sy) return;
      var alive = true;
      try { alive = sy.speaking || sy.pending; } catch (e) { alive = true; }
      if (alive) { silentStrikes = 0; return; }
      silentStrikes++;
      if (silentStrikes >= 2) {
        silentStrikes = 0;
        if (L.retry < 1) { L.retry = 1; cancelAndRetry(); }
        else showFailure();
      }
    }, 900);

    try {
      try { window.speechSynthesis.resume(); } catch (e) {}
      window.speechSynthesis.speak(u);
    } catch (e) { showFailure(); }
  }

  function cancelAndRetry() {                     /* 复位合成器后重播当前句一次 */
    clearTimers();
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    L.started = false;
    setTimeout(function () { if (L.playing) speakFrom(L.idx); }, 80);
  }

  /* v15 0.6：失败原因如实说明（设备不支持 / 无语音包 / 未配置本地音频），
   * 并给出可用的出路：点提示或「重试」再试一次，「重播」从头听。 */
  function failReason() {
    var noTts = !window.speechSynthesis || !window.SpeechSynthesisUtterance;
    var noAudio = !(cur && cur.audio);
    if (noTts) {
      return noAudio
        ? '当前设备不支持系统语音，本段也未配置本地音频（可放入 mp3 离线播放）'
        : '当前设备不支持系统语音';
    }
    var vs = [];
    try { vs = window.speechSynthesis.getVoices() || []; } catch (e) {}
    if (!vs.length) {
      return noAudio
        ? '系统语音列表为空（可能未安装英语语音包），本段未配置本地音频'
        : '系统语音列表为空（可能未安装英语语音包）';
    }
    return noAudio ? '系统语音未能正常开播，本段未配置本地音频' : '系统语音未能正常开播';
  }

  function showFailure() {                        /* 失败：明确提示 + 按钮仍可点（重试/重播） */
    L.playing = false; L.done = false;
    clearTimers();
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    setPlayLabel('重试');
    el.now.classList.remove('is-live');
    el.now.classList.add('is-fail');
    var reason = failReason();
    el.now.innerHTML = '<span class="l-text is-fail-text">播放失败：' + esc(reason) +
      '。点我或「重试」再试一次，「重播」从头听。</span>';
    toast('播放失败：' + reason, 3200);
  }

  function showNoTTS() {                          /* 设备压根不支持语音合成：明确提示，不静默 */
    L.playing = false;
    clearTimers();
    setPlayLabel('播放');
    el.now.classList.add('is-fail');
    el.now.innerHTML = '<span class="l-text is-fail-text">' + esc(failReason()) +
      '。可放入 mp3 后点「播放」重试。</span>';
  }

  /* 本地音频优先链路「验真」：文件真实可播才用；加载/解码/播放失败 → 降级系统语音并提示。
   * reset=true 时从 0 开始（真重播）；false 为暂停后续播（保留 currentTime）。 */
  function playFile(reset) {
    L.done = false; L.playing = true;
    setPlayLabel('播放中');
    if (!L.audio) {
      L.audio = new Audio(cur.audio);
      L.audio.preload = 'auto';
      L.audio.addEventListener('timeupdate', function () {
        var r = L.audio.duration ? L.audio.currentTime / L.audio.duration : 0;
        updateProg(r);
        el.cur.textContent = fmtClock(L.audio.currentTime);
        el.dur.textContent = fmtClock(L.audio.duration || 0);
      });
      L.audio.addEventListener('ended', function () { finishAudio(); });
      L.audio.addEventListener('error', function () {
        L.audio = null;
        el.now.classList.add('is-fail');
        el.now.innerHTML = '<span class="l-text is-fail-text">本地音频不可用，已改用系统语音逐句朗读</span>';
        startTTSAfterAudioFail();
      });
    }
    /* v15 旧账4：真重播——无论之前停在哪，重播都从 0 开始（旧代码直接 play()
     * 会从暂停处续播，「重播」名不副实） */
    if (reset) { try { L.audio.currentTime = 0; } catch (e) {} }
    var pr = L.audio.play();
    if (pr && pr.catch) pr.catch(function () {
      L.audio = null;
      el.now.innerHTML = '<span class="l-text is-fail-text">本地音频不可用，已改用系统语音逐句朗读</span>';
      startTTSAfterAudioFail();
    });
  }
  function startTTSAfterAudioFail() {
    L.playing = true; setPlayLabel('播放中'); L.started = false; L.retry = 0;
    speakFrom(0);
  }

  function renderNow(seg, i) {
    el.now.classList.add('is-live');
    el.now.classList.remove('is-fail');
    el.now.innerHTML = '<span class="l-who">' + esc(seg.who) + '</span>' +
      '<span class="l-text">' + esc(seg.text) + '</span>';
  }

  /* 字幕：逐句列出，播到哪句高亮哪句（当前句高亮 + 进度 第 x / y 句） */
  /* B3-1：原文只在该句播放后可见（交卷后全部可见）。
     播放前 DOM 里根本不放原文，避免「屏上读得到 / 选中可复制」。 */
  var revealed = {};
  function renderTranscript() {
    if (!el.transcript) return;
    if (!cur) { el.transcript.innerHTML = ''; return; }
    var done = isSubmitted();
    var lpEl = document.querySelector('.l-player');
    if (lpEl) lpEl.classList.remove('is-idle');
    /* 一句都没播过：整块只显示一句提示，不排 23 行占位 */
    var any = false;
    for (var kk in revealed) { if (kk.indexOf(cur.id + ':') === 0) { any = true; break; } }
    if (!done && !any) {
      /* super P0-4：播放前不再只留一句提示把左栏空掉——
         给出「将要出现几行」的骨架，长度参差，明确这是待播放内容。 */
      var rows = '', widths = [92, 78, 86, 64, 88, 72, 95, 58];
      for (var si = 0; si < widths.length; si++) {
        rows += '<div class="l-skel" style="--w:' + widths[si] + '%"></div>';
      }
      el.transcript.innerHTML =
        '<div class="l-seg-mask-tip">点击「播放」后，原文会逐句显示在这里</div>' +
        '<div class="l-skel-box" aria-hidden="true">' + rows + '</div>';
      /* super P0-4：空闲态把播放器里那块空的「当前句」收起来，把骨架顶上来 */
      var lp = document.querySelector('.l-player');
      if (lp) lp.classList.add('is-idle');
      return;
    }
    el.transcript.innerHTML = cur.script.map(function (s, k) {
      var show = done || revealed[cur.id + ':' + k];
      return '<div class="l-seg' + (show ? '' : ' is-masked') + '" data-i="' + k + '">' +
        '<span class="l-seg-who">' + (show ? esc(s.who) : '·') + '</span>' +
        '<span class="l-seg-text' + (show ? '' : ' is-masked') + '">' +
          (show ? esc(s.text) : '播放后显示') + '</span></div>';
    }).join('');
  }
  function revealSeg(i) {
    if (!cur) return;
    revealed[cur.id + ':' + i] = 1;
    var node = el.transcript && el.transcript.querySelector('.l-seg[data-i="' + i + '"]');
    if (!node) { renderTranscript(); node = el.transcript && el.transcript.querySelector('.l-seg[data-i="' + i + '"]'); }
    if (!node) return;
    node.classList.remove('is-masked');
    var t = node.querySelector('.l-seg-text');
    if (t) { t.textContent = cur.script[i].text; t.classList.remove('is-masked'); }
  }
  function highlightSeg(i) {
    if (!el.transcript) return;
    $$('.l-seg', el.transcript).forEach(function (n) {
      n.classList.toggle('active', parseInt(n.getAttribute('data-i'), 10) === i);
    });
  }

  function updateProg(ratio) {
    if (el.fill) el.fill.style.width = Math.max(0, Math.min(1, ratio)) * 100 + '%';
  }

  function finishAudio() {                        /* 播完：进度满、按钮可重播 */
    L.playing = false; L.done = true;
    clearTimers();
    updateProg(1);
    setPlayLabel('重播');
    el.now.classList.remove('is-fail');
    el.now.innerHTML = '<span class="l-text">播放完毕 · 可点击「重播」再听一遍</span>';
    highlightSeg(-1);
  }

  /* 切后台 / 锁屏导致中断：自动暂停，回来可点「继续」从当前句续播（不从头） */
  function onVisibility() {
    if (document.hidden && L.playing) pause();
  }

  function clearTimers() {
    if (L.wd) { clearTimeout(L.wd); L.wd = null; }
    if (L.stuck) { clearTimeout(L.stuck); L.stuck = null; }
    if (L.gap) { clearTimeout(L.gap); L.gap = null; }
    if (L.silent) { clearInterval(L.silent); L.silent = null; }   /* v15：静默看门狗 */
  }

  function stopAudio() {                          /* 切题 / 交卷 / 重置 / 跨模块打断：彻底复位 */
    L.playing = false; L.done = false; L.idx = 0; L.started = false; L.retry = 0;
    clearTimers();
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    if (L.audio) { try { L.audio.pause(); } catch (e) {} L.audio = null; }
    updateProg(0);
    highlightSeg(-1);
    setPlayLabel('播放');
  }

  /* ---------------- 判分 / Band ---------------- */
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[^a-z0-9' ]+/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function alts(v) {
    if (Array.isArray(v)) return v.map(norm).filter(Boolean);
    return String(v).split('/').map(norm).filter(Boolean);
  }

  /* 听力原始分 → Band：按题量折算到 40 分制后查表 */
  function bandOf(got, total) {
    var raw = total ? Math.round(got / total * 40) : 0;
    if (raw >= 39) return 9.0;
    if (raw >= 37) return 8.5;
    if (raw >= 35) return 8.0;
    if (raw >= 33) return 7.5;
    if (raw >= 30) return 7.0;
    if (raw >= 27) return 6.5;
    if (raw >= 23) return 6.0;
    if (raw >= 19) return 5.5;
    if (raw >= 15) return 5.0;
    if (raw >= 13) return 4.5;
    if (raw >= 10) return 4.0;
    if (raw >= 4) return 2.5;
    if (raw >= 3) return 2.0;
    if (raw >= 1) return 1.5;
    return 1.0;
  }

  function score() {
    var total = totalNos(), got = 0, rows = [];
    for (var no = 1; no <= total; no++) {
      var mine = String(getAns(no)).trim();
      var acc = alts((cur.answers || {})[no] || '');
      var ok = !!mine && acc.indexOf(norm(mine)) >= 0;
      if (ok) got++;
      rows.push({ no: no, mine: mine, right: (cur.answers || {})[no] || '', ok: ok });
    }
    return { total: total, got: got, rows: rows };
  }

  function reportHtml() {
    var s = score();
    var band = bandOf(s.got, s.total);
    var rows = s.rows.map(function (r) {
      return '<tr class="' + (r.ok ? 'ok' : (r.mine ? 'bad' : 'blank')) + '">' +
        '<td class="c-no">' + r.no + '</td>' +
        '<td class="c-mine">' + (r.mine ? esc(r.mine) : '<span class="muted">未作答</span>') + '</td>' +
        '<td class="c-right">' + esc(r.right) + '</td>' +
        '<td class="c-mark">' + (r.ok ? '✓' : '✕') + '</td></tr>';
    }).join('');

    return '<div class="rpt"><div class="rpt-head">' +
      '<span class="rpt-badge">已交卷</span>' +
      '<b class="rpt-score">' + s.got + ' <i>/ ' + s.total + '</i></b>' +
      '<span class="rpt-band">预估 Band <b>' + band.toFixed(1) + '</b>' +
        '<em>按听力换算表折算 40 分制预估，仅供参考</em></span>' +
      '<span class="rpt-grow"></span>' +
      '<button type="button" class="btn btn-sm" id="lRetry">重新作答</button>' +
      '</div>' +
      '<div class="rpt-scroll"><table class="rpt-table">' +
        '<thead><tr><th>题号</th><th>我的答案</th><th>正确答案</th><th>对错</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>' +
      '<p class="rpt-hint">本套共 ' + s.total + ' 题，原始分折算为 40 分制后查听力换算表' +
        '（39–40→9.0，35–36→8.0，30–32→7.0，23–26→6.0）。</p>' +
      '</div>';
  }

  /* ---------------- 交卷 / 重置 ---------------- */
  function submit(force) {
    /* v11：交卷后不再是作答态，摘掉作答全屏（评分逻辑不动） */
    if (window.ExamShell) ExamShell.clear();
    if (isSubmitted()) { toast('本套已交卷，可点「重新作答」再练一次'); return; }
    var t = totalNos(), a = answeredCount();
    var run = function () {
      var s = score();
      /* v13：交卷后按题顺序短促连播提示音（不一次长鸣、单路）；逐题 stagger 200ms */
      if (window.Feedback) {
        s.rows.forEach(function (r, i) {
          setTimeout(function () { window.Feedback.playChime(r.ok); }, i * 200);
        });
      }
      subs[cur.id] = { at: Date.now(), got: s.got, total: s.total, band: bandOf(s.got, s.total) };
      Store.set('lsubmitted', subs);
      if (ltimer) { ltimer.pause(); persistLTimer(); }
      document.body.removeAttribute('data-exam');   /* 交卷后回到练习态（可换题源/重置） */
      renderTranscript();                            /* B3-1：交卷后原文全部可见 */
      stopAudio();
      renderQuestions();
      renderProg();
      toast('已交卷 · ' + s.got + ' / ' + s.total, 3200);
    };
    /* P2-9：强制交卷（时间到）不弹确认；手动交卷未答满必须先确认 */
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
      text: '将清空本套全部作答并解锁作答区。确定要清空吗？此操作不可恢复。',
      ok: '清空并解锁'
    }, function (yes) {
      if (!yes) return;
      answers[cur.id] = {};
      delete subs[cur.id];
      Store.set('lanswers', answers);
      Store.set('lsubmitted', subs);
      if (ltimer) { ltimer.pause(); persistLTimer(); }
      document.body.removeAttribute('data-exam');   /* 交卷后回到练习态（可换题源/重置） */
      renderTranscript();                            /* B3-1：交卷后原文全部可见 */
      stopAudio();
      renderQuestions();
      renderProg();
      el.now.textContent = '点击「播放」开始';
      setPlayLabel('播放');
      /* v11：显式重新作答 = 重新进入作答全屏（force） */
      if (window.ExamShell) ExamShell.enter('listening', true);
    });
  }

  function resetAll() {
    UI.Confirm({
      title: '重置本套',
      text: '将重置播放进度并清空本套全部作答。确定要清空吗？此操作不可恢复。',
      ok: '确定重置'
    }, function (yes) {
      if (!yes) return;
      stopAudio();
      answers[cur.id] = {};
      delete subs[cur.id];
      Store.set('lanswers', answers);
      Store.set('lsubmitted', subs);
      renderQuestions();
      renderProg();
      el.now.textContent = '点击「播放」开始';
      setPlayLabel('播放');
      /* v11：重置回空白卷——摘掉作答全屏 */
      if (window.ExamShell) ExamShell.clear();
    });
  }

  return { init: init, stopAudio: stopAudio, startPlay: startPlay, pause: pause, refreshHud: refreshHud, wantsFullscreen: wantsFullscreen };
})();
