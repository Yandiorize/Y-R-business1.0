/* ============================================================
 *  雅思写作范文库 · 业务模块（本次整体重写）
 *  ---------------------------------------------------------------
 *  本次修改点：
 *    1) 列表视图改为「侧栏筛选 + 卡片网格」：关键词搜索、Task 1/2 分段、
 *       细分题型下拉、话题 chips、难度 chips、只看收藏、排序。
 *    2) 详情视图改为「题目 | 范文」左右分栏对照阅读；题目侧直接取
 *       prompts.js 的同 id 真题（含图表原图），范文侧为英文高分范文。
 *    3) 行内标注渲染：[[p|说明]]…[[/p]] 句式 / [[c|…]] 衔接 / [[v|…]] 词汇，
 *       点击标注会自动展开右侧对应的折叠注释面板（<details>）并高亮该条。
 *    4) 收藏（Store 键 essayFavs）与生词本（Store 键 essayWords，抽屉呈现，
 *       支持删除 / 导出）。
 *    5) 保留 hash 路由 #essays / #essay/<id>、下拉刷新、左缘右滑返回；
 *       移动端「题目 / 范文」单栏切换。
 *
 *  【最终优化 · 本次追加】
 *    6) 详情页新增「上一篇 / 下一篇」顺序导航（#btnPrevEssay / #btnNextEssay），
 *       顺序跟随当前筛选结果，首尾自动禁用并在标题上提示下一篇题目。
 *    7) 空状态内嵌「清空筛选」按钮，移动端收起侧栏后也能一键恢复。
 *    8) 可访问性：卡片 / 星标 / 注释加词 / 生词本删除均补 aria-label，
 *       收藏与阅读模式按钮补 aria-pressed，计数区加 aria-live，
 *       生词本抽屉补 role="dialog" + aria-modal，支持 Esc 关闭并归还焦点。
 *    9) 性能：正文字数与检索文本按篇缓存（__wc / __hay），避免每次筛选重复
 *       stripMarks 与整篇 toLowerCase；notes 缺字段时不再抛错。
 *  影响范围：仅 #view-essays 与 #view-essay-detail；
 *            阅读 / 写作 / 单词三个模块不受影响。
 *
 *  Safari 兼容：不使用可选链、??、Array.flat、replaceAll 等新语法；
 *              scrollIntoView 传对象时用 try/catch 兜底。
 * ============================================================ */
(function () {
  'use strict';

  var listEl, detailEl, listInner, qEl, eEl, splitEl, btnBack;
  var elSearch, elTaskSeg, elKindSel, elTopics, elLevels, elSort;
  var elStat, elSub, elFavOnly, elFavCount, elWordCount;
  var elTitle, elTitleEn, edQSub, edESub, btnFavDetail, btnCopyEssay, elMode;
  var elPrev, elNext, elStepIdx;
  var btnEssaySpeak, edSpkStatusEl;
  var wbDrawer, wbList, wbCount;
  var scrollAnchors = {};
  var current = null;

  /* B5：题目数据里的 test 已含「Test 」前缀，拼接前剥掉，避免 Test Test 1 */
  function testNo(t) {
    return String(t == null ? '' : t).replace(/^test\s*/i, '').trim();
  }

  /* 筛选状态 */
  var F = {
    q: '', task: 'all', kind: '', topics: [], levels: [],
    favOnly: false, sort: 'default'
  };
  var LEVELS = ['易', '中', '难'];
  var LEVEL_RANK = { '易': 0, '中': 1, '难': 2 };

  /* 阅读模式：en = 只看英文 / zh = 只看译文 / both = 逐段对照（英文段 + 译文段分开成块） */
  var MODE = (window.Store && Store.get('essayMode', 'en')) || 'en';
  if (MODE !== 'en' && MODE !== 'zh' && MODE !== 'both') MODE = 'en';

  /* ---------- 存储 ---------- */
  function favs() { return Store.get('essayFavs', []) || []; }
  function setFavs(a) { Store.set('essayFavs', a); }
  function isFav(id) { return favs().indexOf(id) !== -1; }
  function toggleFav(id) {
    var a = favs(), i = a.indexOf(id);
    if (i === -1) { a.push(id); toast('已收藏'); } else { a.splice(i, 1); toast('已取消收藏'); }
    setFavs(a);
    syncFavUI();
    return i === -1;
  }
  function words() { return Store.get('essayWords', []) || []; }
  function setWords(a) { Store.set('essayWords', a); }
  function hasWord(w) {
    var a = words();
    for (var i = 0; i < a.length; i++) if (a[i].w === w) return true;
    return false;
  }
  function addWord(w, cn, from) {
    var a = words();
    for (var i = 0; i < a.length; i++) { if (a[i].w === w) { toast('生词本已有该词'); return false; } }
    a.unshift({ w: w, cn: cn || '', from: from || '', at: Date.now() });
    setWords(a);
    toast('已加入生词本');
    syncWordUI();
    renderWordBook();
    return true;
  }
  function delWord(w) {
    var a = words(), out = [];
    for (var i = 0; i < a.length; i++) if (a[i].w !== w) out.push(a[i]);
    setWords(out);
    syncWordUI();
    renderWordBook();
    renderDetailPanelsState();
  }

  /* ---------- 工具 ---------- */
  function byId(id) {
    var arr = window.IELTS_ESSAYS || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }
  function promptById(id) {
    var arr = window.IELTS_PROMPTS || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }
  function stripMarks(s) {
    return String(s || '').replace(/\[\[\/?(p|c|v)(\|[^\]]*)?\]\]/g, '');
  }
  function essayText(item) {
    if (!item) return '';
    if (item.__txt == null) item.__txt = stripMarks((item.body || []).join(' '));
    return item.__txt;
  }
  /* 字数按篇缓存：列表每次筛选都会重新渲染 24 张卡片，避免重复 stripMarks */
  function wordCount(item) {
    if (!item) return 0;
    if (item.__wc == null) item.__wc = countWords(essayText(item));
    return item.__wc;
  }
  /* 检索文本按篇缓存（整篇小写化只做一次） */
  function hayOf(e) {
    if (e.__hay != null) return e.__hay;
    var n = e.notes || {};
    e.__hay = [e.title, e.titleEn, e.lead, e.kind, e.level, e.id,
               (e.topics || []).join(' '), essayText(e),
               (n.pattern || []).join(' '), (n.cohesion || []).join(' '),
               (n.vocab || []).join(' ')].join(' ').toLowerCase();
    return e.__hay;
  }

  /* ============================================================
   *  初始化
   * ============================================================ */
  function init() {
    listEl = document.getElementById('view-essays');
    detailEl = document.getElementById('view-essay-detail');
    listInner = document.getElementById('essaysListInner');
    qEl = document.getElementById('edQuestion');
    eEl = document.getElementById('edEssay');
    splitEl = document.getElementById('edSplit');
    btnBack = document.getElementById('btnEssayBack');

    elSearch = document.getElementById('esSearch');
    elTaskSeg = document.getElementById('esTaskSeg');
    elKindSel = document.getElementById('esKindSel');
    elTopics = document.getElementById('esTopics');
    elLevels = document.getElementById('esLevels');
    elSort = document.getElementById('esSort');
    elStat = document.getElementById('esStat');
    elSub = document.getElementById('esSub');
    elFavOnly = document.getElementById('esFavOnly');
    elFavCount = document.getElementById('esFavCount');
    elWordCount = document.getElementById('esWordCount');

    elTitle = document.getElementById('edTitle');
    elTitleEn = document.getElementById('edTitleEn');
    edQSub = document.getElementById('edQSub');
    edESub = document.getElementById('edESub');
    btnFavDetail = document.getElementById('btnFavDetail');
    btnCopyEssay = document.getElementById('btnCopyEssay');
    elMode = document.getElementById('edMode');
    elPrev = document.getElementById('btnPrevEssay');
    elNext = document.getElementById('btnNextEssay');
    elStepIdx = document.getElementById('edStepIdx');
    btnEssaySpeak = document.getElementById('btnEssaySpeak');
    edSpkStatusEl = document.getElementById('edSpkStatus');

    wbDrawer = document.getElementById('wbDrawer');
    wbList = document.getElementById('wbList');
    wbCount = document.getElementById('wbCount');

    /* 上 / 下一篇按钮的箭头图标（左箭头靠 CSS 旋转，复用同一个 chevron） */
    if (elPrev) elPrev.innerHTML = Icons.get('chevron', 15, 'ic-prev') + '<span class="lbl">上一篇</span>';
    if (elNext) elNext.innerHTML = '<span class="lbl">下一篇</span>' + Icons.get('chevron', 15, 'ic-next');
    if (wbDrawer) wbDrawer.setAttribute('aria-hidden', 'true');

    buildFilters();
    bindFilters();
    bindDetail();
    bindWordBook();

    renderList();
    renderDetail(window.IELTS_ESSAYS[0]);   // 先渲染一篇，避免空白

    if (window.UI && UI.PullRefresh) {
      UI.PullRefresh(listEl, function (done) {
        setTimeout(function () { renderList(); done(); }, 260);
      });
    }
    if (window.UI && UI.SwipeBack) {
      UI.SwipeBack(function () { if (isDetailActive()) go('essays'); });
    }
    window.addEventListener('hashchange', routeFromHash);
  }

  /* ---------- 筛选器构建 ---------- */
  function buildFilters() {
    /* 话题 */
    var topics = window.IELTS_ESSAY_TOPICS || [];
    elTopics.innerHTML = topics.map(function (t) {
      return '<button type="button" class="es-chip" data-topic="' + esc(t) + '">' + esc(t) + '</button>';
    }).join('');
    /* 难度 */
    elLevels.innerHTML = LEVELS.map(function (t) {
      return '<button type="button" class="es-chip" data-level="' + t + '">' + t + '</button>';
    }).join('');
    syncKindOptions();
  }

  function allKinds(task) {
    var out = [], seen = {};
    (window.IELTS_ESSAYS || []).forEach(function (e) {
      if (task !== 'all' && String(e.task) !== String(task)) return;
      if (!seen[e.kind]) { seen[e.kind] = 1; out.push(e.kind); }
    });
    return out;
  }
  function syncKindOptions() {
    var kinds = allKinds(F.task);
    if (F.kind && kinds.indexOf(F.kind) === -1) F.kind = '';
    var html = '<option value="">全部</option>' +
      kinds.map(function (k) {
        return '<option value="' + esc(k) + '"' + (F.kind === k ? ' selected' : '') + '>' + esc(k) + '</option>';
      }).join('');
    if (elKindSel) elKindSel.innerHTML = html;
  }

  function bindFilters() {
    if (elSearch) {
      /* 只有 24 篇，同步过滤即可（不引入防抖，移动端输入更跟手） */
      elSearch.addEventListener('input', function () {
        F.q = (elSearch.value || '').trim();
        renderList();
      });
      elSearch.addEventListener('search', function () {
        F.q = (elSearch.value || '').trim();
        renderList();
      });
    }
    if (elTaskSeg) {
      $$('button', elTaskSeg).forEach(function (b) {
        b.addEventListener('click', function () {
          $$('button', elTaskSeg).forEach(function (x) { x.classList.remove('is-active'); });
          b.classList.add('is-active');
          F.task = b.getAttribute('data-task');
          syncKindOptions();
          renderList();
        });
      });
    }
    if (elKindSel) {
      elKindSel.addEventListener('change', function () {
        F.kind = elKindSel.value || '';
        renderList();
      });
    }
    if (elTopics) {
      elTopics.addEventListener('click', function (ev) {
        var b = ev.target.closest ? ev.target.closest('.es-chip') : null;
        if (!b) return;
        var t = b.getAttribute('data-topic');
        var i = F.topics.indexOf(t);
        if (i === -1) F.topics.push(t); else F.topics.splice(i, 1);
        b.classList.toggle('is-active', i === -1);
        renderList();
      });
    }
    if (elLevels) {
      elLevels.addEventListener('click', function (ev) {
        var b = ev.target.closest ? ev.target.closest('.es-chip') : null;
        if (!b) return;
        var t = b.getAttribute('data-level');
        var i = F.levels.indexOf(t);
        if (i === -1) F.levels.push(t); else F.levels.splice(i, 1);
        b.classList.toggle('is-active', i === -1);
        renderList();
      });
    }
    if (elSort) {
      elSort.addEventListener('change', function () { F.sort = elSort.value || 'default'; renderList(); });
    }
    if (elFavOnly) {
      elFavOnly.addEventListener('click', function () {
        F.favOnly = !F.favOnly;
        elFavOnly.classList.toggle('is-on', F.favOnly);
        elFavOnly.setAttribute('aria-pressed', F.favOnly ? 'true' : 'false');
        renderList();
      });
    }
    var btnReset = document.getElementById('esReset');
    if (btnReset) btnReset.addEventListener('click', resetFilters);
    /* 移动端「筛选」折叠 */
    var sideEl = document.getElementById('essaysSide');
    var foldBtn = document.getElementById('esFold');
    if (sideEl && foldBtn) {
      if (window.innerWidth <= 900) {
        sideEl.classList.add('is-fold');
        foldBtn.setAttribute('aria-expanded', 'false');
      }
      foldBtn.addEventListener('click', function () {
        var folded = sideEl.classList.toggle('is-fold');
        foldBtn.setAttribute('aria-expanded', folded ? 'false' : 'true');
        setBtnText(foldBtn, folded ? '筛选条件' : '收起筛选');
      });
    }

    /* 移动端「题目 / 范文」切换 */
    var paneSeg = document.getElementById('edPaneSeg');
    if (paneSeg && window.bindSeg) {
      bindSeg(paneSeg, document.getElementById('edPaneThumb'), function (b) {
        if (splitEl) splitEl.setAttribute('data-pane', b.getAttribute('data-pane'));
      });
    }
  }

  /* 清空全部筛选：侧栏「重置筛选」与空状态按钮共用 */
  function resetFilters() {
    F.q = ''; F.task = 'all'; F.kind = ''; F.topics = []; F.levels = [];
    F.favOnly = false; F.sort = 'default';
    if (elSearch) elSearch.value = '';
    if (elSort) elSort.value = 'default';
    if (elFavOnly) {
      elFavOnly.classList.remove('is-on');
      elFavOnly.setAttribute('aria-pressed', 'false');
    }
    if (elTaskSeg) {
      $$('button', elTaskSeg).forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-task') === 'all');
      });
    }
    $$('.es-chip').forEach(function (b) { b.classList.remove('is-active'); });
    syncKindOptions();
    renderList();
  }

  /* ---------- 过滤 + 排序 ---------- */
  function filtered() {
    var q = F.q.toLowerCase();
    var out = (window.IELTS_ESSAYS || []).filter(function (e) {
      if (F.task !== 'all' && String(e.task) !== String(F.task)) return false;
      if (F.kind && e.kind !== F.kind) return false;
      if (F.levels.length && F.levels.indexOf(e.level) === -1) return false;
      if (F.topics.length) {
        var hit = false;
        for (var i = 0; i < F.topics.length; i++) {
          if ((e.topics || []).indexOf(F.topics[i]) !== -1) { hit = true; break; }
        }
        if (!hit) return false;
      }
      if (F.favOnly && !isFav(e.id)) return false;
      if (q && hayOf(e).indexOf(q) === -1) return false;
      return true;
    });
    if (F.sort === 'level') {
      out.sort(function (a, b) { return (LEVEL_RANK[a.level] || 0) - (LEVEL_RANK[b.level] || 0); });
    } else if (F.sort === 'words') {
      out.sort(function (a, b) { return wordCount(b) - wordCount(a); });
    } else if (F.sort === 'task') {
      out.sort(function (a, b) { return a.task - b.task; });
    }
    return out;
  }

  /* ============================================================
   *  列表渲染
   * ============================================================ */
  function renderList() {
    if (!listInner) return;
    var items = filtered();
    var html = items.map(function (e) {
      var fav = isFav(e.id);
      return '<div class="es-card glass" data-id="' + esc(e.id) + '" role="button" tabindex="0"' +
        ' aria-label="' + esc(e.title) + '，Task ' + e.task + '，难度' + e.level + '，打开范文">' +
        '<button class="es-fav' + (fav ? ' is-on' : '') + '" type="button" data-fav="' + esc(e.id) + '"' +
          ' aria-pressed="' + (fav ? 'true' : 'false') + '"' +
          ' aria-label="' + (fav ? '取消收藏：' : '收藏：') + esc(e.title) + '"' +
          ' title="' + (fav ? '取消收藏' : '收藏') + '">' + Icons.get('star', 15) + '</button>' +
        '<div class="es-card-top">' +
          '<span class="es-tag t-task' + e.task + '">Task ' + e.task + '</span>' +
          '<span class="es-tag t-kind">' + esc(e.kind) + '</span>' +
          '<span class="es-tag t-lv' + e.level + '">' + e.level + '</span>' +
          (e.topics || []).map(function (t) {
            return '<span class="es-tag t-topic">' + esc(t) + '</span>';
          }).join('') +
        '</div>' +
        '<h3>' + esc(e.title) + '</h3>' +
        '<span class="en">' + esc(e.titleEn) + '</span>' +
        '<p class="lead">' + esc(e.lead) + '</p>' +
        '<div class="es-card-foot">' +
          '<span>' + wordCount(e) + ' words</span>' +
          '<span>剑桥 ' + e.book + ' · Test ' + testNo(e.test) + '</span>' +
          '<button class="es-spk" type="button" data-spk="' + esc(e.id) + '"' +
            ' aria-label="朗读范文：' + esc(e.title) + '" aria-pressed="false"' +
            ' title="朗读这篇范文">' + Icons.get('volume', 15) + '</button>' +
          '<span class="go">对照阅读' + Icons.get('chevron', 13) + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    if (!items.length) {
      html = '<div class="es-empty">' + Icons.get('search', 30) +
        '<p class="es-empty-t">没有符合条件的范文，试试放宽筛选或清空关键词。</p>' +
        '<button class="btn btn-primary btn-sm es-empty-btn" id="esEmptyReset" type="button">清空筛选</button>' +
        '</div>';
    }

    listInner.innerHTML = html + renderGuide();

    var emptyReset = document.getElementById('esEmptyReset');
    if (emptyReset) emptyReset.addEventListener('click', resetFilters);

    if (elStat) {
      elStat.innerHTML = '共收录 <b>' + (window.IELTS_ESSAYS || []).length + '</b> 篇 · ' +
        '当前筛选出 <b>' + items.length + '</b> 篇<br>收藏 <b>' + favs().length + '</b> 篇 · ' +
        '生词本 <b>' + words().length + '</b> 词';
    }
    if (elSub) {
      elSub.textContent = '剑桥雅思 17–19 真题 · 共 ' + (window.IELTS_ESSAYS || []).length +
        ' 篇（Task 1 + Task 2 各 12 篇）';
    }
    syncFavUI();
    syncWordUI();
    /* 朗读态跨渲染保持：重渲后把播放中的按钮重新标出来 */
    if (spkItem2) {
      var liveBtn = listInner.querySelector('.es-spk[data-spk="' + spkItem2.id + '"]');
      if (liveBtn) markSpkBtn2(liveBtn);
    }

    /* 卡片交互 */
    $$('.es-card', listInner).forEach(function (card) {
      var id = card.getAttribute('data-id');
      card.addEventListener('click', function (ev) {
        var favBtn = ev.target.closest ? ev.target.closest('[data-fav]') : null;
        if (favBtn) {
          ev.stopPropagation();
          var on = toggleFav(favBtn.getAttribute('data-fav'));
          favBtn.classList.toggle('is-on', on);
          favBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
          favBtn.setAttribute('aria-label', (on ? '取消收藏：' : '收藏：') +
            (card.getAttribute('aria-label') || '').split('，')[0]);
          favBtn.setAttribute('title', on ? '取消收藏' : '收藏');
          if (F.favOnly) renderList();
          return;
        }
        /* 卡片上的朗读按钮：不打开详情，直接播/停这一篇 */
        var spkBtn = ev.target.closest ? ev.target.closest('[data-spk]') : null;
        if (spkBtn) {
          ev.stopPropagation();
          var it2 = byId(spkBtn.getAttribute('data-spk'));
          if (it2) speakEssayItem(it2, spkBtn);
          return;
        }
        var item = byId(id);
        if (item) showDetail(item, true);
      });
      card.addEventListener('keydown', function (ev) {
        /* 卡片内按钮（收藏/朗读）聚焦时 Enter/Space 交给按钮自身，
           不触发卡片的「打开详情」 */
        if (ev.target && ev.target.closest &&
            ev.target.closest('[data-fav],[data-spk]')) return;
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          var item = byId(id);
          if (item) showDetail(item, true);
        }
      });
    });
  }

  /* ============================================================
   *  详情渲染
   * ============================================================ */
  function renderDetail(item) {
    if (!item) return;
    current = item;
    var p = promptById(item.id);

    if (elTitle) elTitle.textContent = item.title;
    if (elTitleEn) elTitleEn.textContent = item.titleEn || '';

    /* ---- 题目侧 ---- */
    var qh = '';
    if (p && p.chart) {
      qh += '<figure class="q-figure"><img src="' + esc(p.chart) + '" alt="Task 1 图表" data-zoom>' +
            '<figcaption>点击图片可放大 · 图表取自剑桥雅思原书</figcaption></figure>';
    }
    if (p) {
      qh += '<div class="q-block"><span class="k">题目</span><p class="v">' + esc(p.stem) + '</p></div>';
      if (p.question) {
        qh += '<div class="q-block"><span class="k">写作任务</span><p class="v ask">' + esc(p.question) + '</p></div>';
      }
      if (p.instruction) {
        qh += '<div class="q-block"><span class="k">要求</span><p class="v inst">' + esc(p.instruction) + '</p></div>';
      }
      qh += '<div class="q-src">来源：' + esc(p.bookFull || ('剑桥雅思 ' + p.book)) +
            ' · Test ' + testNo(p.test) + ' · Task ' + p.task + ' · ' + esc(p.kind) +
            '<br>建议用时 ' + p.minutes + ' 分钟 · 最少 ' + p.minWords + ' words</div>';
      if (p.task === 1) {
        qh += '<div class="q-src">提示：Task 1 范文中的具体数值为按原卷图表刻度的近似读数，' +
              '练习时请以原卷图表为准。</div>';
      }
    } else {
      qh += '<div class="es-empty">未找到对应真题</div>';
    }
    if (qEl) qEl.innerHTML = qh;

    /* ---- 范文侧 ---- */
    var notes = item.notes || {};
    var eh = renderBody(item);
    eh += '<div class="ed-notes">' +
      notePanel('p', '可借鉴句式', notes.pattern) +
      notePanel('c', '衔接词与逻辑标记', notes.cohesion) +
      notePanel('v', '高分词汇与搭配', notes.vocab) +
      '</div>';
    eh += '<div class="ed-sec"><h3 class="ed-sec-h">逐段点评</h3>' +
      (item.analysis || []).map(function (s) { return '<p class="ed-line">' + esc(s) + '</p>'; }).join('') +
      '</div>';
    eh += '<div class="ed-sec"><h3 class="ed-sec-h">可迁移表达</h3><ul class="ed-take">' +
      (item.takeaways || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') +
      '</ul></div>';
    eh += renderGuide();
    if (eEl) eEl.innerHTML = eh;

    if (edQSub) edQSub.textContent = p ? ('Task ' + p.task + ' · ' + p.kind) : '';
    if (edESub) edESub.textContent = wordCount(item) + ' words · 难度 ' + item.level;

    /* 标注点击 → 展开对应面板 */
    $$('.mk', eEl).forEach(function (m) {
      m.addEventListener('click', function () {
        jumpToNote(m.getAttribute('data-k'), m.getAttribute('data-i'), m);
      });
    });
    /* 加入生词本 */
    $$('.np-item .add', eEl).forEach(function (b) {
      b.addEventListener('click', function () {
        addWord(b.getAttribute('data-w'), b.getAttribute('data-cn'), item.title);
        renderDetailPanelsState();
      });
    });
    /* 图表放大 */
    $$('img[data-zoom]', qEl).forEach(function (img) {
      img.addEventListener('click', function () {
        var lb = document.getElementById('lightbox');
        var lbi = document.getElementById('lbImg');
        if (lb && lbi) { lbi.src = img.src; lb.classList.add('is-open'); }
      });
    });

    renderDetailPanelsState();
    syncFavUI();
    syncMode();
    syncStepUI();
    syncSpeakUI();
  }

  /* ============================================================
   *  范文朗读（v16新版 0.4）
   *  复用词库同一套发音链路：Vocab.pickVoice / getVoiceLang /
   *  ensureVoice，口音跟随全局设置（accent uk→en-GB / us→en-US，
   *  每次发起朗读时实时读取，全局口音切换后下次朗读即跟随）。
   *  代际号 spkGen2：每次发起或停止都 +1，旧 utterance 的迟到
   *  回调（onstart/onend/onerror）代际不符即整条忽略，避免
   *  换篇 / 停止 / 重渲后旧回调擦掉新状态。
   *  播放 / 停止切换：再点一次（同篇）即停，stop 走
   *  speechSynthesis.cancel()。播放中有状态文字（详情头 pill）。
   * ============================================================ */
  var spkGen2 = 0;
  var spkItem2 = null;   /* 正在朗读的篇 */
  var spkBtn2 = null;    /* 当前处于播放态的按钮（详情头按钮或列表卡片按钮） */
  /* v17 补丁 B9：连点防抖时间戳——400ms 内的重复点击整条忽略。
     代际号只防「旧 utterance 迟到回调」，不防「起点→停→再起点」的
     反复重起；连点 5–8 下时只有首击生效（只播 1 遍），
     超过 400ms 的再次点击仍可按设计停止当前朗读。 */
  var spkGuard2 = 0;

  function edSpkPill(state, msg) {
    if (!edSpkStatusEl) edSpkStatusEl = document.getElementById('edSpkStatus');
    if (!edSpkStatusEl) return;
    edSpkStatusEl.classList.remove('is-playing', 'is-fail', 'show');
    if (state === 'playing') {
      edSpkStatusEl.innerHTML = '🔊 朗读中…';
      edSpkStatusEl.classList.add('is-playing', 'show');
    } else if (state === 'fail') {
      edSpkStatusEl.innerHTML = '⚠️ ' + esc(msg || '朗读失败，点按钮重试');
      edSpkStatusEl.classList.add('is-fail', 'show');
    } else {
      edSpkStatusEl.innerHTML = '';
    }
  }
  function clearSpkBtn2() {
    if (!spkBtn2) return;
    spkBtn2.classList.remove('is-playing');
    spkBtn2.setAttribute('aria-pressed', 'false');
    var lbl = spkBtn2.querySelector('.lbl');
    if (lbl && spkBtn2.id === 'btnEssaySpeak') lbl.textContent = '朗读';
    spkBtn2 = null;
  }
  function markSpkBtn2(btn) {
    clearSpkBtn2();
    if (!btn) return;
    spkBtn2 = btn;
    btn.classList.add('is-playing');
    btn.setAttribute('aria-pressed', 'true');
    var lbl = btn.querySelector('.lbl');
    if (lbl && btn.id === 'btnEssaySpeak') lbl.textContent = '停止';
  }
  /* 停止朗读。pill 始终清空（换篇/离场不留「朗读中」残影；紧接着起
     新朗读时会在同一同步执行块内被新状态覆盖，无视觉闪烁）。 */
  function stopSpeakEssay() {
    spkGen2++;
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    clearSpkBtn2();
    spkItem2 = null;
    edSpkPill('');
  }
  /* 发起 / 停止一篇范文的朗读。btn 为触发按钮（可为 null） */
  function speakEssayItem(item, btn) {
    if (!item) return false;
    /* v17 补丁 B9：400ms 防抖——连点只生效首击（只播 1 遍） */
    var nowTs = Date.now ? Date.now() : 0;
    if (nowTs && nowTs - spkGuard2 < 400) return false;
    spkGuard2 = nowTs;
    /* 再点当前正在播的那篇 = 停止（播放 / 停止切换） */
    if (spkItem2 && spkItem2.id === item.id) { stopSpeakEssay(); return false; }
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      edSpkPill('fail', '当前设备暂无可用语音');
      return false;
    }
    var text = essayText(item);
    if (!text) { edSpkPill('fail', '这篇范文暂无可朗读内容'); return false; }
    stopSpeakEssay();
    try { window.speechSynthesis.cancel(); } catch (e) {}
    var V = window.Vocab || {};
    if (V.ensureVoice) { try { V.ensureVoice(); } catch (e) {} }
    var u = new SpeechSynthesisUtterance(text);
    u.lang = V.getVoiceLang ? V.getVoiceLang() : 'en-US';
    u.rate = 0.92; u.volume = 1;
    var v = V.pickVoice ? V.pickVoice() : null;
    if (v) u.voice = v;
    var myGen = ++spkGen2;
    spkItem2 = item;
    edSpkPill('playing');
    markSpkBtn2(btn);
    u.onstart = function () { if (myGen !== spkGen2) return; edSpkPill('playing'); };
    u.onend = function () {
      if (myGen !== spkGen2) return;
      clearSpkBtn2();
      spkItem2 = null;
      edSpkPill('');
    };
    u.onerror = function () {
      if (myGen !== spkGen2) return;
      clearSpkBtn2();
      spkItem2 = null;
      edSpkPill('fail', '朗读失败，点按钮重试');
    };
    try { window.speechSynthesis.speak(u); return true; }
    catch (e) {
      if (myGen !== spkGen2) return false;
      clearSpkBtn2();
      spkItem2 = null;
      edSpkPill('fail', '朗读失败，点按钮重试');
      return false;
    }
  }
  /* 详情渲染后把按钮状态对齐到「当前篇是否正在朗读」 */
  function syncSpeakUI() {
    if (spkItem2 && current && spkItem2.id === current.id) markSpkBtn2(btnEssaySpeak);
    else clearSpkBtn2();
  }

  /* 行内标注 → HTML；并按当前阅读模式（英文 / 译文 / 对照）拼接正文。
     译文永远单独成块，不与英文句子交错。 */
  function renderBody(item) {
    var idx = { p: 0, c: 0, v: 0 };
    var en = (item.body || []).map(function (t) {
      var html = esc(t).replace(/\[\[(p|c|v)\|([^\]]*)\]\]([\s\S]*?)\[\[\/\1\]\]/g,
        function (m, k, note, txt) {
          var i = idx[k]++;
          return '<span class="mk mk-' + k + '" data-k="' + k + '" data-i="' + i +
                 '" title="' + note + '">' + txt + '</span>';
        });
      return '<p class="ed-en-p">' + html + '</p>';
    });

    var zhArr = zhOf(item);
    var zh = (zhArr.length ? zhArr : ['（本篇译文待补）']).map(function (t) {
      return '<p class="ed-zh-p">' + esc(t) + '</p>';
    });

    if (MODE === 'zh') {
      return '<div class="ed-essay is-zh">' + zh.join('') + '</div>';
    }
    if (MODE === 'both') {
      var out = '';
      for (var i = 0; i < en.length; i++) {
        out += '<div class="ed-pair">' + en[i] + (zh[i] || '') + '</div>';
      }
      return '<div class="ed-essay is-both">' + out + '</div>';
    }
    return '<div class="ed-essay is-en">' + en.join('') + '</div>';
  }

  /* 取某篇的中文译文（与 essay-data.js 物理分离，见 essay-zh.js） */
  function zhOf(item) {
    var map = window.IELTS_ESSAY_ZH || {};
    var arr = map[item.id];
    return (arr && arr.length) ? arr : [];
  }

  function notePanel(kind, title, list) {
    list = list || [];
    var cls = kind === 'p' ? 'np-p' : (kind === 'c' ? 'np-c' : 'np-v');
    return '<details class="np ' + cls + '" id="np-' + kind + '">' +
      '<summary><span class="dot"></span>' + esc(title) +
      '<span class="cnt">' + list.length + '</span></summary>' +
      '<div class="np-body">' +
      list.map(function (s, i) { return npItem(kind, s, i); }).join('') +
      '</div></details>';
  }
  function npItem(kind, s, i) {
    var parts = String(s).split('——');
    var en = parts[0] ? parts[0].trim() : s;
    var cn = parts[1] ? parts[1].trim() : '';
    var btn = '';
    if (kind === 'v') {
      var inIt = hasWord(en);
      btn = '<button class="add' + (inIt ? ' is-in' : '') + '" type="button" data-w="' +
            esc(en) + '" data-cn="' + esc(cn) + '"' +
            ' aria-pressed="' + (inIt ? 'true' : 'false') + '"' +
            ' aria-label="' + (inIt ? '已在生词本：' : '加入生词本：') + esc(en) + '"' +
            ' title="' + (inIt ? '已在生词本' : '加入生词本') + '">' +
            Icons.get(inIt ? 'check' : 'plus', 14) + '</button>';
    }
    return '<div class="np-item" data-k="' + kind + '" data-i="' + i + '">' +
      '<span class="en">' + esc(en) +
      (cn ? '<span class="cn">' + esc(cn) + '</span>' : '') + '</span>' + btn + '</div>';
  }

  /* 生词本按钮状态刷新 */
  function renderDetailPanelsState() {
    if (!eEl) return;
    $$('.np-item .add', eEl).forEach(function (b) {
      var w = b.getAttribute('data-w');
      var inIt = hasWord(w);
      b.classList.toggle('is-in', inIt);
      b.setAttribute('aria-pressed', inIt ? 'true' : 'false');
      b.setAttribute('aria-label', (inIt ? '已在生词本：' : '加入生词本：') + w);
      b.setAttribute('title', inIt ? '已在生词本' : '加入生词本');
      b.innerHTML = Icons.get(inIt ? 'check' : 'plus', 14);
    });
  }

  function jumpToNote(k, i, fromEl) {
    var d = document.getElementById('np-' + k);
    if (d) d.open = true;
    var sel = '.np-item[data-k="' + k + '"][data-i="' + i + '"]';
    var target = $(sel, eEl);
    if (!target) return;
    target.classList.remove('is-flash');
    /* Safari 需要重排后再加类，动画才会重放 */
    void target.offsetWidth;
    target.classList.add('is-flash');
    if (fromEl) {
      fromEl.classList.remove('is-flash');
      void fromEl.offsetWidth;
      fromEl.classList.add('is-flash');
    }
    try { target.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    catch (e) { if (target.scrollIntoView) target.scrollIntoView(); }
  }

  /* ---------- 详情页按钮 ---------- */
  function bindDetail() {
    if (btnBack) {
      btnBack.addEventListener('click', function () { go('essays'); });
    }
    if (elPrev) elPrev.addEventListener('click', function () { stepEssay(-1); });
    if (elNext) elNext.addEventListener('click', function () { stepEssay(1); });
    if (btnFavDetail) {
      btnFavDetail.addEventListener('click', function () {
        if (!current) return;
        toggleFav(current.id);
        syncFavUI();
        if (F.favOnly) renderList();
      });
    }
    if (btnCopyEssay) {
      btnCopyEssay.addEventListener('click', function () {
        if (!current) return;
        copyText((current.body || []).map(stripMarks).join('\n\n'));
      });
    }

    /* 范文朗读：详情头按钮 = 当前篇 播放 / 停止 切换 */
    if (btnEssaySpeak) {
      btnEssaySpeak.addEventListener('click', function () {
        if (!current) return;
        speakEssayItem(current, btnEssaySpeak);
      });
    }
    /* 失败 pill 可点击重试（与词库 spk-status 一致） */
    if (edSpkStatusEl) {
      edSpkStatusEl.addEventListener('click', function () {
        if (edSpkStatusEl.classList.contains('is-fail') && current) {
          speakEssayItem(current, btnEssaySpeak);
        }
      });
    }

    /* 阅读模式：英文 / 译文 / 对照 */
    if (elMode) {
      $$('button', elMode).forEach(function (b) {
        b.setAttribute('aria-pressed', b.classList.contains('is-active') ? 'true' : 'false');
        b.addEventListener('click', function () {
          var m = b.getAttribute('data-mode');
          if (m === MODE) return;
          MODE = m;
          Store.set('essayMode', MODE);
          syncMode();
          if (current) renderDetail(current);
        });
      });
    }

    /* Esc 关闭生词本抽屉（仅在抽屉打开时接管，不影响其他模块） */
    document.addEventListener('keydown', function (ev) {
      if ((ev.key === 'Escape' || ev.key === 'Esc' || ev.keyCode === 27) &&
          wbDrawer && wbDrawer.classList.contains('is-open')) {
        closeWordBook();
      }
    });
  }

  /* ---------- 上一篇 / 下一篇 ---------- */
  /* 顺序跟随当前筛选结果；若当前篇不在筛选结果里（如刚从收藏页进入），
     退回全量顺序，保证导航永远可用。 */
  function stepList() {
    var arr = filtered();
    var hit = false;
    for (var i = 0; i < arr.length; i++) if (current && arr[i].id === current.id) hit = true;
    return hit ? arr : (window.IELTS_ESSAYS || []);
  }
  function stepIndex(arr) {
    for (var i = 0; i < arr.length; i++) if (current && arr[i].id === current.id) return i;
    return -1;
  }
  function stepEssay(dir) {
    if (!current) return;
    var arr = stepList();
    var i = stepIndex(arr);
    var j = i + dir;
    if (i === -1 || j < 0 || j >= arr.length) {
      toast(dir < 0 ? '已经是第一篇了' : '已经是最后一篇了');
      return;
    }
    var it = arr[j];
    showDetail(it, true);
    toast((dir < 0 ? '上一篇 · ' : '下一篇 · ') + it.title);
  }
  function syncStepUI() {
    if (!current) return;
    var arr = stepList();
    var i = stepIndex(arr);
    var prev = i > 0 ? arr[i - 1] : null;
    var next = (i >= 0 && i < arr.length - 1) ? arr[i + 1] : null;
    if (elPrev) {
      elPrev.disabled = !prev;
      elPrev.setAttribute('aria-label', prev ? ('上一篇范文：' + prev.title) : '已经是第一篇');
      elPrev.setAttribute('title', prev ? ('上一篇：' + prev.title) : '已经是第一篇');
    }
    if (elNext) {
      elNext.disabled = !next;
      elNext.setAttribute('aria-label', next ? ('下一篇范文：' + next.title) : '已经是最后一篇');
      elNext.setAttribute('title', next ? ('下一篇：' + next.title) : '已经是最后一篇');
    }
    if (elStepIdx) elStepIdx.textContent = (i >= 0 ? (i + 1) : '—') + ' / ' + arr.length;
  }

  function syncMode() {
    if (!elMode) return;
    $$('button', elMode).forEach(function (b) {
      var on = b.getAttribute('data-mode') === MODE;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function syncFavUI() {
    if (elFavCount) elFavCount.textContent = favs().length;
    if (btnFavDetail && current) {
      var on = isFav(current.id);
      btnFavDetail.classList.toggle('is-on', on);
      btnFavDetail.setAttribute('aria-pressed', on ? 'true' : 'false');
      setBtnText(btnFavDetail, on ? '已收藏' : '收藏');
    }
  }
  function syncWordUI() {
    var n = words().length;
    if (elWordCount) elWordCount.textContent = n;
    if (wbCount) wbCount.textContent = n + ' 词';
  }

  /* ============================================================
   *  生词本抽屉
   * ============================================================ */
  function bindWordBook() {
    var btn = document.getElementById('btnWordBook');
    if (btn) btn.addEventListener('click', openWordBook);
    var close = document.getElementById('btnWbClose');
    if (close) close.addEventListener('click', closeWordBook);
    var exp = document.getElementById('btnWbExport');
    if (exp) {
      exp.addEventListener('click', function () {
        var a = words();
        if (!a.length) { toast('生词本还是空的'); return; }
        copyText(a.map(function (x) {
          return x.w + (x.cn ? ' —— ' + x.cn : '') + (x.from ? '（' + x.from + '）' : '');
        }).join('\n'));
      });
    }
    var close2 = document.getElementById('btnWbClose2');
    if (close2) close2.addEventListener('click', closeWordBook);
    if (wbDrawer) {
      $$('[data-wb-close]', wbDrawer).forEach(function (m) {
        m.addEventListener('click', closeWordBook);
      });
    }
    renderWordBook();
    syncWordUI();
  }
  function openWordBook() {
    renderWordBook();
    if (!wbDrawer) return;
    wbDrawer.classList.add('is-open');
    wbDrawer.setAttribute('aria-hidden', 'false');
    var close = document.getElementById('btnWbClose');
    if (close && close.focus) {
      try { close.focus({ preventScroll: true }); } catch (e) { /* 旧 Safari 忽略参数 */ }
    }
  }
  function closeWordBook() {
    if (!wbDrawer || !wbDrawer.classList.contains('is-open')) return;
    wbDrawer.classList.remove('is-open');
    wbDrawer.setAttribute('aria-hidden', 'true');
    var btn = document.getElementById('btnWordBook');
    if (btn && btn.focus) {
      try { btn.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
  }
  function renderWordBook() {
    if (!wbList) return;
    var a = words();
    if (!a.length) {
      wbList.innerHTML = '<div class="wb-empty">还没有生词。<br>在范文的「高分词汇」面板中点 ' +
        '＋ 即可加入。</div>';
      return;
    }
    wbList.innerHTML = a.map(function (x) {
      return '<div class="wb-item"><span><span class="w">' + esc(x.w) + '</span>' +
        (x.cn ? '<span class="cn">' + esc(x.cn) + '</span>' : '') +
        (x.from ? '<span class="from">来自：' + esc(x.from) + '</span>' : '') +
        '</span><button class="del" type="button" data-del="' + esc(x.w) + '"' +
        ' aria-label="从生词本删除：' + esc(x.w) + '" title="删除">' +
        Icons.get('trash', 13) + '</button></div>';
    }).join('');
    $$('[data-del]', wbList).forEach(function (b) {
      b.addEventListener('click', function () { delWord(b.getAttribute('data-del')); });
    });
  }

  /* ---------- 通用写作思路 ---------- */
  function renderGuide() {
    var g = window.IELTS_ESSAY_GUIDE;
    if (!g) return '';
    return '<section class="essay-guide glass">' +
      '<h3 class="ed-sec-h">' + esc(g.title) + '</h3>' +
      '<ol class="guide-list">' +
      g.steps.map(function (s) {
        return '<li><span><b>' + esc(s.h) + '</b><span>' + esc(s.p) + '</span></span></li>';
      }).join('') +
      '</ol></section>';
  }

  /* ============================================================
   *  路由 / 视图切换
   * ============================================================ */
  function isDetailActive() {
    return detailEl && detailEl.classList.contains('is-active');
  }
  /* 页面滚动位置：列表是整页滚动（不是内部容器），所以记 window，不记元素 */
  function pageY() {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }
  function scrollPageTo(y) {
    try { window.scrollTo(0, y || 0); } catch (e) { /* 无头环境未实现，忽略 */ }
  }
  function go(hash) {
    if (window.location.hash !== hash) window.location.hash = hash;
    /* 部分环境（jsdom / 旧 WebView）设置 hash 不自动派发 hashchange，显式走一次 */
    routeFromHash();
  }
  function routeFromHash() {
    var h = (window.location.hash || '').replace(/^#\/?/, '');
    if (h.indexOf('essay/') === 0) {
      var item = byId(h.slice(6));
      if (!item) return showList(false);
      showDetail(item, false);
    } else if (h === 'essays' || h === '') {
      /* v17 0.6：仅当确实处于范文模块时才接管列表显隐。
         模块切换走 app.switchView + pushState（不触发 hashchange），
         但浏览器后退把 hash 变成 #reading / #home 等时同样会派发 hashchange，
         旧逻辑无条件 showList 会把用户从当前模块抢回范文列表。 */
      var dv = document.body.getAttribute('data-view');
      if (dv === 'essays' || dv === 'essay-detail') showList(false);
    }
    /* 其余 hash（#reading / #vocab / #home 等）与范文模块无关，不处理 */
  }
  function showList() {
    if (!listEl || !detailEl) return;
    stopSpeakEssay();          /* 返回列表即停止朗读 */
    listEl.classList.add('is-active');
    detailEl.classList.remove('is-active');
    scrollPageTo(scrollAnchors.list || 0);
    if (window.syncSegThumb) {
      try { syncSegThumb(document.getElementById('navSeg'), document.getElementById('navThumb')); }
      catch (e) { /* ignore */ }
    }
  }
  function showDetail(item, push) {
    if (!listEl || !detailEl) return;
    stopSpeakEssay();          /* 换篇：停掉上一篇的朗读，pill 不留残影 */
    if (push !== false && window.location) window.location.hash = 'essay/' + item.id;
    /* 只有从列表进入时才记录列表位置；详情之间前后翻页不该覆盖它 */
    if (listEl.classList.contains('is-active')) scrollAnchors.list = pageY();
    listEl.classList.remove('is-active');
    detailEl.classList.add('is-active');
    renderDetail(item);
    /* 详情内容换了一篇：范文栏与页面都回到顶部，避免从半篇开始读 */
    if (eEl) eEl.scrollTop = 0;
    scrollPageTo(0);
    if (splitEl) splitEl.setAttribute('data-pane', 'q');
    var paneSeg = document.getElementById('edPaneSeg');
    if (paneSeg && window.syncSegThumb) {
      $$('.seg-btn', paneSeg).forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-pane') === 'q');
      });
      syncSegThumb(paneSeg, document.getElementById('edPaneThumb'));
    }
  }

  /* 供 app.js 切换视图时调用 */
  function show() {
    if (!listEl || !detailEl) return;
    stopSpeakEssay();          /* 离开/回到本模块：先停朗读，避免跨模块续读 */
    routeFromHash();
  }

  window.Essays = {
    init: init,
    show: show,
    open: function (id) { var it = byId(id); if (it) showDetail(it, true); },
    openWordBook: openWordBook
  };
})();
