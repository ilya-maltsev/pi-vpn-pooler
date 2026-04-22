/* app.js — global interactions: sidebar collapse, g-chord shortcuts,
   data-action handlers, copy-on-click, row click-to-navigate,
   submit-required button gating. */
(function () {
  'use strict';

  // --- sidebar collapse ---------------------------------------------------
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action="toggle-sidebar"]');
    if (!btn) return;
    document.body.classList.toggle('collapsed');
    localStorage.setItem(
      'sidebarCollapsed',
      document.body.classList.contains('collapsed') ? '1' : '0'
    );
  });

  // --- clickable rows: <tr data-href="..."> navigates on click ------------
  document.addEventListener('click', function (e) {
    const tr = e.target.closest('tr.clickable[data-href]');
    if (!tr) return;
    if (e.target.closest('a, button, input, select, label, [data-copy]')) return;
    window.location.href = tr.dataset.href;
  });

  // --- copy-on-click ------------------------------------------------------
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-copy]');
    if (!el) return;
    e.preventDefault();
    const text = el.textContent.trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(ta);
    }
    const orig = el.textContent;
    el.textContent = document.body.dataset.i18nCopied || '✓ copied';
    el.classList.add('copy-hit');
    setTimeout(function () {
      el.textContent = orig;
      el.classList.remove('copy-hit');
    }, 900);
  });

  // --- confirm modal (data-action=confirm) --------------------------------
  function buildModal(opts) {
    const bd = document.createElement('div');
    bd.className = 'modal-bd';
    const box = document.createElement('div');
    box.className = 'modal';
    bd.appendChild(box);

    const head = document.createElement('div');
    head.className = 'modal-bd-inner';
    const h3 = document.createElement('h3');
    h3.textContent = opts.title || document.body.dataset.i18nConfirm || 'Confirm';
    const p = document.createElement('p');
    p.textContent = opts.message || '';
    head.appendChild(h3);
    head.appendChild(p);
    box.appendChild(head);

    const foot = document.createElement('div');
    foot.className = 'modal-foot';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'btn ghost';
    cancel.textContent = document.body.dataset.i18nCancel || 'Cancel';
    cancel.dataset.cancel = '1';
    const ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'btn ' + (opts.danger ? 'danger' : 'primary');
    ok.textContent = opts.confirmLabel || 'Confirm';
    ok.dataset.ok = '1';
    foot.appendChild(cancel);
    foot.appendChild(ok);
    box.appendChild(foot);
    return bd;
  }

  function openModal(opts) {
    const bd = buildModal(opts);
    document.body.appendChild(bd);
    function close() { bd.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Enter') { opts.onOk(); close(); }
    }
    bd.addEventListener('click', function (e) {
      if (e.target === bd) close();
      if (e.target.matches('[data-cancel]')) close();
      if (e.target.closest('[data-ok]')) { opts.onOk(); close(); }
    });
    document.addEventListener('keydown', onKey);
  }

  document.addEventListener('click', function (e) {
    const trigger = e.target.closest('[data-action="confirm"]');
    if (!trigger) return;
    e.preventDefault();
    const formId = trigger.dataset.formId;
    const form = formId ? document.getElementById(formId) : null;
    openModal({
      title: trigger.dataset.title,
      message: trigger.dataset.message,
      confirmLabel: trigger.dataset.confirmLabel,
      danger: trigger.classList.contains('danger'),
      onOk: function () { if (form) form.submit(); },
    });
  });

  // --- form gate ---------------------------------------------------------
  document.querySelectorAll('[data-submit-required]').forEach(function (btn) {
    const form = btn.closest('form');
    if (!form) return;
    const names = btn.dataset.submitRequired.split(',').map(function (s) { return s.trim(); });
    function refresh() {
      const ok = names.every(function (n) {
        const el = form.elements[n];
        return el && String(el.value || '').trim() !== '';
      });
      btn.disabled = !ok;
    }
    form.addEventListener('input', refresh);
    refresh();
  });

  // --- g-chord shortcuts + palette opener --------------------------------
  let lastG = 0;
  document.addEventListener('keydown', function (e) {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (['INPUT', 'TEXTAREA', 'SELECT'].indexOf(tag) !== -1) return;
    if (document.activeElement && document.activeElement.isContentEditable) return;

    const isK = e.key === 'k' || e.key === 'K';
    if ((e.metaKey || e.ctrlKey) && isK) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('palette:open'));
      return;
    }
    if (e.key === '/') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('palette:open'));
      return;
    }

    const now = Date.now();
    if (e.key === 'g') { lastG = now; return; }
    if (now - lastG < 800) {
      const routes = { o: '/', p: '/pools/', a: '/allocations/', s: '/sync/' };
      const url = routes[e.key];
      if (url) { e.preventDefault(); window.location.href = url; lastG = 0; }
    }
  });
})();
