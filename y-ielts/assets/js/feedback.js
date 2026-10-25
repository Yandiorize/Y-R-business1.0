/* IELTS CBT · 答题提示音模块（v13）
 * 头号特性：答对 / 答错 提示音
 *  - 纯 Web Audio 现场合成，不依赖外部音频文件、不接付费 API、离线可用；
 *  - 不接系统 TTS（避免与单词发音串音、且 TTS 慢）；
 *  - 单路纪律：提示音时停掉单词发音与听力音频，全站永远只有一路声；
 *  - 提示音时长短（≤0.5s）、不循环、不连播成串；
 *  - 独立「提示音」开关（Store 'chime'，默认开），与「发音」开关分开。
 */
(function () {
  var KEY = 'chime';
  var ctx = null;
  /* 默认开：仅当用户明确存过 false 才关闭 */
  var enabled = (Store.get(KEY, true) !== false);

  /* AudioContext 懒加载，并在用户手势链内 resume（浏览器自动播放策略） */
  function ensureCtx() {
    try {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    } catch (e) { ctx = null; }
    return ctx;
  }

  function unlock() { ensureCtx(); }

  /* 单音：频率 / 起始(秒) / 时长(秒) / 波形 / 峰值增益 */
  function tone(freq, start, dur, type, peak) {
    if (!ctx) return;
    var t0 = ctx.currentTime + start;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak || 0.18, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  /* 单路纪律：播提示音前停掉单词发音与听力音频，避免叠音 */
  function stopOthers() {
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    try { if (window.Vocab && window.Vocab.stopSpeak) window.Vocab.stopSpeak(); } catch (e) {}
    try { if (window.Listening && window.Listening.stopAudio) window.Listening.stopAudio(); } catch (e) {}
  }

  /* 答对：清脆上扬——两声短音 C5(523.25) → E5(659.25)，每声 ~0.14s，总 ~0.31s
   * v15 0.3：增益 0.16 → 0.34（约 2 倍，外放/耳机均可闻）；
   * 两声首尾不相叠（0→0.14s / 0.15s→0.29s），叠加峰值不超单音 0.34，无削顶 */
  function playCorrect() {
    if (!enabled) return false;
    if (!ensureCtx()) return false;
    stopOthers();
    tone(523.25, 0.00, 0.14, 'triangle', 0.34);
    tone(659.25, 0.15, 0.14, 'triangle', 0.34);
    return true;
  }

  /* 答错：低沉短音——A3(220) 单音，时长 ~0.22s
   * v15 0.3：增益 0.22 → 0.40（单音峰值 0.40 < 1.0，无削顶；音色/时长不变） */
  function playWrong() {
    if (!enabled) return false;
    if (!ensureCtx()) return false;
    stopOthers();
    tone(220.00, 0.00, 0.22, 'sine', 0.40);
    return true;
  }

  function playChime(ok) { return ok ? playCorrect() : playWrong(); }

  /* 错后读词：提示音播完再读，避免与「答错重读」「再听一遍」叠音；
   * 若提示音关闭或无需延迟，则立即执行 */
  function afterChime(fn, delay) {
    if (!fn) return;
    var d = (enabled && delay != null) ? delay : 0;
    if (d > 0) setTimeout(fn, d); else fn();
  }

  function setEnabled(v) {
    enabled = !!v;
    Store.set(KEY, enabled);
    if (enabled) ensureCtx();      /* 切换开启时顺手在手势内解锁 */
  }

  function isEnabled() { return enabled; }

  /* 首次任意手势解锁音频上下文（保险，主解锁仍在判定手势内） */
  function attachUnlock() {
    var once = function () {
      ensureCtx();
      window.removeEventListener('pointerdown', once);
      window.removeEventListener('keydown', once);
    };
    window.addEventListener('pointerdown', once, { passive: true });
    window.addEventListener('keydown', once);
  }

  window.Feedback = {
    playCorrect: playCorrect,
    playWrong: playWrong,
    playChime: playChime,
    afterChime: afterChime,
    setEnabled: setEnabled,
    isEnabled: isEnabled,
    unlock: unlock,
    attachUnlock: attachUnlock,
    isSupported: function () { return !!(window.AudioContext || window.webkitAudioContext); }
  };
})();
