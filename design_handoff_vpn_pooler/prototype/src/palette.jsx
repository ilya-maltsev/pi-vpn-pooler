const CommandPalette = ({ open, onClose, pools, setRoute, onSync, onToggleTheme }) => {
  const { Icons } = window;
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);

  const items = React.useMemo(() => {
    const base = [
      { group: 'Navigate', label: 'Overview', ico: Icons.Dashboard, action: () => setRoute({ name: 'dashboard' }), kbd: 'G O' },
      { group: 'Navigate', label: 'All pools', ico: Icons.Pools, action: () => setRoute({ name: 'pools' }), kbd: 'G P' },
      { group: 'Navigate', label: 'All allocations', ico: Icons.Network, action: () => setRoute({ name: 'allocations' }), kbd: 'G A' },
      { group: 'Navigate', label: 'Sync history', ico: Icons.Sync, action: () => setRoute({ name: 'sync' }), kbd: 'G S' },
      { group: 'Actions', label: 'Sync now', ico: Icons.Zap, action: () => onSync() },
      { group: 'Actions', label: 'Create new pool', ico: Icons.Plus, action: () => setRoute({ name: 'pool_new' }) },
      { group: 'Actions', label: 'Toggle theme', ico: Icons.Sliders, action: onToggleTheme },
    ];
    pools.forEach(p => base.push({
      group: 'Jump to pool',
      label: `${p.name}  ${p.cidr}`,
      ico: Icons.Pools,
      action: () => setRoute({ name: 'pool_detail', id: p.id }),
    }));
    if (!q) return base;
    const s = q.toLowerCase();
    return base.filter(i => i.label.toLowerCase().includes(s));
  }, [q, pools]);

  React.useEffect(() => { setSel(0); }, [q]);

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(items.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
    else if (e.key === 'Enter' && items[sel]) { e.preventDefault(); items[sel].action(); onClose(); }
    else if (e.key === 'Escape') { onClose(); }
  };

  if (!open) return null;

  // Group items
  const groups = {};
  items.forEach((it, i) => { (groups[it.group] = groups[it.group] || []).push({ ...it, _i: i }); });

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette" onClick={e => e.stopPropagation()}>
        <input ref={inputRef} className="palette-input" placeholder="Search pools, actions, pages…"
          value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}/>
        <div style={{ maxHeight: 360, overflow: 'auto' }}>
          {items.length === 0 && <div className="palette-empty">No results</div>}
          {Object.entries(groups).map(([g, list]) => (
            <div key={g}>
              <div className="palette-section">{g}</div>
              {list.map(it => (
                <div key={it._i} className={`palette-item ${sel === it._i ? 'active' : ''}`}
                  onMouseEnter={() => setSel(it._i)}
                  onClick={() => { it.action(); onClose(); }}>
                  <it.ico className="ico"/>
                  <span>{it.label}</span>
                  {it.kbd && <span className="kbd">{it.kbd}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="palette-foot">
          <span><span className="k">↑</span><span className="k">↓</span> navigate</span>
          <span><span className="k">↵</span> select</span>
          <span><span className="k">esc</span> close</span>
        </div>
      </div>
    </div>
  );
};

window.CommandPalette = CommandPalette;
