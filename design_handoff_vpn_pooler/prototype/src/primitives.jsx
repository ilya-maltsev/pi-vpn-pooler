// Small shared components

const Badge = ({ tone = 'default', children, dot }) => (
  <span className={`badge ${tone === 'default' ? '' : tone}`}>
    {dot && <span className="dot"/>}
    {children}
  </span>
);

const Progress = ({ pct, tone }) => {
  const t = tone || (pct < 60 ? '' : pct < 85 ? 'warn' : 'bad');
  return (
    <div className={`prog ${t}`}>
      <span style={{ width: Math.min(100, Math.max(0, pct)) + '%' }}/>
    </div>
  );
};

// Subnet visualizer — grid of dots, one per host. Scales to fit.
const SubnetGrid = ({ total, used, gateway = 1, onHover, hoverIndex, compact, maxCells = 1024 }) => {
  const shown = Math.min(total, maxCells);
  const cols = compact ? Math.ceil(Math.sqrt(shown * 2.5)) : Math.ceil(Math.sqrt(shown * 3));
  const rows = Math.ceil(shown / cols);
  // Pre-compute which cells are 'used' — deterministic scatter
  const usedSet = React.useMemo(() => {
    const set = new Set();
    // Cluster used cells near the start (realistic: low-numbered IPs fill first)
    let i = 0;
    let filled = 0;
    const skipInterval = Math.max(1, Math.round(shown / Math.max(1, used + 1)));
    while (filled < Math.min(used, shown - gateway) && i < shown) {
      if (i !== 0 && Math.random() < 0.8) set.add(i);
      i++;
      if (set.size > filled) filled = set.size;
    }
    // Ensure count matches
    while (set.size < Math.min(used, shown - gateway)) {
      const n = Math.floor(Math.random() * (shown - 1)) + 1;
      set.add(n);
    }
    return set;
  }, [shown, used, gateway]);
  return (
    <div className="subnet-viz" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: shown }, (_, i) => {
        const cls = i === 0 ? 'gw' : usedSet.has(i) ? 'used' : '';
        const hov = hoverIndex === i ? 'hover' : '';
        return <div key={i} className={`cell ${cls} ${hov}`}
          onMouseEnter={onHover ? () => onHover(i) : undefined}
        />;
      })}
    </div>
  );
};

// Mono IP — with copy-on-click
const Mono = ({ children, copy, className = '' }) => {
  const [copied, setCopied] = React.useState(false);
  if (!copy) return <span className={`mono ${className}`}>{children}</span>;
  return (
    <span className={`mono ${className}`} style={{ cursor: 'pointer', borderBottom: '1px dashed var(--line-2)' }}
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(String(children));
        setCopied(true);
        setTimeout(() => setCopied(false), 900);
      }}
      title="Click to copy">
      {copied ? '✓ copied' : children}
    </span>
  );
};

// Status dot
const StatusDot = ({ tone }) => (
  <span style={{
    width: 6, height: 6, borderRadius: '50%',
    background: tone === 'ok' ? 'var(--ok)' : tone === 'bad' ? 'var(--bad)' : tone === 'warn' ? 'var(--warn)' : 'var(--mut)',
    boxShadow: `0 0 0 3px color-mix(in oklch, var(--${tone === 'ok' ? 'ok' : tone === 'bad' ? 'bad' : tone === 'warn' ? 'warn' : 'mut'}) 18%, transparent)`,
    display: 'inline-block',
  }}/>
);

// Sortable table helper
const useSort = (rows, initial = null) => {
  const [sort, setSort] = React.useState(initial);
  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const sign = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'number') return (av - bv) * sign;
      return String(av || '').localeCompare(String(bv || '')) * sign;
    });
  }, [rows, sort]);
  const onClick = (key) => {
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: 'asc' };
      if (s.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };
  return { sorted, sort, onSort: onClick };
};

const SortHead = ({ sort, onSort, k, children, align }) => {
  const is = sort && sort.key === k;
  return (
    <th className={`sortable ${is ? 'sorted' : ''}`} onClick={() => onSort(k)} style={{ textAlign: align }}>
      {children}
      <span className="sort-ico">{is ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
    </th>
  );
};

const Modal = ({ title, desc, onCancel, onConfirm, confirmLabel = 'Confirm', danger }) => (
  <div className="modal-bd" onClick={onCancel}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-bd-inner">
        <h3>{title}</h3>
        {desc && <p>{desc}</p>}
      </div>
      <div className="modal-foot">
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
        <button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);

Object.assign(window, { Badge, Progress, SubnetGrid, Mono, StatusDot, useSort, SortHead, Modal });
