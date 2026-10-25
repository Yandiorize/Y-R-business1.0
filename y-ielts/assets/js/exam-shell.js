/* ============================================================
 *  考试壳 · 作答全屏（ui-iter v11）
 *  ---------------------------------------------------------------
 *  · 只管一件事：阅读 / 听力 / 写作进入作答态时，给 <body> 打
 *    exam-answering class（CSS 视口填充，不用浏览器 Fullscreen API），
 *    退出 / 交卷 / 切视图时摘掉。计时、交卷、评分逻辑一字不动。
 *  · 进入分两种：
 *      显式开始（force）：直接开始 / 开始计时 / 播放 / 重新作答——
 *      哪怕刚退出过也能重新进入（用户明确要再开始）。
 *      连续触发（非 force）：首次作答输入、编辑器输入——退出后不再
 *      自动重进（退出 = “这轮我要正常布局”，直到显式开始或切视图重进）。
 *  · 退出（exit）：摘 class + 记 suppression（本视图内不再自动重进）
 *    + 阅读恢复空白卷提示条（rStart）；不交卷、不清作答、不停计时。
 *  · 切视图（noteViewChange）：摘 class + 清空 suppression（重进视为
 *    新的一轮），再按各模块 wantsFullscreen() 派生——进行中的卷子
 *    切回来自动恢复全屏，未开始 / 已交卷的不进全屏。
 *  · 退出按钮绑定：#examExit（考试 HUD 内，阅读/听力共用）与
 *    #wBtnExit（写作工具栏内）；按钮本身只在作答态可见（CSS 控制）。
 * ============================================================ */
(function () {
  'use strict';

  var suppressed = {};

  function currentView() {
    return document.body ? document.body.getAttribute('data-view') : null;
  }

  function apply(on) {
    if (document.body) document.body.classList.toggle('exam-answering', !!on);
  }

  function enter(view, force) {
    if (!view) view = currentView();
    if (!view) return;
    if (force) suppressed[view] = false;
    else if (suppressed[view]) return;
    if (currentView() === view) apply(true);
  }

  function exit() {
    var v = currentView();
    if (v) suppressed[v] = true;
    apply(false);
    /* 阅读：退出回到正常界面时，空白卷提示条重新出现（作答、计时不动）。 */
    if (v === 'reading') {
      var b = document.getElementById('rStart');
      if (b) b.hidden = false;
    }
  }

  function clear() {
    /* 交卷 / 重置：状态本身已是全新，不记 suppression（重做靠显式开始）。 */
    apply(false);
  }

  function noteViewChange() {
    apply(false);
    suppressed = {};
    var v = currentView();
    try {
      if (v === 'reading' && window.Reading && Reading.wantsFullscreen && Reading.wantsFullscreen()) apply(true);
      else if (v === 'listening' && window.Listening && Listening.wantsFullscreen && Listening.wantsFullscreen()) apply(true);
      else if (v === 'writing' && window.Writing && Writing.wantsFullscreen && Writing.wantsFullscreen()) apply(true);
    } catch (e) { /* 派生失败 = 不进全屏，绝不阻塞视图切换 */ }
  }

  function bindExit() {
    var ex = document.getElementById('examExit');
    if (ex) ex.addEventListener('click', exit);
    var wx = document.getElementById('wBtnExit');
    if (wx) wx.addEventListener('click', exit);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindExit);
  } else {
    bindExit();
  }

  window.ExamShell = {
    enter: enter,
    exit: exit,
    clear: clear,
    noteViewChange: noteViewChange
  };
})();
