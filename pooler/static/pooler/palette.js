/* palette.js — ⌘K command palette. Data lives in <template id="palette-data">. */
(function () {
  'use strict';

  const tpl = document.getElementById('palette-data');
  let data = { sections: [] };
  if (tpl) {
    try { data = JSON.parse(tpl.textContent || '{}'); } catch (_) {}
  }
  const root = document.getElementById('palette-root');

  let open = false;
  let filter = '';
  let activeIdx = 0;
  let flatItems = []; // current filtered items, flat list

  function flatten(sections) {
    const flat = [];
    sections.forEach(function (s) {
      s.items.forEach(function (it) { flat.push({ section: s.title, item: it }); });
    });
    return flat;
  }

  function matches(it, q) {
    if (!q) return true;
    const hay = [it.label, it.sub || '', it.section].join(' ').toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function close() {
    if (!open) return;
    open = false;
    filter = '';
    activeIdx = 0;
    while (root.firstChild) root.removeChild(root.firstChild);
    root.hidden = true;
    document.removeEventListener('keydown', onKey);
  }

  function go(it) { window.location.href = it.url; }

  function iconSymbol(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ico');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    // Match the static path used by the base template.
    const spritePath = document.querySelector('link[rel="stylesheet"][href*="pooler/style.css"]');
    const href = spritePath
      ? spritePath.getAttribute('href').replace(/style\.css.*$/, 'icons.svg')
      : '/static/pooler/icons.svg';
    use.setAttribute('href', href + '#' + name);
    svg.appendChild(use);
    return svg;
  }

  function renderList() {
    // Group flatItems by section preserving order.
    const sections = [];
    const byTitle = new Map();
    flatItems.forEach(function (row) {
      if (!byTitle.has(row.section)) {
        const s = { title: row.section, items: [] };
        byTitle.set(row.section, s);
        sections.push(s);
      }
      byTitle.get(row.section).items.push(row.item);
    });

    const input = root.querySelector('.palette-input');
    const body = root.querySelector('.palette-body');
    while (body.firstChild) body.removeChild(body.firstChild);

    if (flatItems.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'palette-empty';
      empty.textContent = document.body.dataset.i18nNoMatches || 'No matches.';
      body.appendChild(empty);
      return;
    }

    let cursor = 0;
    sections.forEach(function (s) {
      const h = document.createElement('div');
      h.className = 'palette-section';
      h.textContent = s.title;
      body.appendChild(h);
      s.items.forEach(function (it) {
        const row = document.createElement('div');
        row.className = 'palette-item' + (cursor === activeIdx ? ' active' : '');
        row.dataset.idx = String(cursor);
        if (it.icon) row.appendChild(iconSymbol(it.icon));
        const label = document.createElement('div');
        label.style.minWidth = '0';
        label.style.flex = '1';
        const l = document.createElement('div');
        l.textContent = it.label;
        label.appendChild(l);
        if (it.sub) {
          const s2 = document.createElement('div');
          s2.className = 'mono mut';
          s2.style.fontSize = '10.5px';
          s2.textContent = it.sub;
          label.appendChild(s2);
        }
        row.appendChild(label);
        if (it.kbd) {
          const k = document.createElement('span');
          k.className = 'kbd';
          k.textContent = it.kbd;
          row.appendChild(k);
        }
        row.addEventListener('click', function () { go(it); close(); });
        body.appendChild(row);
        cursor++;
      });
    });
  }

  function applyFilter(v) {
    filter = String(v || '').trim().toLowerCase();
    const flat = flatten(data.sections);
    flatItems = flat.filter(function (row) { return matches(row.item, filter) || matches({label: row.section}, filter); });
    if (activeIdx >= flatItems.length) activeIdx = Math.max(0, flatItems.length - 1);
    renderList();
  }

  function openPalette() {
    if (!root || open) return;
    open = true;
    root.hidden = false;

    const bd = document.createElement('div');
    bd.className = 'palette-backdrop';
    const box = document.createElement('div');
    box.className = 'palette';

    const input = document.createElement('input');
    input.className = 'palette-input';
    input.type = 'text';
    input.placeholder = document.body.dataset.i18nPalettePlaceholder || 'Type a command or search…';
    input.setAttribute('autocomplete', 'off');

    const body = document.createElement('div');
    body.className = 'palette-body';
    body.style.maxHeight = '60vh';
    body.style.overflowY = 'auto';

    const foot = document.createElement('div');
    foot.className = 'palette-foot';
    foot.textContent = '';
    const hint = function (keys, label) {
      const span = document.createElement('span');
      keys.forEach(function (k) {
        const kk = document.createElement('span'); kk.className = 'k'; kk.textContent = k; span.appendChild(kk);
      });
      span.appendChild(document.createTextNode(' ' + label));
      return span;
    };
    var i18n = document.body.dataset;
    foot.appendChild(hint(['↑', '���'], i18n.i18nNavigate || 'navigate'));
    foot.appendChild(hint(['↵'], i18n.i18nSelect || 'select'));
    foot.appendChild(hint(['esc'], i18n.i18nClose || 'close'));

    box.appendChild(input);
    box.appendChild(body);
    box.appendChild(foot);
    bd.appendChild(box);
    root.appendChild(bd);

    applyFilter('');
    setTimeout(function () { input.focus(); }, 10);

    input.addEventListener('input', function () { applyFilter(input.value); });
    bd.addEventListener('click', function (e) { if (e.target === bd) close(); });

    document.addEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatItems.length) { activeIdx = (activeIdx + 1) % flatItems.length; renderList(); }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatItems.length) { activeIdx = (activeIdx - 1 + flatItems.length) % flatItems.length; renderList(); }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[activeIdx]) go(flatItems[activeIdx].item);
      close();
      return;
    }
  }

  // Hooks used by app.js / buttons.
  window.addEventListener('palette:open', openPalette);
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-action="open-palette"]')) {
      e.preventDefault();
      openPalette();
    }
  });
})();
