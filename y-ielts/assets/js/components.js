/* ============================================================
 *  可复用 UI 组件层（本次改版新增 + iOS 适配）
 *    UI.Timer         倒计时（可暂停 / 重置 / 墙钟计时 / 状态可序列化）
 *    UI.Progress      进度条
 *    UI.Options       选项列表（四选一等），统一判定高亮
 *    UI.Empty         空状态插画（线性 SVG，替换原字符占位），可带引导按钮
 *    UI.Confirm       二次确认弹层（替代原生 confirm，受限环境下同样可用）
 *    UI.PullRefresh   移动端下拉刷新（iOS 习惯手势，纯触摸实现）
 *    UI.SwipeBack     移动端右滑手势返回（屏幕左 24px 内触发）
 *  说明：全部基于项目现有的原生 JS + 现有 CSS 类实现，未引入第三方库。
 *  本次修改点（综合修订）：
 *    1) 新增 UI.Confirm —— 原生 window.confirm 在 iframe / WebView / 无头环境中
 *       恒返回 false，会让「清空」类按钮点击后毫无反应；改用自建弹层后，
 *       写作「清空」、单词「清空词库」、阅读「清空本套作答」全部恢复可用。
 *    2) UI.Empty 增加第 5 个参数 action，用于渲染引导按钮（空词库、
 *       空历史记录等不再只显示「0 条」）。
 *  影响范围：全站破坏性操作的确认流程；各空状态渲染。
 *  影响范围：Writing 与 Reading 共用 UI.Timer；Vocabulary 与 Reading 共用
 *            UI.Options；各空状态共用 UI.Empty；iOS 端视图共用 PullRefresh
 *            与 SwipeBack；桌面端不生效（无 touchstart）。
 * ============================================================ */
window.UI = (function () {
  'use strict';

  /* ---------------- 倒计时 ---------------- */
  var registry = [];
  var cbs = [];
  var ticking = false;

  function tickAll() {
    var now = Date.now(), any = false;
    registry.forEach(function (t) { if (t._tick(now)) any = true; });
    return any;
  }

  /** 注册一个刷新回调并启动全局时钟（只会启动一次，多个模块共用） */
  function startTicker(cb) {
    if (cb) cbs.push(cb);
    if (ticking) return;
    ticking = true;
    setInterval(function () {
      if (tickAll()) cbs.forEach(function (fn) { try { fn(); } catch (e) {} });
    }, 250);
  }

  function Timer(opts) {
    opts = opts || {};
    var total = opts.total || 0;
    var st = { total: total, remaining: total, running: false, endsAt: 0, started: false };

    var api = {
      state: function () {
        return { total: st.total, remaining: st.remaining, running: st.running,
                 endsAt: st.endsAt, started: st.started };
      },
      restore: function (s) {
        if (!s) return;
        st.total = s.total || st.total;
        st.remaining = typeof s.remaining === 'number' ? s.remaining : st.total;
        st.running = !!s.running;
        st.endsAt = s.endsAt || 0;
        st.started = !!s.started;
        if (st.running && st.endsAt) {
          st.remaining = Math.max(0, (st.endsAt - Date.now()) / 1000);
          if (st.remaining <= 0) { st.running = false; st.remaining = 0; }
        }
      },
      setTotal: function (v) {
        st.total = v;
        if (!st.started) st.remaining = v;
      },
      start: function () {
        if (st.remaining <= 0) return false;
        st.running = true; st.started = true;
        st.endsAt = Date.now() + st.remaining * 1000;
        return true;
      },
      pause: function () { st.running = false; },
      toggle: function () { return st.running ? (api.pause(), false) : api.start(); },
      reset: function () {
        st.running = false; st.remaining = st.total; st.endsAt = 0; st.started = false;
      },
      remaining: function () { return st.remaining; },
      total: function () { return st.total; },
      running: function () { return st.running; },
      started: function () { return st.started; },
      finished: function () { return st.remaining <= 0 && st.total > 0; },
      _tick: function (now) {
        if (!st.running) return false;
        st.remaining = Math.max(0, (st.endsAt - now) / 1000);
        if (st.remaining <= 0) {
          st.running = false; st.remaining = 0;
          if (opts.onFinish) opts.onFinish();
        }
        if (opts.onTick) opts.onTick(st.remaining, st.total);
        return true;
      },
      destroy: function () {
        var i = registry.indexOf(api);
        if (i >= 0) registry.splice(i, 1);
      }
    };
    registry.push(api);
    startTicker(opts.onChange);
    return api;
  }

  /* ---------------- 进度条 ---------------- */
  function Progress(barEl, fillEl) {
    return {
      set: function (pct) {
        pct = Math.max(0, Math.min(100, pct));
        if (fillEl) fillEl.style.width = pct.toFixed(1) + '%';
      },
      hit: function (flag) {
        if (barEl) barEl.classList.toggle('is-hit', !!flag);
      }
    };
  }

  /* ---------------- 选项列表 ---------------- */
  function Options(container, cfg) {
    var keys = cfg.keys || 'ABCDEFGH';
    var items = cfg.items || [];
    var picked = null;
    container.innerHTML = items.map(function (v, i) {
      return '<button type="button" class="opt" data-i="' + i + '">' +
        '<span class="k">' + (keys[i] || (i + 1)) + '</span>' +
        '<span>' + esc(v) + '</span></button>';
    }).join('');

    var btns = $$('.opt', container);
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        if (container.dataset.locked === '1') return;
        picked = items[i];
        if (cfg.onPick) cfg.onPick(items[i], i);
      });
    });

    /* 键盘：方向键在选项间移动焦点，回车 / 空格由原生 button 触发选择 */
    container.addEventListener('keydown', function (e) {
      if (container.dataset.locked === '1') return;
      var idx = btns.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        btns[idx < 0 ? 0 : (idx + 1) % btns.length].focus();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        btns[idx <= 0 ? btns.length - 1 : idx - 1].focus();
      }
    });

    return {
      picked: function () { return picked; },
      lock: function () {
        container.dataset.locked = '1';
        btns.forEach(function (b) { b.disabled = true; });
      },
      /** 高亮：right = 正确答案值；selected = 用户所选值 */
      mark: function (right, selected) {
        btns.forEach(function (b, i) {
          var val = items[i];
          if (val === right) b.classList.add('is-right');
          else if (selected != null && val === selected) b.classList.add('is-wrong');
        });
      }
    };
  }

  /* ---------------- 空状态 ---------------- */
  /**
   * Empty(el, art, text, sub, action)
   *   action = { label: '载入示例词表（50 词）', onClick: fn, primary: true }
   *   第四次改版新增：空状态可带一个引导按钮，避免只显示「0 条」。
   */
  function Empty(el, art, text, sub, action) {
    if (!el) return;
    var btn = '';
    if (action && action.label) {
      btn = '<div class="empty-act"><button type="button" class="btn btn-sm' +
        (action.primary === false ? ' btn-ghost' : ' btn-primary') + '">' +
        esc(action.label) + '</button></div>';
    }
    el.innerHTML = '<div class="empty">' + Icons.art(art || 'doc', 58) +
      '<div>' + text + '</div>' +
      (sub ? '<div style="margin-top:6px;font-size:12px;opacity:.8">' + sub + '</div>' : '') +
      btn + '</div>';
    if (btn) {
      var b = el.querySelector('.empty-act .btn');
      if (b) b.addEventListener('click', function () {
        if (typeof action.onClick === 'function') action.onClick();
      });
    }
  }

  /* ---------------- 二次确认弹层 ---------------- */
  /* 原生 window.confirm 在受限环境（iframe / 部分 WebView / 无头浏览器）里
     恒返回 false，导致「清空」类按钮点击后毫无反应。这里改为自建弹层，
     全站所有破坏性操作共用同一个实例。
     用法：UI.Confirm({ title, text, ok, cancel, danger }, function (yes) { ... }) */
  var cfLayer = null, cfCb = null, cfLastFocus = null;

  function ensureConfirm() {
    if (cfLayer && cfLayer.parentNode) return cfLayer;
    var wrap = document.createElement('div');
    wrap.className = 'cf-layer';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML =
      '<div class="cf-mask" data-cf="0"></div>' +
      '<div class="cf-box" role="dialog" aria-modal="true" ' +
        'aria-labelledby="cfTitle" aria-describedby="cfText">' +
        '<h4 class="cf-title" id="cfTitle"></h4>' +
        '<p class="cf-text" id="cfText"></p>' +
        '<div class="cf-acts">' +
          '<button type="button" class="btn cf-cancel" data-cf="0">取消</button>' +
          '<button type="button" class="btn btn-primary cf-ok" data-cf="1">确定</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cf]') : null;
      if (!t) return;
      closeConfirm(t.getAttribute('data-cf') === '1');
    });
    cfLayer = wrap;
    return wrap;
  }

  function closeConfirm(yes) {
    if (!cfLayer) return;
    cfLayer.classList.remove('is-open');
    cfLayer.setAttribute('aria-hidden', 'true');
    var cb = cfCb;
    cfCb = null;
    if (cfLastFocus && cfLastFocus.focus) { try { cfLastFocus.focus(); } catch (e) {} }
    cfLastFocus = null;
    if (cb) cb(!!yes);
  }

  function Confirm(opts, cb) {
    opts = opts || {};
    var layer = ensureConfirm();
    layer.querySelector('#cfTitle').textContent = opts.title || '请确认';
    layer.querySelector('#cfText').textContent = opts.text || '确定要清空吗？此操作不可恢复。';
    var okBtn = layer.querySelector('.cf-ok');
    var cancelBtn = layer.querySelector('.cf-cancel');
    okBtn.textContent = opts.ok || '确定清空';
    cancelBtn.textContent = opts.cancel || '取消';
    okBtn.classList.toggle('btn-danger', opts.danger !== false);
    okBtn.classList.toggle('btn-primary', opts.danger === false);
    cfCb = typeof cb === 'function' ? cb : null;
    cfLastFocus = document.activeElement;
    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden', 'false');
    setTimeout(function () { okBtn.focus(); }, 30);
  }

  function onConfirmEsc(e) {
    if (e.key === 'Escape' && cfLayer && cfLayer.classList.contains('is-open')) {
      e.stopPropagation();
      closeConfirm(false);
    }
  }
  document.addEventListener('keydown', onConfirmEsc);

  /* ---------------- 移动端：下拉刷新 ---------------- */
  /**
   * 给容器附加「下拉刷新」。
   * 用法：UI.PullRefresh(scrollEl, function(done){ 加载数据; done(); });
   * 触发：手指在容器顶部往下拖超过 60px，松手触发回调。
   */
  function PullRefresh(el, onRefresh) {
    if (!el) return { destroy: function () {} };
    var startY = 0, dist = 0, active = false, triggered = false;
    var indicator = document.createElement('div');
    indicator.className = 'pull-indicator';
    indicator.innerHTML = Icons.get('reset', 18) + '<span>下拉刷新</span>';
    el.insertBefore(indicator, el.firstChild);

    function down(e) {
      if (el.scrollTop > 0) return;
      startY = (e.touches ? e.touches[0] : e).pageY;
      dist = 0; active = true; triggered = false;
    }
    function move(e) {
      if (!active) return;
      var y = (e.touches ? e.touches[0] : e).pageY;
      dist = Math.max(0, y - startY);
      if (dist > 0) {
        e.preventDefault && e.preventDefault();
        indicator.classList.add('is-active');
        indicator.style.transform = 'translateY(' + (dist * 0.4) + 'px)';
        if (dist > 90) indicator.querySelector('span').textContent = '松手立即刷新';
        else indicator.querySelector('span').textContent = '下拉刷新';
      }
    }
    function up() {
      if (!active) return;
      active = false;
      if (dist > 90 && !triggered) {
        triggered = true;
        indicator.classList.add('is-loading');
        indicator.querySelector('span').textContent = '正在刷新…';
        var done = function () {
          indicator.classList.remove('is-loading', 'is-active');
          indicator.style.transform = '';
          indicator.querySelector('span').textContent = '下拉刷新';
        };
        try { onRefresh && onRefresh(done); } catch (e) { done(); }
        if (!onRefresh) done();
      } else {
        indicator.classList.remove('is-active');
        indicator.style.transform = '';
      }
    }
    el.addEventListener('touchstart', down, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', up, { passive: true });
    el.addEventListener('touchcancel', up, { passive: true });

    return {
      destroy: function () {
        el.removeEventListener('touchstart', down);
        el.removeEventListener('touchmove', move);
        el.removeEventListener('touchend', up);
        el.removeEventListener('touchcancel', up);
        if (indicator.parentNode) indicator.parentNode.removeChild(indicator);
      }
    };
  }

  /* ---------------- 移动端：右滑手势返回 ---------------- */
  /**
   * 监听屏幕左 24px 内的右滑手势，触发回调。
   * 不会和系统边滑返回冲突（用户从屏幕中部开始拖则不响应）。
   * 用法：UI.SwipeBack(function(){ history.back(); });
   */
  function SwipeBack(onBack) {
    var startX = 0, startY = 0, active = false;
    function down(e) {
      if (e.touches && e.touches[0].pageX > 24) return;
      startX = e.touches[0].pageX; startY = e.touches[0].pageY;
      active = true;
    }
    function move(e) {
      if (!active) return;
      var dx = e.touches[0].pageX - startX;
      var dy = Math.abs(e.touches[0].pageY - startY);
      if (dx > 80 && dy < 50) { active = false; try { onBack && onBack(); } catch (e) {} }
    }
    function up() { active = false; }
    document.addEventListener('touchstart', down, { passive: true });
    document.addEventListener('touchmove', move, { passive: true });
    document.addEventListener('touchend', up, { passive: true });
    return { destroy: function () {
      document.removeEventListener('touchstart', down);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', up);
    } };
  }

  return {
    Timer: Timer,
    startTicker: startTicker,
    Progress: Progress,
    Options: Options,
    Empty: Empty,
    Confirm: Confirm,
    PullRefresh: PullRefresh,
    SwipeBack: SwipeBack
  };
})();
