/* ============================================================
 *  Yan-di 品牌展示层（唯一数据源）
 *  ---------------------------------------------------------------
 *  · BRAND 常量：全站页眉、页脚、导出头、「我的」关于区都从这里取值
 *  · Brand.exportHeader()：所有导出 TXT 的两行品牌头
 *  · Brand.stripHeader() ：导入时自动跳过品牌头
 *  只做展示与字符串封装，不改任何业务功能。
 * ============================================================ */
(function () {
  'use strict';

  window.BRAND = {
    name: 'Y-IELTS',          /* 产品品牌（顶栏 / 关于 / 导出头） */
    company: 'Yan-di',        /* 公司署名（页脚 / 出品 / 导出头，保持不变） */
    /* v17 0.2：网站改名只留 Y-IELTS——原「雅思机考备考」产品名一并下线，
       导出头 / Brand.header() 随之改为「Yan-di · Y-IELTS」；
       stripHeader 的 ^Yan-di\s*[·•] 前缀过滤不受影响。 */
    product: 'Y-IELTS',
    year: '2026'
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  window.Brand = {
    header: function () { return BRAND.company + ' · ' + BRAND.product; },

    /* 导出文件头：第一行品牌，第二行日期，之后才是原内容 */
    exportHeader: function () {
      return BRAND.company + ' · ' + BRAND.product + '\n导出日期：' + today() + '\n';
    },

    /* 导入时过滤掉品牌头（出现在任意行都跳过） */
    stripHeader: function (text) {
      return String(text || '').split(/\r?\n/).filter(function (ln) {
        return !/^(Yan-di\s*[·•]|导出日期\s*[:：])/.test(ln.trim());
      }).join('\n');
    }
  };

  function init() {
    /* 页眉字标：Yan-di + IELTS · CBT SIMULATOR */
    var strong = document.querySelector('.brand-text strong');
    var span = document.querySelector('.brand-text span');
    if (strong) strong.textContent = BRAND.name;
    if (span) span.textContent = 'IELTS · CBT SIMULATOR';

    /* 页脚签名（公司署名，保持 Yan-di） */
    var fy = document.querySelector('#footYear');
    if (fy) fy.textContent = BRAND.year;
    var fn = document.querySelector('#footName');
    if (fn) fn.textContent = BRAND.company;
    /* v16：关于弹层（#aboutPanel）已移除，页脚「关于」入口由 me.js 绑定，
     * 统一指向「我的」抽屉内的关于区（#meAbout），不做第二套关于。 */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
