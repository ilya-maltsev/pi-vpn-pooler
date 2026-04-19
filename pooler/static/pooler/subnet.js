/* subnet.js — render a .subnet-viz grid from data-* attrs:
   - data-total:    total usable hosts
   - data-used:     JSON array of used indices
   - data-gateway:  index to render as `.gw` (optional)
   - data-compact:  "1" for denser rendering
   - data-max:      cap at N cells (default 1024) */
(function () {
  'use strict';

  function render(el) {
    const total = parseInt(el.dataset.total || '0', 10);
    const max = parseInt(el.dataset.max || '1024', 10);
    const compact = el.dataset.compact === '1';
    const gateway = el.dataset.gateway === '' ? null : parseInt(el.dataset.gateway, 10);
    let used = [];
    try { used = JSON.parse(el.dataset.used || '[]'); } catch (_) { used = []; }
    const usedSet = new Set(used);

    const shown = Math.min(total, max);
    const cols = Math.ceil(Math.sqrt(shown * (compact ? 2.5 : 3)));
    el.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';

    const frag = document.createDocumentFragment();
    for (let i = 0; i < shown; i++) {
      const d = document.createElement('div');
      d.className = 'cell';
      if (gateway !== null && i === gateway) d.classList.add('gw');
      else if (usedSet.has(i)) d.classList.add('used');
      frag.appendChild(d);
    }
    // Replace noscript content if any, then cells.
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(frag);

    // Hover label for sibling element [data-subnet-label], if present.
    const label = document.querySelector('[data-subnet-label]');
    if (label) {
      const original = label.textContent;
      el.addEventListener('mouseleave', function () { label.textContent = original; });
      el.addEventListener('mousemove', function (e) {
        const cell = e.target.closest('.cell');
        if (!cell) return;
        const idx = Array.prototype.indexOf.call(el.children, cell);
        if (idx < 0) return;
        label.textContent = 'host .' + (idx + 1);
      });
    }
  }

  document.querySelectorAll('.subnet-viz[data-total]').forEach(render);
})();
