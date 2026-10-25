/* ============================================================
 *  Vocabulary 模块 —— 复刻主流背单词 App 交互
 *  三种模式：英译汉（翻卡 / 四选一）· 汉译英（输入 / 四选一）· 拼写默写
 *  反馈：认识 / 模糊 / 不认识 · 本轮进度与正确率 · 错词本 + 简单间隔重复
 *  ---------------------------------------------------------------
 *  本次修改点：
 *    1) 英译汉、汉译英「双向」都提供四选一选择题（原先只有英译汉有）；
 *    2) 干扰项统一由 makeChoice() 从当前词库随机抽取，按显示值去重，
 *       保证与正确答案不重复、四个选项互不重复，不足 4 个时自动回落；
 *    3) 提交后立即判定，并渲染 .explain 解析面板：
 *       用户所选 / 正确答案 / 逐项释义对照 + 该词掌握数据；
 *    4) 选项渲染改用可复用组件 UI.Options，空状态改用线性 SVG 插画。
 *  本次修改点（综合修订）：
 *    5) BUG-1 「清空词库」改用 UI.Confirm 自定义二次确认弹层（原生 confirm
 *       在受限环境恒返回 false，导致按钮点了没反应）。
 *    6) BUG-7 区分「示例数据」与「用户数据」：示例词带 src:'sample' 标记，
 *       首次访问不再自动加载示例；词库为空时显示空状态 + 「载入示例词表
 *       （50 词）」引导按钮；列表里示例词带灰色「示例」小标。
 *    7) 掌握率由线性进度条改为环形进度条；新增近 8 轮正确率趋势（Store 键
 *       'vtrend'）。
 *    8) 错词本 / 空词库等空状态统一给出引导按钮。
 *  影响范围：仅本模块；Store 数据结构（deck / vstats）向后兼容，
 *            新增可选字段 src 与新增键 vtrend。
 *  本次修改点（v7 · 词性根因级拆分）：
 *    9) 0-1 词性字号：parseLine 新增词性抽取（word 末尾缩写拆到独立 pos 字段）；
 *       渲染层把「单词」与「词性」拆成两个独立元素——练习卡 .q-word + .q-pos、
 *       翻卡 .big 内 .q-pos-big、词库列表 .deck-w 内 .deck-pos、反馈卡 .fb-pos；
 *       示例词表改为 "word 词性 释义" 格式，旧词库加载时自动迁移末尾词性。
 *   10) 0-2 练习页布局：放大单词字号、加高选项卡，反馈卡补充词性与可选例句行。
 * ============================================================ */
window.Vocab = (function () {
  'use strict';

  /* 间隔重复梯度（分钟）：连续答对 0/1/2/3/4/5+ 次 → 1/2/4/7/15/30 天 */
  var GAP = [1440, 2880, 5760, 10080, 21600, 43200];

  var el = {};
  var deck = [];                 // [{w,m,seen,right,wrong,level,due,inWrong,addedAt}]
  var stats = { rounds: 0, answered: 0, correct: 0 };
  var mode = 'en2cn';
  var sub = { en2cn: 'choice', cn2en: 'choice', spell: 'spell' };
  /* v18 0.7：模式中文名（全屏练习页模式标签用） */
  var MODE_NAMES = { en2cn: '英译汉', cn2en: '汉译英', spell: '拼写默写' };
  var round = null;              // {queue, idx, total, ok, answered, active}
  var card = null;               // 当前词条
  var locked = false;            // 已作答，等反馈
  var optMeta = [];              // 当前四选一的选项元数据 [{v,w,m}]
  var accent = 'us';             // 发音口音：us 美音 / uk 英音（Store 键 accent）
  var autoSpeak = true;          // 新题自动朗读（Store 键 autoSpeak，默认开）
  var trend = [];                // 近 8 轮正确率 [{acc, at, n}]（Store 键 vtrend）

  /* ---------- 发音（详见 assets/js/audio.js 的分层降级策略） ---------- */
  function spkBtn(word, cls) {
    return '<button class="spk' + (cls ? ' ' + cls : '') + '" type="button" ' +
      'data-speak="' + esc(word) + '" data-accent="' + accent + '" ' +
      'title="朗读发音（' + (accent === 'uk' ? '英音' : '美音') + '）" aria-label="朗读">' +
      Icons.get('volume', 20) + '</button>';
  }
  /* 汉译英防剧透：答前题面喇叭置灰「答后可听」，答后才可点（data-speak 已是正确英文词） */
  function spkBtnLocked(word) {
    return '<button class="spk spk-head spk-locked" type="button" disabled ' +
      'data-speak="' + esc(word) + '" data-accent="' + accent + '" ' +
      'title="答后可听（防止泄题）" aria-label="答后可听（防止泄题）" aria-disabled="true">' +
      Icons.get('volume', 24) + '</button>';
  }

  /* ---------------- 语音：系统 speechSynthesis（不接付费 API） ---------------- */
  var voices = [];
  var voicesSettled = false;     // 语音列表是否已就绪（非空或 voiceschanged 已触发）
  function loadVoices() {
    try {
      voices = window.speechSynthesis ? (window.speechSynthesis.getVoices() || []) : [];
    } catch (e) { voices = []; }
    if (voices.length) voicesSettled = true;
    updateVoiceNote();
  }
  /* 设置处标明实际使用的语音：列表还在异步加载时绝不提前下「无语音」结论。
   * v15 0.5：口音区域不再出现红色「当前设备暂无可用语音」误导文案——
   * 这里只做中性状态说明（载入中 / 未检测到系统语音将用本地音频 / 实际语音），
   * 真正的失败原因在用户点喇叭时由状态 pill 与 toast 如实给出。 */
  function updateVoiceNote() {
    var n = document.getElementById('accentNote');
    if (!n) return;
    n.classList.remove('is-fail');
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      n.textContent = '当前环境不支持系统语音（本地音频可兜底）';
      return;
    }
    if (!voices.length && !voicesSettled) {
      n.textContent = '系统语音载入中…';
      return;
    }
    if (!voices.length) {
      n.textContent = '未检测到系统语音，将优先使用本地音频';
      return;
    }
    var v = pickVoice();
    n.textContent = v
      ? '实际语音：' + v.name.replace(/\s*\(.*\)\s*$/, '') + '（' + v.lang + '）'
      : '实际语音：系统默认英语语音';
  }
  function pickVoice() {
    var lang = accent === 'uk' ? 'en-gb' : 'en-us';
    var v = null, i;
    for (i = 0; i < voices.length; i++) {
      if ((voices[i].lang || '').toLowerCase().indexOf(lang) === 0) { v = voices[i]; break; }
    }
    if (!v) {
      for (i = 0; i < voices.length; i++) {
        if (/^en/i.test(voices[i].lang || '')) { v = voices[i]; break; }
      }
    }
    return v;
  }
  /* 喇叭状态文字（P-3：必须有可见文字，不许只用颜色变化表示状态） */
  var spkStatusEl = null, spkStatusTimer = null, lastSpkWord = '';
  /* v15：朗读代际号——每次发起朗读 +1，旧 utterance 的迟到回调
   * （onstart/onend/onerror/看门狗）代际不符即整条忽略，避免：
   * ① 旧朗读被 cancel 的回调把新朗读的「播放中」pill 擦掉；
   * ② 旧朗读的兜底看门狗在已翻题后重读旧词。 */
  var spkGen = 0;
  /* v17 补丁第二轮 P2-3：播放闸门（替代上一轮 400ms 纯时间窗防抖——
     时间窗挡不住「每下间隔 >400ms」的慢连点，真机仍会排队连播）。
     状态：正在播什么 / 何时起播 / 何时被手动停止。 */
  var spkActive = '';        /* 正在朗读的文本（'' = 空闲） */
  var spkStartAt = 0;        /* 本次起播时刻（ms） */
  var spkStopAt = 0;         /* 最近一次手动停止时刻（ms） */
  var spkLastTap = 0;        /* 上一次手动点按时刻（ms） */
  var SPK_TAP_MIN = 600;     /* 两次点击 <600ms = 连点，一律忽略（只播 1 遍） */
  var SPK_STOP_COOL = 900;   /* 停止后 900ms 内不再起播，防连点反复排队 */

  /* 播放闸门：'play' 正常起播 / 'stop' 点按即停 / 'ignore' 连点忽略 */
  function spkGate(txt, isAuto) {
    var now = Date.now ? Date.now() : 0;
    if (isAuto) return 'play';                 /* 应用自动朗读不受手动闸门限制 */
    /* 连点节奏（<600ms）内一律忽略：这正是真机「6 下连点连播 8 遍」的成因——
       人手快速连点每下都落在上一句还没播完的窗口里，若逐下响应就会不断重排。
       忽略后：5–8 连点只播 1 遍；想停请点「播放中… 点此停止」状态条。 */
    if (now - spkLastTap < SPK_TAP_MIN) { spkLastTap = now; return 'ignore'; }
    spkLastTap = now;
    /* 播放中再点同一按钮 = 忽略（不重排、不重启）：无论手指连点多快、
       间隔多长，一个播放周期内都只会播 1 遍。要停请点状态条「点此停止」。 */
    if (spkActive && spkActive === txt) return 'ignore';
    if (spkActive) return 'play';              /* 正在播别的 → 直接切换，不排队 */
    if (now - spkStopAt < SPK_STOP_COOL) return 'ignore';
    return 'play';
  }

  /* 立即停止：cancel 掉系统语音队列 + 本地音频，清按钮播放态与 pill */
  function spkStopNow(btns, silent) {
    spkGen++;
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    if (window.DictAudio && DictAudio.stop) { try { DictAudio.stop(); } catch (e) {} }
    spkActive = '';
    spkStopAt = Date.now ? Date.now() : 0;
    var all = $$('[data-speak].is-playing');
    (all && all.length ? all : (btns || [])).forEach(function (b) { b.classList.remove('is-playing'); });
    spkStatus('');
    if (!silent) toast('已停止朗读', 1200);
  }
  function spkStatus(state, msg) {
    if (!spkStatusEl) spkStatusEl = document.getElementById('spkStatus');
    if (!spkStatusEl) return;
    if (spkStatusTimer) { clearTimeout(spkStatusTimer); spkStatusTimer = null; }
    spkStatusEl.classList.remove('is-playing', 'is-fail', 'show');
    /* v15：隐藏分支必须同时清空 innerHTML——只移除 .show 会让旧文案
     * （如「🔊 播放中…」）残留在 DOM 里，答错后读 pill 文本会误判仍在播放 */
    if (state === 'playing') {
      spkStatusEl.innerHTML = '🔊 播放中… <b>点此停止</b>';
      spkStatusEl.classList.add('is-playing', 'show');
      spkStatusEl.setAttribute('title', '点击停止朗读');
      /* P2-3：明确的停止控制（状态条本身可点即停） */
      spkStatusEl.onclick = function (e) {
        e.preventDefault(); e.stopPropagation();
        spkStopNow(null);
      };
    } else if (state === 'fail') {
      spkStatusEl.innerHTML = '⚠️ 朗读失败，点我重试';
      spkStatusEl.classList.add('is-fail', 'show');
    } else {
      spkStatusEl.innerHTML = '';
      spkStatusEl.onclick = null;
      spkStatusEl.removeAttribute('title');
    }
  }
  function clearSpkStatusSoon() {
    if (spkStatusTimer) clearTimeout(spkStatusTimer);
    spkStatusTimer = setTimeout(function () { spkStatus(''); }, 1200);
  }
  /* 喇叭按钮的两种可见状态：播放中 / 失败（颜色为辅助，文字为准） */
  function markPlay(btns) {
    btns.forEach(function (b) { b.classList.add('is-playing'); b.classList.remove('is-fail'); });
    spkStatus('playing');
  }
  function markFail(btns, msg) {
    btns.forEach(function (b) {
      b.classList.remove('is-playing');
      b.classList.add('is-fail');
      /* v15 0.5：按钮名称只写动作，绝不把「当前设备暂无可用语音」冒名成按钮名；
       * 真实原因由状态 pill 与 toast 给出（见下方 spkStatus('fail') + toast(msg)） */
      b.setAttribute('title', '朗读失败，点我重试');
      b.setAttribute('aria-label', '朗读失败，点我重试');
    });
    spkStatus('fail');
    if (msg) toast(msg, 2800);
  }
  /* 系统语音不可用时的兜底：本地打包音频 → IndexedDB 缓存（audio.js 内部仍会
   * 再试系统 TTS，全失败则由 audio.js 给出「当前设备暂无可用语音」提示，绝不静默）。
   * st = 本次朗读的播放上下文 {local:bool}，供 TTS 晚到时做单路互斥（v15 旧账1） */
  function fallbackAudio(w, btns, st) {
    st = st || { local: false };
    if (!window.DictAudio) { markFail(btns, '当前设备暂无可用语音'); return false; }
    DictAudio.play(w, accent, { offlineOnly: true }).then(function (r) {
      if (r === 'local' || r === 'cache') {
        st.local = true;
        markPlay(btns);
        setTimeout(function () {
          st.local = false;
          btns.forEach(function (b) { b.classList.remove('is-playing'); });
          spkStatus('');
        }, 900);
      }
      else markFail(btns, '当前设备暂无可用语音');
    }).catch(function () { markFail(btns, '当前设备暂无可用语音'); });
    return true;
  }

  /* 朗读单词。
   * isAuto = true 表示「新题自动朗读」（nextCard 调用）——v15 旧账1 根因修复：
   * 自动朗读若在用户作答后才迟迟不开播，1.5s 看门狗不得再兜底重读
   * （否则答错瞬间会听到正确词被自动读出，只剩手动「再听一遍」）。
   * 另外两层防护：
   *  · onerror 区分 error==='canceled'/'interrupted'（判定提示音的 stopOthers、
   *    切题等主动取消）——主动取消不兜底、不重读；
   *  · 本地音频兜底已开播后 TTS 才慢启动 → 停掉本地音频，全站永远只有一路声。
   * v15 旧账3：speak 前先乐观亮「播放中…」pill，不依赖 onstart（部分设备不触发）。 */
  function speakWord(word, isAuto) {
    /* 只读单词本身：取第一段、去标点（不读词性、释义、标点） */
    var w = String(word || '').split(/[\s,，。;；:：]/)[0].replace(/[^A-Za-z'\-]/g, '');
    if (!w) return false;
    if (!voices.length) loadVoices();
    var btns = $$('[data-speak="' + w.replace(/"/g, '\\"') + '"]');
    /* P2-3：播放中再点=停止；连点忽略；停止后冷却 —— 连点 5–8 下只播 1 遍 */
    var act = spkGate(w, isAuto);
    if (act === 'ignore') return false;
    if (act === 'stop') { spkStopNow(btns); return false; }
    spkActive = w;
    spkStartAt = Date.now ? Date.now() : 0;
    lastSpkWord = w;
    var ctxCard = card;                 /* 记录本次朗读对应的卡片，供看门狗判过期 */
    var st = { local: false };          /* 播放上下文：本地音频是否正在播 */
    var myGen = ++spkGen;               /* 本次朗读代际（旧 utterance 迟到回调整条忽略） */

    /* 设备根本没有语音合成：直接走本地音频兜底，仍失败则明确提示 */
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      updateVoiceNote();
      return fallbackAudio(w, btns, st);
    }

    try { window.speechSynthesis.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(w);
    u.lang = accent === 'uk' ? 'en-GB' : 'en-US';
    u.rate = 0.95;
    u.volume = 1;
    var v = pickVoice();
    if (v) u.voice = v;

    var started = false;
    u.onstart = function () {
      if (myGen !== spkGen) return;     /* 已被更新的朗读取代 */
      started = true;
      /* 单路纪律：本地音频若已在播（TTS 只是慢），停掉本地只留 TTS */
      if (st.local && window.DictAudio && DictAudio.stop) {
        try { DictAudio.stop(); } catch (e) {}
        st.local = false;
      }
      markPlay(btns);
    };
    u.onend = function () {
      if (myGen !== spkGen) return;
      if (st.local) return;             /* 本地音频还在播：状态由它维护 */
      spkActive = '';                   /* P2-3：播完释放闸门 */
      btns.forEach(function (b) { b.classList.remove('is-playing'); });
      spkStatus(''); clearSpkStatusSoon();
    };
    u.onerror = function (ev) {
      if (myGen !== spkGen) return;
      /* 主动取消（判定提示音 / 切题 / 上一段播完前的 cancel）不是失败：
       * 不兜底、不自动重读——v15 旧账1：答错提示音会 cancel 掉未开播的自动朗读，
       * 旧代码在这里盲目 fallbackAudio，导致答错后反而读出正确词。
       * 但要把本次的播放态清掉（这条 utterance 不会再响了）。 */
      var err = ev && ev.error;
      if (err === 'canceled' || err === 'interrupted') {
        spkActive = '';
        btns.forEach(function (b) { b.classList.remove('is-playing'); });
        spkStatus('');
        return;
      }
      if (st.local) return;
      fallbackAudio(w, btns, st);
    };

    /* 语音列表为空时常出现「调了 speak 却不出声」：1.5s 未开播即兜底。
     * 但自动朗读若已过期（用户已作答 / 已翻到下一题）→ 不再兜底重读。 */
    setTimeout(function () {
      if (myGen !== spkGen) return;
      if (started || st.local) return;
      if (isAuto && (locked || card !== ctxCard)) return;
      fallbackAudio(w, btns, st);
    }, 1500);

    /* v15 旧账3：先亮 pill 再 speak（部分设备 onstart 不触发， pill 会消失） */
    markPlay(btns);
    try { window.speechSynthesis.speak(u); return true; }
    catch (e) { return fallbackAudio(w, btns, st); }
  }
  /* 在用户手势里解锁语音通道（iOS 要求） */
  function unlockVoice() {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      var u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      u.lang = accent === 'uk' ? 'en-GB' : 'en-US';
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* 朗读整句（例句 / 短语动词）：用系统 TTS 读完整内容，不截断 */
  function speakSentence(text) {
    var t = String(text || '').trim();
    if (!t) return false;
    var btns = $$('[data-speak="' + t.replace(/"/g, '\\"') + '"]');
    /* P2-3：例句走同一闸门（播放中再点=停止，连点忽略） */
    var act = spkGate(t, false);
    if (act === 'ignore') return false;
    if (act === 'stop') { spkStopNow(btns); return false; }
    spkActive = t;
    spkStartAt = Date.now ? Date.now() : 0;
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      markFail(btns, '当前环境不支持朗读例句');
      return false;
    }
    try { window.speechSynthesis.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(t);
    u.lang = accent === 'uk' ? 'en-GB' : 'en-US';
    u.rate = 0.92; u.volume = 1;
    var v = pickVoice(); if (v) u.voice = v;
    var started = false;
    var myGen = ++spkGen;               /* 与 speakWord 共用代际号，避免跨入口擦 pill */
    u.onstart = function () {
      if (myGen !== spkGen) return;
      started = true; markPlay(btns);
    };
    u.onend = function () {
      if (myGen !== spkGen) return;
      spkActive = '';
      btns.forEach(function (b) { b.classList.remove('is-playing'); });
      spkStatus(''); clearSpkStatusSoon();
    };
    u.onerror = function (ev) {
      if (myGen !== spkGen) return;
      /* 主动取消不是失败（同 speakWord：不重读、不兜底，只清播放态） */
      var err = ev && ev.error;
      if (err === 'canceled' || err === 'interrupted') {
        spkActive = '';
        btns.forEach(function (b) { b.classList.remove('is-playing'); });
        spkStatus('');
        return;
      }
      markFail(btns, '朗读失败，点我重试');
    };
    /* v15 旧账3：先亮 pill 再 speak，不依赖 onstart */
    markPlay(btns);
    setTimeout(function () {
      if (myGen !== spkGen) return;
      if (!started) markFail(btns, '朗读失败，点我重试');
    }, 1500);
    try { window.speechSynthesis.speak(u); return true; }
    catch (e) { markFail(btns, '朗读失败，点我重试'); return false; }
  }

  /* 事件委托：卡片与词库列表内的喇叭共用一套逻辑 */
  function onSpeakClick(ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('[data-speak]') : null;
    if (!b) return;
    /* 汉译英防剧透：答前喇叭置灰，禁止点击朗读（避免直接泄题） */
    if (b.classList.contains('spk-locked') || b.disabled) {
      ev.preventDefault(); ev.stopPropagation();
      toast('答后可听，先作答', 1600);
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();          // 避免顺手触发翻卡 / 选中行
    /* 单路纪律：点单词喇叭时，先停掉正在播的听力音频（全站永远只有一路声） */
    if (window.Listening && window.Listening.stopAudio) { try { window.Listening.stopAudio(); } catch (e) {} }
    var txt = b.getAttribute('data-speak');
    /* 含空格（例句 / 短语动词）→ 读整句；否则按单词读（只读单词本身） */
    if (/\s/.test(txt) || txt.length > 14) speakSentence(txt);
    else speakWord(txt);
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    el = {
      deckCount: $('#deckCount'), deckBody: $('#deckBody'), deckList: $('#deckList'),
      paste: $('#pasteArea'), btnImport: $('#btnImport'), btnSample: $('#btnSample'),
      btnExportDeck: $('#btnExportDeck'), btnClearDeck: $('#btnClearDeck'),
      btnToggleDeck: $('#btnToggleDeck'),
      /* v18 0.7：模式选择移入全屏练习页（#pfMode），词库页不再有 #modeSeg */
      pfMode: $('#pfMode'), pfModeLabel: $('#pfModeLabel'),
      selSub: $('#selSub'), selSize: $('#selSize'), selScope: $('#selScope'),
      selAccent: $('#selAccent'),
      btnStart: $('#btnStart'),
      cardEmpty: $('#cardEmpty'), cardLive: $('#cardLive'),
      roundFill: $('#roundFill'), roundIdx: $('#roundIdx'),
      roundAcc: $('#roundAcc'), dueCount: $('#dueCount'),
      cardContent: $('#cardContent'), rateRow: $('#rateRow'),
      btnSkip: $('#btnSkip'), btnStop: $('#btnStop'),
      stTotal: $('#stTotal'), stAcc: $('#stAcc'), stRounds: $('#stRounds'),
      stAnswered: $('#stAnswered'), masterRing: $('#masterRing'),
      masterTxt: $('#masterTxt'), masterCnt: $('#masterCnt'),
      trendChart: $('#trendChart'), trendLast: $('#trendLast'),
      wrongList: $('#wrongList'),
      rvNum: $('#rvNum'),
      vsNew: $('#vsNew'), vsReview: $('#vsReview'), vsStreak: $('#vsStreak'),
      vsBarNew: $('#vsBarNew'), vsBarFam: $('#vsBarFam'), vsBarMst: $('#vsBarMst'),
      vsNewCnt: $('#vsNewCnt'), vsFamCnt: $('#vsFamCnt'), vsMstCnt: $('#vsMstCnt'),
      deckSearch: $('#deckSearch'), deckFilter: $('#deckFilter'),
      pfIdx: $('#pfIdx'), pfBar: $('#pfBar'), pfNext: $('#pfNext'),
      btnPracticeExit: $('#btnPracticeExit'),
      practiceFull: $('#practiceFull'), pfBody: $('#pfBody'), pfStats: $('#pfStats'),
      chkAutoSpeak: $('#chkAutoSpeak')
    };

    deck = Store.get('deck', []);
    /* 老词库兼容：补齐间隔重复字段，不丢词 */
    deck.forEach(function (d) {
      if (typeof d.seen !== 'number') d.seen = 0;
      if (typeof d.right !== 'number') d.right = 0;
      if (typeof d.wrong !== 'number') d.wrong = 0;
      if (typeof d.level !== 'number') d.level = 0;
      if (typeof d.due !== 'number') d.due = d.seen ? Date.now() : 0;
      if (typeof d.inWrong !== 'boolean') d.inWrong = !!d.wrong;
      /* v7：把 "negative adj" 这类旧词里末尾的词性缩写拆到独立 pos 字段 */
      if (typeof d.pos !== 'string') d.pos = '';
      if (!d.pos && d.w) {
        var pp = String(d.w).trim().toLowerCase().split(/\s+/);
        if (pp.length > 1 && isPos(pp[pp.length - 1])) {
          d.pos = pp.pop().replace(/\.$/, '');
          d.w = pp.join(' ');
        }
      }
      /* v8：例句字段向后兼容（旧数据无 ex 时留空，反馈卡不显示空白位） */
      if (typeof d.ex !== 'string') d.ex = '';
    });
    stats = Store.get('vstats', { rounds: 0, answered: 0, correct: 0 });
    trend = Store.get('vtrend', []);

    /* 发音：系统 speechSynthesis（用户手势解锁 + 异步语音列表）
     * 兜底层 DictAudio（本地音频 → 缓存 → 系统 TTS）已禁止静默跳过 */
    accent = Store.get('accent', 'us') === 'uk' ? 'uk' : 'us';
    autoSpeak = Store.get('autoSpeak', true) !== false;
    if (window.DictAudio) {
      DictAudio.init();
      DictAudio.setNotify(function (msg) { toast(msg, 2600); });
    }
    if (el.cardContent) el.cardContent.addEventListener('click', onSpeakClick);
    if (el.deckList) el.deckList.addEventListener('click', onSpeakClick);
    if (window.speechSynthesis) {
      loadVoices();
      if (window.speechSynthesis.addEventListener) {
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      }
      setTimeout(loadVoices, 300);
      setTimeout(loadVoices, 600);
      setTimeout(loadVoices, 900);
      /* 3 次 × 300ms 重试后仍为空（设备确实无语音）：明确提示，不再停在无意义的「载入中…」 */
      setTimeout(function () { voicesSettled = true; updateVoiceNote(); }, 1300);
    }
    if (el.selAccent) {
      el.selAccent.value = accent;
      el.selAccent.addEventListener('change', function () {
        accent = el.selAccent.value === 'uk' ? 'uk' : 'us';
        Store.set('accent', accent);
        loadVoices();
        updateVoiceNote();
        renderDeck();
        /* v14：不再把口音选择硬说成 en-GB/en-US——按实际选中的语音如实汇报，回退时明确标注 */
        (function () {
          var label = accent === 'uk' ? '英音' : '美音';
          var want = accent === 'uk' ? 'en-GB' : 'en-US';
          var v = pickVoice();
          if (v && (v.lang || '').toLowerCase().indexOf(want.toLowerCase()) === 0) {
            toast('发音已切换为' + label + ' ' + want);
          } else if (v) {
            toast('已切到' + label + '，但本机无 ' + want + ' 语音，实际使用 ' +
              v.name.replace(/\s*\(.*\)\s*$/, '') + '（' + v.lang + '）');
          } else {
            toast('已切到' + label + '，但未检测到可用英语语音');
          }
        })();
      });
    }
    if (el.chkAutoSpeak) {
      el.chkAutoSpeak.checked = autoSpeak;
      el.chkAutoSpeak.addEventListener('change', function () {
        autoSpeak = el.chkAutoSpeak.checked;
        Store.set('autoSpeak', autoSpeak);
        toast('新题自动朗读已' + (autoSpeak ? '开启' : '关闭'));
      });
    }
    /* 状态条可点：朗读失败后一键重试上一个单词 */
    var ss = document.getElementById('spkStatus');
    if (ss) ss.addEventListener('click', function () { if (lastSpkWord) speakWord(lastSpkWord); });

    buildSubOptions();
    /* v18 0.7：模式选择移入全屏练习页 #pfMode（英译汉/汉译英/拼写默写/复习队列），
       在 init 尾部统一绑定（bindPracticeMode） */
    el.selSub.addEventListener('change', function () { sub[mode] = el.selSub.value; });

    el.btnImport.addEventListener('click', function () { importWords(el.paste.value); });
    el.btnSample.addEventListener('click', function () { loadSample(); });
    el.btnExportDeck.addEventListener('click', exportDeck);
    el.btnClearDeck.addEventListener('click', function () {
      if (!deck.length) { toast('词库已经是空的'); return; }
      UI.Confirm({
        title: '清空词库',
        text: '词库与学习记录会一并删除。确定要清空吗？此操作不可恢复。',
        ok: '确定清空'
      }, function (yes) {
        if (!yes) return;
        deck = []; stats = { rounds: 0, answered: 0, correct: 0 }; trend = [];
        /* B6-2：清词库是「学习记录一并删除」，今日新学/复习/连续天数同步归零，
           否则会留着上一次测试的 2 条新学，与空词库自相矛盾。 */
        Store.set('vdaily', {});
        persist(); renderAll(); endRoundUI();
        toast('词库已清空');
      });
    });
    el.btnToggleDeck.addEventListener('click', function () {
      var hidden = el.deckBody.style.display === 'none';
      el.deckBody.style.display = hidden ? '' : 'none';
      el.btnToggleDeck.textContent = hidden ? '收起' : '展开';
    });

    /* v18 0.7：唯一开始入口——打开全屏练习页先选模式（词库页四个开始入口已并成一个） */
    el.btnStart.addEventListener('click', function () { openPractice(true); });
    el.btnSkip.addEventListener('click', function () {
      if (!round || !round.active) return;
      nextCard();
    });
    el.btnStop.addEventListener('click', function () {
      if (!round || !round.active) { toast('当前没有进行中的练习'); return; }
      round.idx = round.total; finishRound();
    });
    /* v18 0.7：原 #btnReviewToday / #btnReviewWrong 两个开始入口已撤掉
       （今日待复习数仍在复习卡显示；错词本列表仍在原面板显示） */
    if (el.deckSearch) el.deckSearch.addEventListener('input', renderDeck);
    if (el.deckFilter) el.deckFilter.addEventListener('change', renderDeck);
    if (el.btnPracticeExit) el.btnPracticeExit.addEventListener('click', confirmExit);
    if (el.pfNext) el.pfNext.addEventListener('click', onNextClick);

    bindPracticeMode();

    $$('.rate', el.rateRow).forEach(function (b) {
      b.addEventListener('click', function () { rate(parseInt(b.dataset.rate, 10)); });
    });

    renderAll();
    setInterval(renderDue, 30000);
  }

  /* 练习卡片的空状态：v18 0.7 起开始入口只有一个——空态按钮也走「选模式」流程；
     词库为空时只给文字引导（示例词表入口全站仅剩词库面板一处） */
  function renderCardEmpty() {
    if (!el.cardEmpty) return;
    if (deck.length) {
      /* super P0-5：空态不再放第二个「开始练习」，只提示入口在哪 */
      UI.Empty(el.cardEmpty, 'quiz', '准备好就点上方「开始练习」',
        '英译汉 / 汉译英 / 拼写默写 / 复习队列，开始后在内页选模式');
    } else {
      UI.Empty(el.cardEmpty, 'quiz', '词库为空，先加一些单词',
        '在上方「词库」面板粘贴自己的词表导入，或点「载入示例（50 词）」体验完整流程');
    }
  }

  /* ---------------- 词库 ---------------- */
  function persist() {
    Store.set('deck', deck);
    Store.set('vstats', stats);
    Store.set('vtrend', trend);
  }
  function usable() { return deck.filter(function (d) { return d.m && d.m.trim(); }); }

  /* 载入内置示例词表（50 词）。示例词带 src:'sample' 标记，
     与用户自己导入的词区分开；首次访问不会自动载入。 */
  function loadSample() {
    var list = window.IELTS_SAMPLE || [];
    if (!list.length) { toast('示例词表为空'); return; }
    el.paste.value = list.join('\n');
    importWords(el.paste.value, true);
  }

  /* 词性缩写表：用于把 "word pos 释义" 里的 pos 拆成独立字段 */
  var POS_MAP = {
    'adj': 'adj', 'a': 'adj', 'adjective': 'adj', 'adj.': 'adj',
    'n': 'n', 'noun': 'n', 'n.': 'n',
    'v': 'v', 'verb': 'v', 'vi': 'v', 'vt': 'v', 'v.': 'v',
    'adv': 'adv', 'adverb': 'adv', 'adv.': 'adv',
    'prep': 'prep', 'preposition': 'prep', 'prep.': 'prep',
    'conj': 'conj', 'conjunction': 'conj', 'conj.': 'conj',
    'pron': 'pron', 'pronoun': 'pron', 'pron.': 'pron',
    'num': 'num', 'numeral': 'num', 'num.': 'num',
    'art': 'art', 'article': 'art', 'art.': 'art',
    'int': 'int', 'interj': 'int', 'interjection': 'int', 'int.': 'int',
    'abbr': 'abbr', 'abbrev': 'abbr', 'abbr.': 'abbr',
    'phr': 'phr', 'phrase': 'phr', 'phr.': 'phr',
    'pl': 'pl', 'pl.': 'pl', 'sing': 'sing', 'sing.': 'sing',
    'c': 'c', 'u': 'u', 'cn': 'cn', 'unc': 'u', 'unc.': 'u'
  };
  function isPos(t) {
    return Object.prototype.hasOwnProperty.call(POS_MAP, String(t || '').toLowerCase());
  }
  function parseLine(line) {
    line = String(line || '').trim();
    if (!line) return null;
    /* 例句：用竖线 | 与主释义分隔（可选；例句只在答后反馈卡出现，不剧透、不读音节） */
    var ex = '';
    var bar = line.indexOf('|');
    if (bar >= 0) { ex = line.slice(bar + 1).trim(); line = line.slice(0, bar).trim(); }
    var m = line.match(/^([A-Za-z][A-Za-z'\-]*(?:\s+[A-Za-z][A-Za-z'\-]*)*)\s*[,，、;；\t]?\s*(.*)$/);
    if (!m) return null;
    var wRaw = m[1].trim().toLowerCase();
    var rest = (m[2] || '').trim();
    /* 词性：单词最后一个 token 若是已知缩写，则拆出（兼容 "word pos" / "word pos 释义"） */
    var parts = wRaw.split(/\s+/);
    var pos = '';
    if (parts.length > 1 && isPos(parts[parts.length - 1])) {
      pos = parts.pop().replace(/\.$/, '');
      wRaw = parts.join(' ');
    }
    var mean = rest || window.IELTS_DICT[wRaw] || '';
    return { w: wRaw, m: mean, pos: pos, ex: ex };
  }

  function importWords(text, fromSample) {
    if (window.Brand && Brand.stripHeader) text = Brand.stripHeader(text);
    var lines = String(text || '').split(/\r?\n/);
    var added = 0, updated = 0, missing = 0, skipped = 0;
    lines.forEach(function (ln) {
      var p = parseLine(ln);
      if (!p) return;
      var exist = null;
      for (var i = 0; i < deck.length; i++) { if (deck[i].w === p.w) { exist = deck[i]; break; } }
      if (exist) {
        skipped++;
        if (p.m && p.m !== exist.m) { exist.m = p.m; updated++; }
        return;
      }
      deck.push({
        w: p.w, m: p.m, pos: p.pos || '', ex: p.ex || '', seen: 0, right: 0, wrong: 0,
        level: 0, due: 0, inWrong: false, addedAt: Date.now(),
        src: fromSample ? 'sample' : 'user'
      });
      added++;
      if (!p.m) missing++;
    });
    if (!added && !updated) { toast('没有识别到有效单词，请检查格式'); return; }
    persist(); renderAll();
    toast('新增 ' + added + ' 个，跳过重复 ' + skipped + ' 个' +
      (updated ? '，更新 ' + updated + ' 条释义' : '') +
      (missing ? '，' + missing + ' 个缺释义（请在列表中补充）' : ''), 2600);
  }

  function renderDeck() {
    el.deckCount.textContent = deck.length + ' 个词';
    if (!deck.length) {
      /* v18 0.7：示例词表入口只保留词库面板的 #btnSample 一处，空态不再重复给按钮 */
      UI.Empty(el.deckList, 'cards', '词库还是空的',
        '在上方粘贴自己的词表后点「导入词表」，或点「载入示例（50 词）」跑一遍流程');
      return;
    }
    var q = (el.deckSearch && el.deckSearch.value || '').trim().toLowerCase();
    var f = (el.deckFilter && el.deckFilter.value) || 'all';
    var view = [];
    deck.forEach(function (d, i) {
      if (q) {
        var hit = d.w.toLowerCase().indexOf(q) >= 0 ||
                  (d.m || '').toLowerCase().indexOf(q) >= 0;
        if (!hit) return;
      }
      if (f === 'new' && d.seen) return;
      if (f === 'familiar' && (!d.seen || isMastered(d))) return;
      if (f === 'mastered' && !isMastered(d)) return;
      if (f === 'wrong' && !d.inWrong) return;
      view.push({ d: d, i: i });
    });
    if (!view.length) {
      el.deckList.innerHTML = '<div class="empty" style="padding:18px;text-align:center">没有符合条件的单词</div>';
      return;
    }
    el.deckList.innerHTML = view.map(function (x) {
      var d = x.d, i = x.i;
      var miss = !d.m;
      return '<div class="deck-row" data-i="' + i + '">' +
        '<span class="deck-w">' + esc(d.w) +
          (d.pos ? '<em class="deck-pos">' + esc(d.pos) + '</em>' : '') +
          spkBtn(d.w, 'spk-deck') +
          (d.src === 'sample' ? '<em class="deck-tag">示例</em>' : '') + '</span>' +
        '<input class="deck-m' + (miss ? ' is-missing' : '') + '" data-i="' + i + '" ' +
          'value="' + esc(d.m) + '" placeholder="点击补充中文释义">' +
        '<span class="due-pill' + (d.due && d.due <= Date.now() ? ' now' : '') + '">' +
          (d.seen ? fmtDue(d.due) : '未学') + '</span>' +
        '<button class="deck-del" data-i="' + i + '" title="移除">✕</button>' +
      '</div>';
    }).join('');

    $$('.deck-m', el.deckList).forEach(function (inp) {
      inp.addEventListener('change', function () {
        var d = deck[parseInt(inp.dataset.i, 10)];
        if (!d) return;
        d.m = inp.value.trim();
        inp.classList.toggle('is-missing', !d.m);
        persist(); renderStats(); renderWrong();
      });
    });
    $$('.deck-del', el.deckList).forEach(function (b) {
      b.addEventListener('click', function () {
        var i = parseInt(b.dataset.i, 10);
        var w = deck[i].w;
        deck.splice(i, 1);
        persist(); renderAll();
        toast('已移除 ' + w);
      });
    });
  }

  function exportDeck() {
    if (!deck.length) { toast('词库为空'); return; }
    var head = (window.Brand && Brand.exportHeader) ? Brand.exportHeader() : '';
    var txt = head + deck.map(function (d) {
      return d.w + (d.pos ? ' ' + d.pos : '') + '\t' + (d.m || '') + (d.ex ? ' | ' + d.ex : '');
    }).join('\n');
    var blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'IELTS词库.txt';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    toast('已导出 ' + deck.length + ' 个词');
  }

  /* ---------------- 模式选项 ---------------- */
  var SUBS = {
    en2cn: [{ v: 'choice', t: '四选一' }, { v: 'flip', t: '翻卡自测' }],
    cn2en: [{ v: 'choice', t: '四选一' }, { v: 'input', t: '输入单词' }],
    spell: [{ v: 'spell', t: '字母默写' }]
  };
  function buildSubOptions() {
    el.selSub.innerHTML = SUBS[mode].map(function (o) {
      return '<option value="' + o.v + '">' + o.t + '</option>';
    }).join('');
    el.selSub.value = sub[mode];
  }

  /* ---------------- 四选一：干扰项生成 ---------------- */
  /**
   * field = 'm' → 选项显示中文释义（英译汉）
   * field = 'w' → 选项显示英文单词（汉译英）
   * 规则：从当前词库随机取，按显示值去重，保证与正确答案不重复、四项互不重复。
   */
  function makeChoice(field) {
    var pool = shuffle(usable().filter(function (d) { return d.w !== card.w; }));
    var seen = Object.create(null);
    var out = [];
    var correctV = field === 'm' ? card.m : card.w;
    seen[correctV] = 1;
    out.push({ v: correctV, w: card.w, m: card.m });
    for (var i = 0; i < pool.length && out.length < 4; i++) {
      var v = field === 'm' ? pool[i].m : pool[i].w;
      if (!v || seen[v]) continue;
      seen[v] = 1;
      out.push({ v: v, w: pool[i].w, m: pool[i].m });
    }
    if (out.length < 4) return null;           // 词库不足以支撑四选一
    return shuffle(out);
  }

  /* ---------------- 解析面板 ---------------- */
  function explainHtml(mode2, selected, correct) {
    var ok = selected === correct;
    var rows = '';
    rows += '<div class="fb-card"><b>' + esc(card.w) +
      (card.pos ? '<span class="fb-pos">' + esc(card.pos) + '</span>' : '') +
      '</b>' +
      '<span>' + esc(card.m) + '</span>' +
      '<button class="fb-listen" type="button" data-speak="' + esc(card.w) + '">再听一遍</button></div>';
    if (card.ex) {
      rows += '<div class="fb-ex"><span class="lb">例句</span>' +
        '<span class="ex">' + esc(card.ex) + '</span>' +
        '<button class="fb-listen sm" type="button" data-speak="' + esc(card.ex) + '">🔊</button></div>';
    }
    rows += '<div class="row"><span class="lb">你的' + (mode2 === 'spell' ? '拼写' : '选择') +
      '</span><span class="vl ' + (ok ? 'ok-t' : 'bad-t') + '">' +
      esc(selected || '（未作答）') + (ok ? '  ✓' : '  ✕') + '</span></div>';
    rows += '<div class="row"><span class="lb">正确答案</span><span class="vl ok-t">' +
      esc(correct) + '</span></div>';

    if (optMeta.length) {
      rows += '<hr><div class="dis">选项逐项对照</div>';
      optMeta.forEach(function (o) {
        var isC = o.v === correct;
        rows += '<div class="row"><span class="lb">' + (isC ? '✓' : '·') +
          '</span><span class="vl"><b>' + esc(o.w) + '</b> — ' + esc(o.m) + '</span></div>';
      });
    }
    rows += '<hr><div class="dis">' + esc(card.w) + ' 累计答对 <b>' + card.right +
      '</b> 次 · 答错 <b>' + card.wrong + '</b> 次' +
      (card.inWrong ? ' · 当前在错词本中' : '') + '</div>';
    return '<div class="explain">' + rows + '</div>';
  }

  /* ---------------- 组一轮 ---------------- */
  function startRound() {
    var pool = usable();
    if (!pool.length) {
      toast('词库为空或有单词缺少释义，请先导入并补全释义');
      return;
    }
    var scope = el.selScope.value;
    var list = pool.slice();
    deck.forEach(function (d) { delete d._requeued; });
    if (scope === 'wrong') list = list.filter(function (d) { return d.inWrong; });
    else if (scope === 'new') list = list.filter(function (d) { return !d.seen; });
    else if (scope === 'due') {
      var now0 = Date.now();
      list = list.filter(function (d) { return !d.due || d.due <= now0; });
      list.sort(function (a, b) {
        return (a.inWrong ? 0 : 1) - (b.inWrong ? 0 : 1) || (a.due || 0) - (b.due || 0);
      });
    }

    if (!list.length) {
      toast(scope === 'wrong' ? '错词本还是空的' :
            scope === 'new' ? '所有单词都学过了' : '没有可练习的单词');
      return;
    }
    var size = parseInt(el.selSize.value, 10);
    var queue = shuffle(list);
    if (scope === 'due') queue = shuffle(list.slice(0, size || list.length));
    else if (size > 0) queue = queue.slice(0, size);

    // 四选一需要至少 4 个有释义的单词
    if (sub[mode] === 'choice' && pool.length < 4) {
      toast('四选一至少需要 4 个有释义的单词，已切换为自测形式');
      sub[mode] = mode === 'en2cn' ? 'flip' : 'input';
      buildSubOptions();
    }

    /* B1-2：此处不再 stats.rounds++（此前一开题轮次就 +1，换个模式又 +1）；
       完成轮次统一在 finishRound() 里加，且每轮只加一次。 */
    round = { queue: queue, idx: 0, total: queue.length, ok: 0, answered: 0, active: true, wrongList: [] };
    persist();
    el.cardEmpty.hidden = true;
    el.cardLive.hidden = false;
    /* v18 0.7：模式已选定——收起模式选择层，顶部显示当前模式标签 */
    if (el.pfMode) el.pfMode.hidden = true;
    if (el.pfModeLabel) {
      el.pfModeLabel.hidden = false;
      el.pfModeLabel.textContent = MODE_NAMES[mode] || mode;
    }
    openPractice();
    unlockVoice();
    renderStats();
    nextCard();
  }
  function nextCard() {
    if (!round || !round.active) return;
    if (round.idx >= round.total) { finishRound(); return; }
    card = round.queue[round.idx];
    locked = false;
    optMeta = [];
    el.rateRow.hidden = true;
    if (el.practiceFull) el.practiceFull.classList.remove('is-result');
    renderProgress();
    renderCard();
    /* 新题自动朗读（汉译英会剧透答案，故不自动读；受「新题自动朗读」开关控制）。
     * isAuto=true：看门狗兜底前会检查「是否已作答/已翻题」，过期不重读（v15 旧账1） */
    if (mode !== 'cn2en' && autoSpeak) speakWord(card.w, true);
  }

  var roundBar = null;
  function renderProgress() {
    if (!roundBar) roundBar = UI.Progress(el.roundFill.parentNode, el.roundFill);
    var pct = round.total ? (round.idx / round.total) * 100 : 0;
    roundBar.set(pct);
    var idxTxt = '第 ' + (round.idx + 1) + ' / ' + round.total + ' 题';
    el.roundIdx.textContent = idxTxt;
    if (el.pfIdx) el.pfIdx.textContent = idxTxt;
    if (el.pfBar) el.pfBar.style.width = pct + '%';
    if (el.pfStats) {
      el.pfStats.textContent = '已答 ' + (round.answered || 0) + ' / ' + round.total +
        ' · 正确率 ' + (round.answered ? Math.round((round.ok / round.answered) * 100) + '%' : '—');
    }
    el.roundAcc.textContent = round.answered
      ? Math.round((round.ok / round.answered) * 100) + '%' : '—';
  }

  /* ---------------- 卡片渲染 ---------------- */
  function renderCard() {
    var c = el.cardContent;
    if (mode === 'en2cn' && sub.en2cn === 'flip') {
      c.innerHTML =
        '<div class="flip" id="flipCard">' +
          '<div class="flip-inner">' +
            '<div class="flip-face front"><div>' +
            '<div class="big">' + esc(card.w) +
              (card.pos ? '<span class="q-pos-big">' + esc(card.pos) + '</span>' : '') +
            '</div>' +
            '<div class="spk-row-center">' + spkBtn(card.w, 'spk-head') + '</div>' +
            '<div class="tip">点击卡片翻到中文释义，点喇叭听发音</div>' +
            '</div></div>' +
            /* B1-5：背面同样显示英文词 + 喇叭（与正面同一发音入口），
               不用翻回正面也能重听 */
            '<div class="flip-face back"><div>' +
              '<div class="big">' + esc(card.w) +
                (card.pos ? '<span class="q-pos-big">' + esc(card.pos) + '</span>' : '') +
              '</div>' +
              '<div class="spk-row-center">' + spkBtn(card.w, 'spk-head') + '</div>' +
              '<div class="cn">' + esc(card.m) + '</div>' +
              '<div class="tip">再点一次可翻回正面</div>' +
            '</div></div>' +
          '</div>' +
        '</div>';
      var f = $('#flipCard');
      f.addEventListener('click', function (e) {
        /* B1-5：点背面喇叭只发音，不翻面 */
        if (e.target && e.target.closest && e.target.closest('[data-speak]')) return;
        f.classList.toggle('is-flipped');
        if (f.classList.contains('is-flipped')) showRate();
      });
      return;
    }

    if (sub[mode] === 'choice') {
      var field = (mode === 'en2cn') ? 'm' : 'w';
      var meta = makeChoice(field);
      if (!meta) {                       // 兜底：退回自测形式
        sub[mode] = mode === 'en2cn' ? 'flip' : 'input';
        buildSubOptions();
        renderCard();
        return;
      }
      optMeta = meta;
      var head = mode === 'en2cn'
        ? '<div class="q-head">' +
            '<span class="q-word">' + esc(card.w) +
              (card.pos ? '<span class="q-pos">' + esc(card.pos) + '</span>' : '') +
            '</span>' +
            spkBtn(card.w, 'spk-head') +
          '</div>' +
          '<div class="q-sub">选择对应的中文释义（点喇叭可听发音）</div>'
        : '<div class="q-head">' +
            '<span class="q-word small">' + esc(card.m) + '</span>' +
            spkBtnLocked(card.w) +
          '</div>' +
          '<div class="q-sub">选择对应的英文单词（答后可听发音，防剧透）</div>';
      c.innerHTML = head + '<div class="opts" id="optBox"></div><div id="expBox"></div>';
      var box = $('#optBox');
      var oi = UI.Options(box, {
        items: meta.map(function (o) { return o.v; }),
        onPick: function (val) {
          oi.lock();
          var correct = field === 'm' ? card.m : card.w;
          oi.mark(correct, val);
          $('#expBox').innerHTML = explainHtml(mode, val, correct);
          answer(val === correct);
        }
      });
      return;
    }

    if (mode === 'cn2en' && sub.cn2en === 'input') {
      c.innerHTML =
        '<div class="q-head">' +
          '<span class="q-word small">' + esc(card.m) + '</span>' +
          spkBtnLocked(card.w) +
        '</div>' +
        '<div class="q-sub">写出对应的英文单词（答后可听发音，防剧透）</div>' +
        '<div class="type-row"><input class="inp" id="typeInp" autocomplete="off" ' +
        'spellcheck="false" placeholder="输入英文单词后回车"><button class="btn btn-primary" id="typeGo">提交</button></div>' +
        '<div id="expBox"></div>';
      bindType(function (val) {
        var ok = norm(val) === norm(card.w);
        $('#expBox').innerHTML = explainHtml(mode, val, card.w);
        answer(ok);
      });
      return;
    }

    // 拼写默写
    var n = card.w.length, slots = '';
    for (var i = 0; i < n; i++) slots += '<div class="slot miss" data-i="' + i + '"></div>';
    c.innerHTML =
      '<div class="q-head">' +
        '<span class="q-word small">' + esc(card.m) + '</span>' +
        spkBtn(card.w, 'spk-head') +
      '</div>' +
      '<div class="q-sub">拼写默写 · 共 ' + n + ' 个字母，首字母 ' + esc(card.w[0]) +
        '（点喇叭可无限重听，只读单词）</div>' +
      '<div class="spell-slots" id="slots">' + slots + '</div>' +
      '<div class="type-row"><input class="inp" id="typeInp" autocomplete="off" ' +
      'spellcheck="false" placeholder="输入完整单词后回车"><button class="btn btn-primary" id="typeGo">提交</button></div>' +
      '<div id="expBox"></div>';
    var inp = $('#typeInp');
    inp.addEventListener('input', function () { paintSlots(inp.value, false); });
    bindType(function (val) {
      var hit = paintSlots(val, true);
      var ok = norm(val) === norm(card.w);
      $('#expBox').innerHTML = explainHtml('spell', val, card.w) +
        '<div class="verdict ' + (ok ? 'ok' : 'bad') + '">' +
        (ok ? '拼写完全正确' : '字母正确率 ' + hit + '%') + '</div>';
      answer(ok);
    });
  }

  function norm(s) { return String(s || '').trim().toLowerCase(); }

  function bindType(cb) {
    var inp = $('#typeInp'), go = $('#typeGo');
    function submit() {
      if (locked) return;
      if (!inp.value.trim()) { toast('先输入答案'); return; }
      locked = true;
      inp.disabled = true; go.disabled = true;
      cb(inp.value);
    }
    go.addEventListener('click', submit);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    inp.focus();
  }

  function paintSlots(val) {
    var target = norm(card.w);
    var typed = String(val || '').trim().toLowerCase();
    var hit = 0;
    $$('#slots .slot', el.cardContent).forEach(function (s, i) {
      var ch = typed[i];
      s.classList.remove('ok', 'bad', 'miss');
      if (ch == null) { s.textContent = ''; s.classList.add('miss'); return; }
      s.textContent = ch;
      if (ch === target[i]) { s.classList.add('ok'); hit++; }
      else { s.classList.add('bad'); }
    });
    return Math.round((hit / target.length) * 100);
  }

  function showRate() { el.rateRow.hidden = false; }

  /* ---------------- 判定与间隔重复 ---------------- */
  /* v17 补丁第 3 轮 B1-1：每词「累计答对/答错」的唯一落账点。
     此前只有 rate()（翻卡）写 card.right/wrong，客观题走 answer() 从不写，
     所以卡片上一直显示 0/0。现在两种模式都经这里，同一时机（作答当刻）。 */
  function applyCardResult(c, ok, fuzzy) {
    var wasNew = !c.seen;
    c.seen++;
    if (ok) {
      c.right++;
      c.level = Math.min(c.level + 1, GAP.length - 1);
      c.due = Date.now() + GAP[c.level] * 60000;
      if (c.right >= 2) c.inWrong = false;
    } else if (fuzzy) {
      c.due = Date.now() + 20 * 60000;
      c.level = Math.max(0, c.level - 1);
      if (!c.inWrong && c.right < 2) c.inWrong = true;
    } else {
      c.wrong++;
      c.level = 0;
      c.due = Date.now() + GAP[0] * 60000;
      c.inWrong = true;
    }
    bumpDaily(wasNew);
    /* B1-3：答错的词只进错词本/复习队列，不再往本轮队列里塞——
       轮次长度固定（此前塞进去会把 20 题无声变成 21 题）。 */
    if (!ok) {
      if (!round.wrongList.some(function (d) { return d.w === c.w; })) {
        round.wrongList.push(c);
      }
    }
  }

  /* B1-1：反馈卡渲染在判定之前（先出对照再判定），所以计数行要在判定后补刷一次，
     否则用户看到的是作答前的 0/0。 */
  function refreshFbCounts() {
    var box = $('#expBox');
    if (!box || !card) return;
    var list = box.querySelectorAll('.dis');
    if (!list.length) return;
    var last = list[list.length - 1];
    if (String(last.textContent).indexOf('累计答对') < 0) return;
    last.innerHTML = esc(card.w) + ' 累计答对 <b>' + card.right + '</b> 次 · 答错 <b>' +
      card.wrong + '</b> 次' + (card.inWrong ? ' · 当前在错词本中' : '');
  }

  function answer(ok) {
    if (window.Feedback) window.Feedback.playChime(ok);   /* v13：判定瞬间播放提示音（先提示音） */
    round.answered++;
    if (ok) round.ok++;
    stats.answered++;
    if (ok) stats.correct++;
    card._ok = ok;
    applyCardResult(card, ok, false);       /* B1-1：每词计数随作答立即 +1 */
    refreshFbCounts();                      /* B1-1：反馈卡里的「累计答对/答错」同步刷新 */
    renderProgress();
    renderStats(); renderDeck(); renderWrong();   /* B1-7：总统计当刻刷新，不等下一题 */
    /* 汉译英防剧透：答后才解锁题面喇叭（解锁前它一直是置灰的「答后可听」） */
    if (mode === 'cn2en') {
      $$('#cardContent .spk-locked').forEach(function (b) {
        b.classList.remove('spk-locked'); b.disabled = false;
        b.removeAttribute('aria-disabled');
        b.title = '朗读发音（' + (accent === 'uk' ? '英音' : '美音') + '）';
        b.setAttribute('aria-label', '朗读');
      });
    }
    attachFeedback(ok);
    if (mode === 'en2cn' && sub.en2cn === 'flip') showRate();
    else showNext(ok ? 2 : 0, true);   /* 客观题：立即判对错，出现「下一题」 */
    persist();
  }

  /* 答后反馈（三种模式同一套）：v14 起删除「答错自动重读」——
     答错链路只剩「答错提示音 + 手动再听」，8 秒内不得有任何自动朗读 */
  function attachFeedback(ok) {
    var box = $('#expBox');
    if (!box) return;
    /* B1-4：选择/拼写模式的反馈卡里已有「再听一遍」(.fb-listen)，
       此处不再追加，避免同屏两个按钮；翻卡模式没有反馈卡，才补一个。 */
    if (box.querySelector('.fb-listen, .spk-again')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-ghost spk-again';
    b.setAttribute('data-speak', card.w);       // 走统一朗读逻辑（只读单词本身）；仅手动点按才播
    b.innerHTML = '🔊 再听一遍';
    box.appendChild(b);
  }

  function rate(r, thenNext) {
    if (!card) return;
    if (card._ok === undefined) {           // 翻卡模式尚未判定
      /* v13：翻卡模式判定瞬间提示音——认识=对、不认识=错、模糊=中性不响。
         客观题（四选一/拼写）的判定瞬间在 answer() 已响过，此处不重复响。 */
      if (window.Feedback) {
        if (r === 2) window.Feedback.playCorrect();
        else if (r === 0) window.Feedback.playWrong();
      }
      round.answered++;
      stats.answered++;
      if (r === 2) { round.ok++; stats.correct++; card._ok = true; }
      else card._ok = false;
      renderProgress();
      /* B1-1：翻卡也在作答当刻落账（与客观题同一函数、同一时机） */
      applyCardResult(card, r === 2, r === 1);
    }
    delete card._ok;
    persist();
    renderStats(); renderWrong(); renderDeck();
    el.rateRow.hidden = true;
    if (thenNext) goNext();
    else showNext(r, false);   /* 翻卡：评分后出现「下一题」，不自动跳 */
  }

  function finishRound() {
    if (!round) return;
    round.active = false;
    /* B1-2：只有「答完本轮全部题目」才算完成一轮；
       中途点停止、切换模式、换范围都不计。 */
    if (!round._counted && round.total > 0 && round.answered >= round.total) {
      round._counted = true; stats.rounds++;
    }
    if (el.pfNext) el.pfNext.hidden = true;
    if (el.pfBody) el.pfBody.classList.add('is-result');
    var acc = round.answered ? Math.round((round.ok / round.answered) * 100) : 0;
    if (round.answered) { pushTrend(acc, round.answered); persist(); }
    var wrongs = (round.wrongList || []).slice();

    el.cardContent.innerHTML =
      '<div style="text-align:center;padding:14px 0 4px">' +
        '<div style="font-size:40px;font-weight:700;letter-spacing:-1px">' + round.ok +
          ' / ' + round.answered + '</div>' +
        '<div class="q-sub" style="margin-top:2px">本轮得分 · 正确率 ' + acc + '%</div>' +
        '<div style="margin-top:20px;display:flex;gap:9px;justify-content:center;flex-wrap:wrap">' +
          (wrongs.length ? '<button class="btn btn-primary" id="retryWrongBtn">重练错词（' + wrongs.length + '）</button>' : '') +
          '<button class="btn" id="backDeckBtn">返回词库</button>' +
        '</div>' +
        (wrongs.length ? '<div style="margin-top:22px;text-align:left">' +
          '<div class="q-sub" style="text-align:left;margin-bottom:8px">本轮错词</div>' +
          wrongs.map(function (d) {
            return '<div class="wrong-row"><span class="w">' + esc(d.w) + '</span>' +
              '<span class="m">' + esc(d.m) + '</span></div>';
          }).join('') + '</div>' : '') +
      '</div>';

    var w = $('#retryWrongBtn');
    if (w) w.addEventListener('click', function () { startCustom(wrongs); });
    var back = $('#backDeckBtn');
    if (back) back.addEventListener('click', function () { endRoundUI(); closePractice(); });
    el.rateRow.hidden = true;
    renderStats(); renderWrong();
    toast('本轮完成 · 正确率 ' + acc + '%', 2600);
  }

  /* 只练指定的一组词（本轮错词） */
  function startCustom(list) {
    if (!list || !list.length) return;
    deck.forEach(function (d) { delete d._requeued; });
    round = { queue: shuffle(list.slice()), idx: 0, total: list.length,
              ok: 0, answered: 0, active: true, wrongList: [] };
    persist();
    el.cardEmpty.hidden = true;
    el.cardLive.hidden = false;
    /* v18 0.7：模式已选定——收起模式选择层，顶部显示当前模式标签 */
    if (el.pfMode) el.pfMode.hidden = true;
    if (el.pfModeLabel) {
      el.pfModeLabel.hidden = false;
      el.pfModeLabel.textContent = MODE_NAMES[mode] || mode;
    }
    openPractice();
    unlockVoice();
    renderStats();
    nextCard();
  }

  /* ---------------- 每日学习记录 ---------------- */
  function dkey() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function bumpDaily(wasNew) {
    var all = Store.get('vdaily', {});
    if (!all || typeof all !== 'object') all = {};
    var k = dkey();
    if (!all[k]) all[k] = { new: 0, review: 0 };
    if (wasNew) all[k].new++;
    else all[k].review++;
    Store.set('vdaily', all);
  }
  function streakDays() {
    var all = Store.get('vdaily', {}) || {};
    var n = 0, d = new Date();
    for (;;) {
      var p = function (x) { return (x < 10 ? '0' : '') + x; };
      var k = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
      if (!all[k]) break;
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }
  function isMastered(d) { return d.right >= 2 && d.wrong === 0; }

  function endRoundUI() {
    el.cardEmpty.hidden = false;
    el.cardLive.hidden = true;
    el.cardContent.innerHTML = '';
    el.rateRow.hidden = true;
    round = null;
    renderCardEmpty();
  }

  /* ---------------- 全屏练习页 ---------------- */
  /* v18 0.7：openPractice(modeSelect)
   * modeSelect=true：只打开模式选择层（#pfMode），练习卡 #cardLive 收起，
   *   等用户在四个模式里选一个（chooseMode）后才真正开始一轮；
   * 不传 / false：模式已定，直接显示练习卡（startRound/startCustom 内部调用）。 */
  function openPractice(modeSelect) {
    var pf = el.practiceFull, body = el.pfBody;
    var live = document.getElementById('cardLive');
    if (!pf || !body || !live) return;
    if (live.parentNode !== body) body.appendChild(live);
    pf.classList.add('is-open');
    pf.setAttribute('aria-hidden', 'false');
    document.body.classList.add('practice-open');
    if (el.pfNext) el.pfNext.hidden = true;
    if (el.pfBody) el.pfBody.classList.remove('is-result');
    if (modeSelect) {
      if (el.pfMode) el.pfMode.hidden = false;
      live.hidden = true;
      if (el.pfModeLabel) el.pfModeLabel.hidden = true;
      if (el.pfIdx) el.pfIdx.textContent = '选择模式';
      if (el.pfBar) el.pfBar.style.width = '0%';
      if (el.pfStats) el.pfStats.textContent = '已答 0 / 0 · 正确率 —';
    } else {
      if (el.pfMode) el.pfMode.hidden = true;
      live.hidden = false;
    }
  }

  /* v18 0.7：模式选择层四个入口的绑定（英译汉 / 汉译英 / 拼写默写 / 复习队列） */
  function bindPracticeMode() {
    if (!el.pfMode) return;
    $$('.pf-mode-btn', el.pfMode).forEach(function (b) {
      b.addEventListener('click', function () {
        var m = b.getAttribute('data-mode');
        /* 复习队列 = 范围强制「今日待复习优先」，方向沿用当前 mode（默认英译汉） */
        if (m === 'review') {
          el.selScope.value = 'due';
          mode = (mode === 'cn2en' || mode === 'spell') ? mode : 'en2cn';
        } else {
          mode = m;
        }
        buildSubOptions();
        startRound();
      });
    });
  }

  function closePractice() {
    var pf = el.practiceFull;
    var wrap = document.getElementById('cardWrap');
    var live = document.getElementById('cardLive');
    if (pf) {
      pf.classList.remove('is-open');
      pf.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('practice-open');
    if (live && wrap && live.parentNode !== wrap) {
      wrap.appendChild(live);
      live.hidden = true;
    }
  }

  function confirmExit() {
    UI.Confirm({
      title: '退出练习',
      text: '结束本轮并返回词库页？已答的单词会立刻保存（含答对/答错次数），只是这一轮没做完，不计入完成轮次。',
      ok: '结束并返回'
    }, function (yes) {
      if (!yes) return;
      endRoundUI();
      closePractice();
    });
  }

  /* 「下一题」：四选一/拼写先记分再前进；翻卡已记分，直接前进 */
  function showNext(r, needRate) {
    var b = el.pfNext;
    if (!b) return;
    b.dataset.rate = String(r);
    b.dataset.need = needRate ? '1' : '0';
    b.textContent = '下一题';
    b.hidden = false;
  }

  function goNext() {
    if (el.pfNext) el.pfNext.hidden = true;
    if (!round || !round.active) return;
    round.idx++;
    nextCard();
  }

  function onNextClick() {
    if (!el.pfNext) return;
    var r = parseInt(el.pfNext.dataset.rate || '2', 10);
    if (el.pfNext.dataset.need === '1') rate(r, true);
    else goNext();
  }

  /* ---------------- 侧栏 ---------------- */
  var RING_C = 2 * Math.PI * 52;      /* 与 index.html 里 r=52 的圆周长一致 */

  function renderStats() {
    el.stTotal.textContent = deck.length;
    el.stAcc.textContent = stats.answered
      ? Math.round((stats.correct / stats.answered) * 100) + '%' : '—';
    el.stRounds.textContent = stats.rounds;
    el.stAnswered.textContent = stats.answered;

    var mastered = deck.filter(function (d) { return d.right >= 2 && d.wrong === 0; }).length;
    var pct = deck.length ? Math.round((mastered / deck.length) * 100) : 0;
    if (el.masterCnt) el.masterCnt.textContent = mastered + ' / ' + deck.length;
    if (el.masterTxt) el.masterTxt.textContent = pct + '%';
    if (el.masterRing) {
      el.masterRing.setAttribute('stroke-dasharray', RING_C.toFixed(1));
      el.masterRing.setAttribute('stroke-dashoffset', (RING_C * (1 - pct / 100)).toFixed(1));
      el.masterRing.classList.toggle('is-empty', pct === 0);
    }
    renderTrend();
    renderDue();
    updateDailyStrip();
  }

  /* 近 8 轮正确率趋势（柱状） */
  function renderTrend() {
    if (!el.trendChart) return;
    var list = trend.slice(-8);
    if (!list.length) {
      el.trendChart.innerHTML = '<span class="trend-none">完成一轮后这里会出现正确率趋势</span>';
      if (el.trendLast) el.trendLast.textContent = '—';
      return;
    }
    if (el.trendLast) el.trendLast.textContent = list[list.length - 1].acc + '%';
    el.trendChart.innerHTML = list.map(function (t) {
      return '<span class="trend-bar" title="' + t.n + ' 题 · ' + t.acc + '%">' +
        '<i style="height:' + Math.max(4, t.acc) + '%"></i>' +
        '<em>' + t.acc + '</em></span>';
    }).join('');
  }

  function pushTrend(acc, n) {
    trend.push({ acc: acc, n: n, at: Date.now() });
    if (trend.length > 30) trend = trend.slice(-30);
  }

  function renderDue() {
    var n = deck.filter(function (d) {
      return d.m && d.due && d.due <= Date.now();
    }).length;
    if (el.dueCount) el.dueCount.textContent = n;
    if (el.rvNum) el.rvNum.textContent = n;
  }

  /* 今日新学 / 今日复习 / 连续学习 / 掌握度三段色带 */
  function updateDailyStrip() {
    var all = Store.get('vdaily', {}) || {};
    var today = all[dkey()] || { new: 0, review: 0 };
    if (el.vsNew) el.vsNew.textContent = today.new || 0;
    if (el.vsReview) el.vsReview.textContent = today.review || 0;
    if (el.vsStreak) el.vsStreak.textContent = streakDays();

    var nNew = 0, nFam = 0, nMst = 0;
    deck.forEach(function (d) {
      if (!d.seen) nNew++;
      else if (isMastered(d)) nMst++;
      else nFam++;
    });
    var total = deck.length || 1;
    if (el.vsBarNew) el.vsBarNew.style.width = (nNew / total * 100) + '%';
    if (el.vsBarFam) el.vsBarFam.style.width = (nFam / total * 100) + '%';
    if (el.vsBarMst) el.vsBarMst.style.width = (nMst / total * 100) + '%';
    if (el.vsNewCnt) el.vsNewCnt.textContent = nNew;
    if (el.vsFamCnt) el.vsFamCnt.textContent = nFam;
    if (el.vsMstCnt) el.vsMstCnt.textContent = nMst;
  }

  function renderWrong() {
    var list = deck.filter(function (d) { return d.inWrong; })
      .sort(function (a, b) { return (a.due || 0) - (b.due || 0); });
    if (!list.length) {
      /* super P0-5：错词本空态不再自带开始按钮，保持全站只有一个入口 */
      UI.Empty(el.wrongList, 'cards', '错词本是空的',
        '答错或标记为「不认识」的单词会进入这里，并按间隔重复排期复习');
      return;
    }
    el.wrongList.innerHTML = list.map(function (d) {
      var now = d.due && d.due <= Date.now();
      return '<div class="wrong-row">' +
        '<span class="w">' + esc(d.w) + '</span>' +
        '<span class="m">' + esc(d.m || '（缺释义）') + '</span>' +
        '<span class="due-pill' + (now ? ' now' : '') + '">' + fmtDue(d.due) + '</span>' +
        '<button class="deck-del" data-w="' + esc(d.w) + '" title="移出错词本">✓</button>' +
      '</div>';
    }).join('');
    $$('.deck-del', el.wrongList).forEach(function (b) {
      b.addEventListener('click', function () {
        var w = b.dataset.w;
        deck.forEach(function (d) {
          if (d.w === w) { d.inWrong = false; d.due = Date.now() + 60 * 60000; }
        });
        persist(); renderWrong(); renderDeck();
        toast(w + ' 已移出错词本');
      });
    });
  }

  function renderAll() {
    renderDeck();
    renderStats();
    renderWrong();
    if (!round || !round.active) renderCardEmpty();
  }

  /* 供听力模块复用同一套声音（v12：单路互斥 + 同源语音 + 同一解锁/失败兜底） */
  function stopSpeak() {
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
  }

  /* v16：「我的」抽屉 / 顶栏「复习」入口 —— 直接开一轮指定范围练习（不切视图，
   * 视图切换由调用方负责；逻辑与词库界面两个复习按钮完全一致） */
  function startWrong() {
    el.selScope.value = 'wrong';
    startRound();
  }
  function startDue() {
    el.selScope.value = 'due';
    startRound();
  }
  /* 智能选轮：今日待复习 > 0 开复习轮；否则错词本 > 0 开错词轮；都空则提示 */
  function startReview() {
    var now0 = Date.now();
    var due = deck.filter(function (d) { return d.m && d.due && d.due <= now0; }).length;
    if (due > 0) { startDue(); return; }
    var wrong = deck.filter(function (d) { return d.inWrong; }).length;
    if (wrong > 0) { startWrong(); return; }
    toast('暂时没有待复习的单词，去学几个新词吧');
  }

  return {
    init: init, refresh: renderAll,
    getVoiceLang: function () { return accent === 'uk' ? 'en-GB' : 'en-US'; },
    pickVoice: pickVoice,
    ensureVoice: unlockVoice,
    stopSpeak: stopSpeak,
    startWrong: startWrong,
    startDue: startDue,
    startReview: startReview
  };
})();
