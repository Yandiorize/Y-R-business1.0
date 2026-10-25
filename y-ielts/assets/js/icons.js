/* ============================================================
 *  图标库 —— 线性描边风格（line icons）
 *  统一规范：24×24 视窗 / fill:none / stroke:currentColor /
 *           stroke-width 1.6 / 圆角端点与连接 / 无填充色块
 *  本文件为本次改版新增，替代原先用字符（◇、✕）充当的占位图形。
 *  影响范围：顶栏主题开关、导航、所有按钮、空状态插画。
 * ============================================================ */
(function () {
  'use strict';

  var P = {
    /* 主题 */
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z"/>',
    /* v15.5 0.3：「跟随系统」图标重设计——原「圆圈+中线+两条悬空竖线」被用户评为丑陋，
       改为「半明半暗的主圆（左暗右亮，中线分界）+ 右上小太阳（圆+6 条短光芒）」，
       纯描边风格与 sun/moon 完全一致（24 视窗 / fill:none / stroke:currentColor）。
       几何校验：主圆 (10.5,13.5) r6.2 与太阳 (17.6,6.4) r2.1 圆心距 10.04 > 半径和 8.3，不相交。 */
    auto: '<circle cx="10.5" cy="13.5" r="6.2"/><path d="M10.5 7.3a6.2 6.2 0 0 1 0 12.6z"/><circle cx="17.6" cy="6.4" r="2.1"/><path d="M17.6 2.7v1.4M17.6 8.7v1.4M13.9 6.4h1.4M20.1 6.4h1.4M15.4 4.2l1 .9M19.9 7.7l1 .9"/>',
    /* 计时 */
    play: '<path d="M7 4.5l12 7.5-12 7.5z"/>',
    pause: '<path d="M9 5v14M15 5v14"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    /* v17 0.4：重播（逆时针回旋箭头， Feather rotate-ccw 同规范 24 视窗描边风）。
       修复根因：图标库缺 replay 键 → Icons.get('replay') 返回空 SVG，
       听力「重播」按钮里只剩 16px 空白占位，文字视觉中心右偏。 */
    replay: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    /* 导航模块 */
    home: '<path d="M4 11.2L12 4.5l8 6.7"/><path d="M6.2 9.6V20h11.6V9.6"/><path d="M10.2 20v-5.6h3.6V20"/>',
    pen: '<path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    cards: '<rect x="3" y="6" width="13" height="15" rx="2.5"/><path d="M8 3h9.5A2.5 2.5 0 0 1 20 5.5V17"/><path d="M6.5 11h6M6.5 14.5h4"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5"/><path d="M8 7.5h7M8 11h7"/>',
    /* 操作 */
    history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v4h4"/><path d="M12 8v4.5l3 1.8"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/>',
    trash: '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6 7l1 13h10l1-13"/><path d="M10.5 11v6M13.5 11v6"/>',
    download: '<path d="M12 3v12"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M4 19h16"/>',
    shuffle: '<path d="M3 6h4l10 12h4"/><path d="M3 18h4l2.5-3"/><path d="M14.5 9L17 6h4"/><path d="M17 3l3 3-3 3M17 15l3 3-3 3"/>',
    check: '<path d="M4.5 12.5l5 5 10-11"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    chevron: '<path d="M9 5l7 7-7 7"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
    edit: '<path d="M4 20h4L18 10a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M10.5 8.5l4 4"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    layers: '<path d="M12 3l8.5 4.5L12 12 3.5 7.5z"/><path d="M4 12.5l8 4.3 8-4.3"/><path d="M4 16.8l8 4.2 8-4.2"/>',
    /* 范文库新增：搜索 / 收藏 / 加入生词本 / 笔记 / 筛选 */
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4L20.5 20.5"/>',
    star: '<path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17l-5.3 2.8 1.1-5.9L3.5 9.8l5.9-.8z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    note: '<path d="M5 4.5h11.5l3 3V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5z"/><path d="M8.5 12h7.5M8.5 15.5h5"/><path d="M15.5 4.5v3.2h3.2"/>',
    filter: '<path d="M3.5 5.5h17l-6.6 7.6v5.4l-3.8 2v-7.4z"/>',
    /* 发音 */
    volume: '<path d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z"/><path d="M15.4 9.2a4 4 0 0 1 0 5.6"/><path d="M17.8 6.8a7.5 7.5 0 0 1 0 10.4"/>',
    /* v18 0.1：「我的」入口图标（人形轮廓，24 视窗描边风，与全库同规范） */
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>'
  };

  /* 空状态插画（64×64，同样线性描边） */
  var ART = {
    doc: '<rect x="12" y="7" width="34" height="45" rx="4"/><path d="M20 18h18M20 26h18M20 34h11"/>',
    cards: '<rect x="7" y="16" width="26" height="34" rx="4"/><path d="M15 6h29a4 4 0 0 1 4 4v30"/><path d="M14 26h12M14 33h8"/>',
    chart: '<path d="M9 55h46"/><path d="M16 44v11M27 33v22M38 38v17M49 22v33"/><path d="M9 55V9"/><path d="M9 20h8"/>',
    quiz: '<circle cx="32" cy="32" r="22"/><path d="M26 24a6 6 0 1 1 8.5 5.5c-1.5.9-2.5 2-2.5 3.8"/><path d="M32 40h.01"/>'
  };

  function svg(inner, size, cls) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) +
      '" aria-hidden="true">' + inner + '</svg>';
  }

  window.Icons = {
    /** 返回线性图标的 HTML（外层需带 .icon 类以获得统一描边样式） */
    get: function (name, size, cls) {
      var inner = P[name] || '';
      return '<span class="icon ' + (cls || '') + '">' + svg(inner, size) + '</span>';
    },
    /** 仅返回内部 path（用于已有 svg 容器） */
    path: function (name) { return P[name] || ''; },
    /** 空状态插画 */
    art: function (name, size) {
      var s = size || 64;
      return '<div class="empty-art"><svg viewBox="0 0 64 64" width="' + s + '" height="' + s +
        '" aria-hidden="true">' + (ART[name] || ART.doc) + '</svg></div>';
    },
    names: function () { return Object.keys(P); }
  };
})();
