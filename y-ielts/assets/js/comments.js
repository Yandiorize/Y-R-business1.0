/* =============================================================
 *  Y-IELTS · 留言区（独立页 · 本地留言，无登录、无后端）
 *  ---------------------------------------------------------------
 *  · 数据只存 localStorage 的 comments 键（仍在 ielts.cbt.v1 里）
 *  · 不发网络请求，不上传任何内容
 *  · 空态里的示例带「示例」标签，且不写进数据、不计数，
 *    不冒充真实用户
 *  · 提交有四种结果：校验拦截 / 提交中 / 成功 / 写入失败（可重试）
 * ============================================================= */
(function () {
  'use strict';

  var KEY = 'comments';
  var MAX = 200;          /* 只留最近 200 条，防本地存储膨胀 */
  var LIMIT = 500;        /* 单条上限，与 textarea maxlength 一致 */
  var el = {};

  function load() {
    var list = Store.get(KEY, null);
    if (!Array.isArray(list)) list = [];
    return list.filter(function (c) { return c && typeof c.text === 'string'; });
  }

  function save(list) {
    Store.set(KEY, list.slice(0, MAX));
  }

  /* 写入是否真的落到 localStorage：Store.set 遇到超配额会静默失败，
     所以这里直接读原始串回验，失败才好给出可重试的提示。 */
  function persisted(id) {
    try {
      var raw = localStorage.getItem('ielts.cbt.v1');
      if (!raw) return false;
      var o = JSON.parse(raw);
      if (!o || !Array.isArray(o.comments)) return false;
      for (var i = 0; i < o.comments.length; i++) {
        if (o.comments[i] && String(o.comments[i].id) === String(id)) return true;
      }
      return false;
    } catch (e) { return false; }
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function fmtAt(t) {
    var d = new Date(t);
    var now = new Date();
    var hm = pad(d.getHours()) + ':' + pad(d.getMinutes());
    if (d.toDateString() === now.toDateString()) return '今天 ' + hm;
    var y = new Date(now.getTime() - 86400000);
    if (d.toDateString() === y.toDateString()) return '昨天 ' + hm;
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + hm;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function showErr(msg) {
    if (!el.err) return;
    el.err.hidden = !msg;
    el.err.textContent = msg || '';
    if (!el.text) return;
    if (msg) el.text.setAttribute('aria-invalid', 'true');
    else el.text.removeAttribute('aria-invalid');
  }

  function setSend(busy) {
    if (!el.send) return;
    el.send.disabled = !!busy;
    el.send.setAttribute('aria-busy', busy ? 'true' : 'false');
    var lbl = el.send.querySelector('.lbl');
    if (lbl) lbl.textContent = busy ? '发布中…' : '发布留言';
    else el.send.textContent = busy ? '发布中…' : '发布留言';
  }

  function render() {
    if (!el.list) return;
    var mine = load();
    var rows = mine.slice().sort(function (a, b) { return (b.at || 0) - (a.at || 0); });

    el.list.innerHTML = rows.map(function (c) {
      return '<li class="cm-item" data-id="' + esc(c.id) + '">' +
        '<div class="cm-head">' +
          '<b class="cm-who">' + esc((c.name || '').trim() || '匿名') + '</b>' +
          '<span class="cm-time">' + fmtAt(c.at) + '</span>' +
          '<button class="cm-del" type="button" data-del="' + esc(c.id) + '"' +
            ' title="删除这条留言" aria-label="删除这条留言">✕</button>' +
        '</div>' +
        '<p class="cm-body">' + esc(c.text).replace(/\n/g, '<br>') + '</p>' +
      '</li>';
    }).join('');

    var n = rows.length;
    if (el.count) el.count.textContent = n + ' 条留言';
    if (el.empty) el.empty.hidden = n > 0;
    if (el.clear) el.clear.hidden = n === 0;

    Array.prototype.forEach.call(el.list.querySelectorAll('[data-del]'), function (b) {
      b.addEventListener('click', function () { askDelete(b.getAttribute('data-del')); });
    });
  }

  function askDelete(id) {
    var row = el.list.querySelector('[data-id="' + id + '"]');
    var who = row && row.querySelector('.cm-who') ? row.querySelector('.cm-who').textContent : '';
    var fn = function (yes) {
      if (!yes) return;
      var next = load().filter(function (c) { return String(c.id) !== String(id); });
      save(next);
      render();
      toast('已删除' + (who ? '「' + who + '」的留言' : ''), 1600);
    };
    if (window.UI && UI.Confirm) {
      UI.Confirm({ title: '删除这条留言', text: '删掉后不能恢复。', ok: '删除' }, fn);
    } else if (window.confirm('删除这条留言？')) {
      fn(true);
    }
  }

  function askClear() {
    var n = load().length;
    var fn = function (yes) {
      if (!yes) return;
      Store.set(KEY, []);
      render();
      toast('已清空 ' + n + ' 条留言', 1600);
    };
    if (window.UI && UI.Confirm) {
      UI.Confirm({
        title: '清空全部留言',
        text: '这台设备上的 ' + n + ' 条留言会全部删掉，不能恢复。',
        ok: '全部清空'
      }, fn);
    } else if (window.confirm('清空全部 ' + n + ' 条留言？')) {
      fn(true);
    }
  }

  function submit(e) {
    if (e) e.preventDefault();
    if (el.send && el.send.disabled) return;

    var text = (el.text && el.text.value || '').trim();
    if (!text) {
      showErr('还没写内容。写一句再发，比如今天做了哪套题。');
      if (el.text) el.text.focus();
      return;
    }
    showErr('');

    var item = {
      id: 'c' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: (el.name && el.name.value || '').trim().slice(0, 20),
      text: text.slice(0, LIMIT),
      at: Date.now()
    };
    var prev = load();
    var next = [item].concat(prev);

    setSend(true);
    /* 本地写入是同步的；这里留一格短过渡，让「发布中」这个状态真实可见，
       而不是按钮闪一下什么都看不到。 */
    setTimeout(function () {
      save(next);
      var ok = persisted(item.id);
      if (!ok) {
        save(prev);                       /* 回滚，别让列表出现存不住的留言 */
        setSend(false);
        showErr('本机存储写不进去（可能已满或被浏览器禁用）。删几条旧留言再试，内容没丢。');
        return;
      }
      if (el.text) el.text.value = '';
      if (el.left) el.left.textContent = String(LIMIT);
      setSend(false);
      render();
      toast('已保存到本机', 1600);
      if (el.list && el.list.firstElementChild) {
        el.list.firstElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 320);
  }

  function init() {
    el.list = document.getElementById('cmList');
    el.count = document.getElementById('cmCount');
    el.empty = document.getElementById('cmEmpty');
    el.form = document.getElementById('cmForm');
    el.name = document.getElementById('cmName');
    el.text = document.getElementById('cmText');
    el.send = document.getElementById('cmSend');
    el.err = document.getElementById('cmErr');
    el.clear = document.getElementById('cmClear');
    el.left = document.getElementById('cmLeft');
    el.first = document.getElementById('cmFirst');
    if (!el.list) return;

    if (el.form) el.form.addEventListener('submit', submit);
    if (el.clear) el.clear.addEventListener('click', askClear);
    if (el.first) {
      el.first.addEventListener('click', function () {
        if (el.text) { el.text.focus(); el.text.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      });
    }
    if (el.text) {
      el.text.addEventListener('input', function () {
        if (el.left) el.left.textContent = String(Math.max(0, LIMIT - el.text.value.length));
        if (!el.err || el.err.hidden) return;
        if (el.text.value.trim()) showErr('');
      });
    }
    render();
  }

  window.Comments = { init: init, render: render };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
