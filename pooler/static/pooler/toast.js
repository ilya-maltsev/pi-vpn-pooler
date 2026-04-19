/* toast.js — promote server-rendered .messages into bottom-right toasts,
   and expose `window.toast(tone, text, sub)` for future use. */
(function () {
  'use strict';

  const stack = document.getElementById('toasts');

  function push(tone, text, sub) {
    if (!stack) return;
    const t = document.createElement('div');
    t.className = 'toast ' + (tone || 'info');
    const dot = document.createElement('span'); dot.className = 'dot';
    const body = document.createElement('div');
    const b = document.createElement('b'); b.textContent = text || '';
    body.appendChild(b);
    if (sub) { const s = document.createElement('span'); s.textContent = sub; body.appendChild(s); }
    t.appendChild(dot);
    t.appendChild(body);
    stack.appendChild(t);
    setTimeout(function () {
      t.classList.add('fade-out');
      setTimeout(function () { t.remove(); }, 220);
    }, 3800);
  }
  window.toast = push;

  // Hoist server-rendered Django messages into the toast stack.
  // They stay in .messages too (for no-JS fallback + accessibility).
  document.querySelectorAll('.messages .msg').forEach(function (m) {
    // Figure out tone from class: msg-success / msg-error / msg-warning / msg-info
    const cls = m.className.match(/msg-(\w+)/);
    const tone = cls ? cls[1] : 'info';
    push(tone, m.textContent.trim(), null);
  });
})();
