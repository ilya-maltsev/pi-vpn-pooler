// ===== src/icons.jsx =====
// Stroke icons — 16px default. All share the same stroke weight for visual coherence.
const Icon = ({ d, size = 16, children, ...rest }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {children || <path d={d} />}
  </svg>
);

const Icons = {
  Dashboard: (p) => <Icon {...p}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></Icon>,
  Pools: (p) => <Icon {...p}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Sync: (p) => <Icon {...p}><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>,
  Close: (p) => <Icon {...p}><path d="M18 6L6 18M6 6l12 12"/></Icon>,
  Check: (p) => <Icon {...p}><path d="M20 6L9 17l-5-5"/></Icon>,
  Trash: (p) => <Icon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></Icon>,
  Pencil: (p) => <Icon {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></Icon>,
  Chevron: (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>,
  ChevronUp: (p) => <Icon {...p}><path d="M6 15l6-6 6 6"/></Icon>,
  ChevronDown: (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>,
  ChevronLeft: (p) => <Icon {...p}><path d="M15 18l-6-6 6-6"/></Icon>,
  Logout: (p) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></Icon>,
  Globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></Icon>,
  Filter: (p) => <Icon {...p}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/></Icon>,
  Download: (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  Server: (p) => <Icon {...p}><rect x="3" y="3" width="18" height="8" rx="1"/><rect x="3" y="13" width="18" height="8" rx="1"/><path d="M7 7h.01M7 17h.01"/></Icon>,
  Network: (p) => <Icon {...p}><rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M12 8v4M12 12H5v4M12 12h7v4"/></Icon>,
  Key: (p) => <Icon {...p}><circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L21 2l-3 3 2 2-3 3-2-2-2.2 2.2"/></Icon>,
  Terminal: (p) => <Icon {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 9l3 3-3 3M12 15h6"/></Icon>,
  Sliders: (p) => <Icon {...p}><path d="M4 21V14M4 10V3M12 21V12M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></Icon>,
  ArrowRight: (p) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6"/></Icon>,
  ArrowUp: (p) => <Icon {...p}><path d="M12 19V5M6 11l6-6 6 6"/></Icon>,
  ArrowDown: (p) => <Icon {...p}><path d="M12 5v14M6 13l6 6 6-6"/></Icon>,
  Dot: (p) => <Icon {...p}><circle cx="12" cy="12" r="3" fill="currentColor"/></Icon>,
  Copy: (p) => <Icon {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Icon>,
  Zap: (p) => <Icon {...p}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></Icon>,
  Menu: (p) => <Icon {...p}><path d="M3 6h18M3 12h18M3 18h18"/></Icon>,
  Command: (p) => <Icon {...p}><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></Icon>,
};

window.Icons = Icons;


// ===== src/data.jsx =====
// Mock data — realistic VPN pool scenarios
const initialPools = [
  {
    id: 1, name: 'VPN-1', cidr: '172.20.0.0/22', attr_key: 'VPN-IP',
    gateway: '172.20.0.1', description: 'Primary corporate remote access pool',
    total: 1021, created: '2025-11-03',
  },
  {
    id: 2, name: 'contractors', cidr: '10.88.16.0/24', attr_key: 'VPN-IP-CNTR',
    gateway: '10.88.16.1', description: 'Short-lived contractor sessions (auto-reap 30d)',
    total: 253, created: '2026-01-18',
  },
  {
    id: 3, name: 'site-eu-west', cidr: '10.42.0.0/23', attr_key: 'VPN-IP-EU',
    gateway: '10.42.0.1', description: 'EU west region — Frankfurt PoP',
    total: 509, created: '2026-02-02',
  },
  {
    id: 4, name: 'lab', cidr: '192.168.200.0/26', attr_key: 'LAB-IP',
    gateway: '192.168.200.1', description: 'Internal lab — no egress',
    total: 61, created: '2026-03-11',
  },
];

const sampleUsernames = [
  'alice.ng','bgarcia','c.thorne','david.ok','eli.su','frank.v','gale.h','hiroshi.t',
  'igor.pm','jhassan','kwame.a','lina.wu','m.okafor','nik.j','oliver.b','petra.s',
  'qi.ren','ravi.pk','sara.du','tom.nz','uma.i','vera.mc','w.khoury','xiao.l','yuki.a','zed.ms',
];
const sampleRealms = ['corp.local','ldap.eu','ad.us','contractors','lab'];

function makeAllocations() {
  const out = [];
  // Pool 1 — heavy usage
  const base1 = 172 * 16777216 + 20 * 65536;
  const used1 = 743;
  const shuffled = Array.from({length: 1021}, (_, i) => i).sort(() => Math.random() - 0.5);
  for (let i = 0; i < used1; i++) {
    const n = base1 + 2 + shuffled[i]; // skip network + gateway
    const b = [(n>>24)&255,(n>>16)&255,(n>>8)&255,n&255];
    const ip = b.join('.');
    const user = sampleUsernames[i % sampleUsernames.length] + (i > 25 ? String(Math.floor(i/26)) : '');
    const realm = sampleRealms[i % 3];
    const daysAgo = Math.floor(Math.random() * 60);
    out.push({
      id: `p1-${i}`, pool_id: 1, ip, username: user, realm, attr_key: 'VPN-IP',
      synced_at: formatAgo(daysAgo * 86400 * 1000 + Math.random() * 86400 * 1000),
      _sort: Date.now() - daysAgo * 86400000,
    });
  }
  // Pool 2 — light usage
  const base2 = 10 * 16777216 + 88 * 65536 + 16 * 256;
  for (let i = 0; i < 38; i++) {
    const n = base2 + 2 + i * 3;
    const b = [(n>>24)&255,(n>>16)&255,(n>>8)&255,n&255];
    out.push({
      id: `p2-${i}`, pool_id: 2, ip: b.join('.'),
      username: 'cntr-' + (i+101), realm: 'contractors', attr_key: 'VPN-IP-CNTR',
      synced_at: formatAgo(Math.random() * 7 * 86400000),
      _sort: Date.now() - Math.random() * 7 * 86400000,
    });
  }
  // Pool 3 — moderate
  const base3 = 10 * 16777216 + 42 * 65536;
  for (let i = 0; i < 212; i++) {
    const n = base3 + 2 + i;
    const b = [(n>>24)&255,(n>>16)&255,(n>>8)&255,n&255];
    out.push({
      id: `p3-${i}`, pool_id: 3, ip: b.join('.'),
      username: sampleUsernames[(i + 7) % sampleUsernames.length],
      realm: 'ldap.eu', attr_key: 'VPN-IP-EU',
      synced_at: formatAgo(Math.random() * 30 * 86400000),
      _sort: Date.now() - Math.random() * 30 * 86400000,
    });
  }
  // Pool 4 — mostly empty
  for (let i = 0; i < 7; i++) {
    out.push({
      id: `p4-${i}`, pool_id: 4, ip: '192.168.200.' + (2 + i*3),
      username: 'labuser' + i, realm: 'lab', attr_key: 'LAB-IP',
      synced_at: formatAgo(Math.random() * 3 * 86400000),
      _sort: Date.now() - Math.random() * 3 * 86400000,
    });
  }
  return out;
}

function formatAgo(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const syncLogs = [
  { id: 1, started: '2026-04-18 07:51:04', finished: '2026-04-18 07:51:12', status: 'success', details: 'Found 1000 allocation(s) across 5 realm(s)' },
  { id: 2, started: '2026-04-18 01:51:01', finished: '2026-04-18 01:51:09', status: 'success', details: 'Found 996 allocation(s) across 5 realm(s)' },
  { id: 3, started: '2026-04-17 19:51:03', finished: '2026-04-17 19:51:11', status: 'success', details: 'Found 994 allocation(s) across 5 realm(s)' },
  { id: 4, started: '2026-04-17 13:51:02', finished: '2026-04-17 13:51:10', status: 'success', details: 'Found 990 allocation(s) across 5 realm(s)' },
  { id: 5, started: '2026-04-17 07:51:01', finished: '2026-04-17 07:51:22', status: 'error', details: 'privacyIDEA connection refused (connect to 10.0.0.5:443 — timeout after 20s)' },
  { id: 6, started: '2026-04-17 01:51:00', finished: '2026-04-17 01:51:08', status: 'success', details: 'Found 988 allocation(s) across 5 realm(s)' },
  { id: 7, started: '2026-04-16 19:51:05', finished: '2026-04-16 19:51:13', status: 'success', details: 'Found 987 allocation(s) across 5 realm(s)' },
  { id: 8, started: '2026-04-16 13:51:02', finished: '2026-04-16 13:51:09', status: 'success', details: 'Found 985 allocation(s) across 5 realm(s)' },
];

window.mockData = {
  initialPools,
  makeAllocations,
  sampleUsernames,
  sampleRealms,
  syncLogs,
  formatAgo,
};


// ===== src/primitives.jsx =====
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


// ===== src/sidebar.jsx =====
const Sidebar = ({ route, setRoute, collapsed, setCollapsed, pools, allocations, onPalette }) => {
  const { Icons } = window;
  const totalAlloc = allocations.length;

  const links = [
    { key: 'dashboard', label: 'Overview', icon: Icons.Dashboard, kbd: 'G O' },
    { key: 'pools', label: 'Pools', icon: Icons.Pools, count: pools.length, kbd: 'G P' },
    { key: 'allocations', label: 'Allocations', icon: Icons.Network, count: totalAlloc, kbd: 'G A' },
    { key: 'sync', label: 'Sync', icon: Icons.Sync, kbd: 'G S' },
  ];

  return (
    <aside className="side">
      <div className="side-brand">
        <div className="brand-mark">V</div>
        <div className="brand-text">
          VPN Pooler
          <span className="brand-sub">privacyIDEA • v2</span>
        </div>
      </div>

      <div className="side-nav">
        <button className="side-link" onClick={onPalette} style={{ width: '100%', marginBottom: 6 }}>
          <Icons.Search className="ico"/>
          <span className="side-label">Quick search</span>
          <span className="kbd">⌘K</span>
        </button>

        <div className="side-section">Monitor</div>
        {links.slice(0, 1).map(l => (
          <div key={l.key} className={`side-link ${route.name === l.key ? 'active' : ''}`}
               onClick={() => setRoute({ name: l.key })}>
            <l.icon className="ico"/>
            <span className="side-label">{l.label}</span>
          </div>
        ))}

        <div className="side-section">Network</div>
        {links.slice(1, 3).map(l => (
          <div key={l.key} className={`side-link ${route.name === l.key || (l.key === 'pools' && route.name === 'pool_detail') ? 'active' : ''}`}
               onClick={() => setRoute({ name: l.key })}>
            <l.icon className="ico"/>
            <span className="side-label">{l.label}</span>
            {l.count !== undefined && <span className="count">{l.count}</span>}
          </div>
        ))}
        <div className={`side-link ${route.name === 'pool_new' ? 'active' : ''}`}
             onClick={() => setRoute({ name: 'pool_new' })}>
          <Icons.Plus className="ico"/>
          <span className="side-label">New pool</span>
        </div>

        <div className="side-section">System</div>
        {links.slice(3).map(l => (
          <div key={l.key} className={`side-link ${route.name === l.key ? 'active' : ''}`}
               onClick={() => setRoute({ name: l.key })}>
            <l.icon className="ico"/>
            <span className="side-label">{l.label}</span>
          </div>
        ))}
        <div className="side-link" onClick={() => setCollapsed(!collapsed)}>
          <Icons.Menu className="ico"/>
          <span className="side-label">Collapse</span>
        </div>
      </div>

      <div className="side-foot">
        <div className="avatar">A</div>
        <div className="meta">
          <b>admin</b>
          <span>pi.corp.local</span>
        </div>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;


// ===== src/dashboard.jsx =====
const Dashboard = ({ pools, allocations, stats, lastSync, setRoute, onSync, syncing }) => {
  const { Icons, Badge, Progress, SubnetGrid, Mono, StatusDot } = window;
  const totalHosts = pools.reduce((s, p) => s + p.total, 0);
  const totalUsed = allocations.length;
  const pct = Math.round((totalUsed / totalHosts) * 100);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            Overview
            <span className="mono-sub">{pools.length} pools · {totalHosts.toLocaleString()} hosts</span>
          </h1>
          <div className="page-sub">
            Last sync <Mono>{lastSync.started}</Mono> ·{' '}
            <Badge tone={lastSync.status === 'success' ? 'ok' : 'bad'} dot>
              {lastSync.status}
            </Badge>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn ghost" onClick={() => setRoute({ name: 'sync' })}>
            <Icons.Clock className="ico"/> History
          </button>
          <button className="btn primary" onClick={onSync} disabled={syncing}>
            <Icons.Sync className="ico" style={syncing ? { animation: 'spin 1s linear infinite' } : null}/>
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-label">Allocated</div>
          <div className="stat-value">{totalUsed.toLocaleString()}</div>
          <div className="stat-delta up"><Icons.ArrowUp size={11}/> +12 this week</div>
        </div>
        <div className="stat">
          <div className="stat-label">Capacity</div>
          <div className="stat-value">{totalHosts.toLocaleString()}</div>
          <div className="stat-delta flat"><Icons.Dot size={11}/> across {pools.length} pools</div>
        </div>
        <div className="stat">
          <div className="stat-label">Utilization</div>
          <div className="stat-value">{pct}<span style={{color:'var(--mut-2)',fontSize:16}}>%</span></div>
          <Progress pct={pct}/>
        </div>
        <div className="stat">
          <div className="stat-label">Free</div>
          <div className="stat-value">{(totalHosts - totalUsed).toLocaleString()}</div>
          <div className="stat-delta flat"><Icons.Dot size={11}/> ready to allocate</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h3>Pools</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="sub">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 10 }}>
                <span style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: 1, display: 'inline-block' }}/> allocated
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 10 }}>
                <span style={{ width: 8, height: 8, background: 'var(--warn)', borderRadius: 1, display: 'inline-block' }}/> gateway
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, background: 'var(--bg-3)', borderRadius: 1, display: 'inline-block', border: '1px solid var(--line)' }}/> free
              </span>
            </span>
            <button className="btn sm" onClick={() => setRoute({ name: 'pool_new' })}>
              <Icons.Plus className="ico"/> New pool
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="pool-grid">
            {pools.map(p => {
              const used = allocations.filter(a => a.pool_id === p.id).length;
              const pct = Math.round(used / p.total * 100);
              return (
                <div key={p.id} className="pool-card" onClick={() => setRoute({ name: 'pool_detail', id: p.id })}>
                  <div className="row">
                    <div>
                      <div className="name">
                        <StatusDot tone={pct > 90 ? 'bad' : pct > 70 ? 'warn' : 'ok'}/>
                        {p.name}
                      </div>
                      <div className="cidr">{p.cidr}</div>
                    </div>
                    <Badge tone="accent">{p.attr_key}</Badge>
                  </div>
                  <SubnetGrid total={p.total} used={used} compact/>
                  <div className="row">
                    <div className="big">
                      {used.toLocaleString()}<span className="of"> / {p.total.toLocaleString()}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontSize: 12 }}>{pct}%</div>
                      <div className="tny mut">{(p.total - used).toLocaleString()} free</div>
                    </div>
                  </div>
                  <Progress pct={pct}/>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Recent allocations</h3><span className="sub">last 8</span></div>
          <div className="card-body flush">
            {[...allocations].sort((a,b) => b._sort - a._sort).slice(0, 8).map(a => {
              const pool = pools.find(p => p.id === a.pool_id);
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: '1px solid var(--line)', fontSize: 12.5 }}>
                  <Mono>{a.ip}</Mono>
                  <span className="mut">→</span>
                  <span>{a.username}<span className="mut">@{a.realm}</span></span>
                  <span className="grow"/>
                  <span className="tny mut">{pool?.name}</span>
                  <span className="tny mut" style={{ minWidth: 56, textAlign: 'right' }}>{a.synced_at}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Pool health</h3><span className="sub">utilization</span></div>
          <div className="card-body">
            {pools.map(p => {
              const used = allocations.filter(a => a.pool_id === p.id).length;
              const pct = Math.round(used / p.total * 100);
              return (
                <div key={p.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <StatusDot tone={pct > 90 ? 'bad' : pct > 70 ? 'warn' : 'ok'}/>
                      <span style={{ fontSize: 12.5, fontWeight: 500 }}>{p.name}</span>
                      <span className="tny mut mono">{p.cidr}</span>
                    </div>
                    <span className="mono tny mut">{used} / {p.total} · {pct}%</span>
                  </div>
                  <Progress pct={pct}/>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

window.Dashboard = Dashboard;


// ===== src/pools.jsx =====
const PoolsList = ({ pools, allocations, setRoute }) => {
  const { Icons, Badge, Progress, useSort, SortHead, StatusDot } = window;
  const [q, setQ] = React.useState('');
  const rows = pools.map(p => {
    const used = allocations.filter(a => a.pool_id === p.id).length;
    return { ...p, used, free: p.total - used, percent: Math.round(used / p.total * 100) };
  }).filter(r => !q || (r.name + r.cidr + r.attr_key + r.description).toLowerCase().includes(q.toLowerCase()));

  const { sorted, sort, onSort } = useSort(rows);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Pools <span className="mono-sub">{pools.length} total</span></h1>
          <div className="page-sub">Contiguous CIDR ranges managed by VPN Pooler.</div>
        </div>
        <div className="page-actions">
          <div style={{ position: 'relative' }}>
            <input className="input" placeholder="Filter…" value={q} onChange={e => setQ(e.target.value)}
              style={{ width: 220, paddingLeft: 30, fontSize: 12 }}/>
            <Icons.Search className="ico" style={{ position: 'absolute', left: 10, top: 10, color: 'var(--mut)' }}/>
          </div>
          <button className="btn accent" onClick={() => setRoute({ name: 'pool_new' })}>
            <Icons.Plus className="ico"/> New pool
          </button>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <SortHead sort={sort} onSort={onSort} k="name">Name</SortHead>
              <SortHead sort={sort} onSort={onSort} k="cidr">CIDR</SortHead>
              <th>Attribute</th>
              <SortHead sort={sort} onSort={onSort} k="used" align="right">Used</SortHead>
              <SortHead sort={sort} onSort={onSort} k="free" align="right">Free</SortHead>
              <SortHead sort={sort} onSort={onSort} k="percent" align="right">Usage</SortHead>
              <th>Description</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setRoute({ name: 'pool_detail', id: r.id })}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusDot tone={r.percent > 90 ? 'bad' : r.percent > 70 ? 'warn' : 'ok'}/>
                    <strong style={{ fontWeight: 500 }}>{r.name}</strong>
                  </div>
                </td>
                <td className="mono">{r.cidr}</td>
                <td><Badge tone="accent">{r.attr_key}</Badge></td>
                <td className="num">{r.used.toLocaleString()}</td>
                <td className="num">{r.free.toLocaleString()}</td>
                <td className="num" style={{ width: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                    <span style={{ minWidth: 34, textAlign: 'right' }}>{r.percent}%</span>
                    <div style={{ width: 90 }}><Progress pct={r.percent}/></div>
                  </div>
                </td>
                <td className="mut" style={{ maxWidth: 220 }}>{r.description || '—'}</td>
                <td><Icons.Chevron size={14} style={{ color: 'var(--mut)' }}/></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="tbl-foot">
          <span>Showing {sorted.length} of {pools.length} pools</span>
          <div className="pager">
            <button disabled><Icons.ChevronLeft size={12}/></button>
            <button className="active">1</button>
            <button disabled><Icons.Chevron size={12}/></button>
          </div>
        </div>
      </div>
    </>
  );
};

const PoolNew = ({ onCreate, setRoute }) => {
  const [form, setForm] = React.useState({ name: '', cidr: '', attr_key: '', gateway: '', description: '' });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const { Icons } = window;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">New pool</h1>
          <div className="page-sub">Define a CIDR range and the privacyIDEA user attribute to bind.</div>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-head"><h3>Pool configuration</h3></div>
        <div className="card-body">
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="grid-2">
              <div className="field">
                <label>Name</label>
                <input className="input" placeholder="e.g. vpn-2" value={form.name} onChange={e => upd('name', e.target.value)}/>
              </div>
              <div className="field">
                <label>CIDR <span className="hint">— IPv4 range</span></label>
                <input className="input mono" placeholder="10.10.0.0/24" value={form.cidr} onChange={e => upd('cidr', e.target.value)}/>
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Attribute key <span className="hint">— unique per PI</span></label>
                <input className="input mono" placeholder="VPN-IP" value={form.attr_key} onChange={e => upd('attr_key', e.target.value)}/>
              </div>
              <div className="field">
                <label>Gateway <span className="hint">— optional, excluded from pool</span></label>
                <input className="input mono" placeholder="10.10.0.1" value={form.gateway} onChange={e => upd('gateway', e.target.value)}/>
              </div>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea className="input" rows="2" value={form.description} onChange={e => upd('description', e.target.value)}/>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={() => setRoute({ name: 'pools' })}>Cancel</button>
          <button className="btn accent" onClick={() => { onCreate(form); setRoute({ name: 'pools' }); }}
            disabled={!form.name || !form.cidr || !form.attr_key}>
            <Icons.Check className="ico"/> Create pool
          </button>
        </div>
      </div>
    </>
  );
};

const AllocationsList = ({ pools, allocations, setRoute, onRelease }) => {
  const { Icons, Badge, Mono, useSort, SortHead } = window;
  const [q, setQ] = React.useState('');
  const [poolFilter, setPoolFilter] = React.useState('');
  const [page, setPage] = React.useState(0);
  const perPage = 25;

  const rows = allocations.map(a => {
    const p = pools.find(x => x.id === a.pool_id);
    return { ...a, pool_name: p?.name || '', cidr: p?.cidr || '' };
  }).filter(r => {
    if (poolFilter && r.pool_id !== Number(poolFilter)) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return r.ip.includes(s) || r.username.toLowerCase().includes(s) ||
           r.realm.toLowerCase().includes(s) || r.pool_name.toLowerCase().includes(s);
  });

  const { sorted, sort, onSort } = useSort(rows, { key: '_sort', dir: 'desc' });
  const pages = Math.ceil(sorted.length / perPage);
  const visible = sorted.slice(page * perPage, (page + 1) * perPage);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Allocations <span className="mono-sub">{allocations.length} active</span></h1>
          <div className="page-sub">Every IP currently bound to a user in privacyIDEA.</div>
        </div>
        <div className="page-actions">
          <button className="btn ghost"><Icons.Download className="ico"/> CSV</button>
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <input className="input" placeholder="Search IP, user, realm…" value={q}
                onChange={e => { setQ(e.target.value); setPage(0); }}
                style={{ paddingLeft: 30, fontSize: 12 }}/>
              <Icons.Search className="ico" style={{ position: 'absolute', left: 10, top: 10, color: 'var(--mut)' }}/>
            </div>
            <select className="select" value={poolFilter}
              onChange={e => { setPoolFilter(e.target.value); setPage(0); }}
              style={{ width: 180 }}>
              <option value="">All pools</option>
              {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <span className="sub">{sorted.length} matches</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <SortHead sort={sort} onSort={onSort} k="ip">IP address</SortHead>
              <SortHead sort={sort} onSort={onSort} k="username">Username</SortHead>
              <SortHead sort={sort} onSort={onSort} k="realm">Realm</SortHead>
              <SortHead sort={sort} onSort={onSort} k="pool_name">Pool</SortHead>
              <th>Attribute</th>
              <SortHead sort={sort} onSort={onSort} k="_sort" align="right">Synced</SortHead>
              <th style={{ width: 88 }}></th>
            </tr>
          </thead>
          <tbody>
            {visible.map(a => (
              <tr key={a.id}>
                <td><Mono copy>{a.ip}</Mono></td>
                <td>{a.username}</td>
                <td className="mut">{a.realm}</td>
                <td>
                  <a style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--line-2)' }}
                     onClick={() => setRoute({ name: 'pool_detail', id: a.pool_id })}>
                    {a.pool_name}
                  </a>
                </td>
                <td><Badge tone="accent">{a.attr_key}</Badge></td>
                <td className="num mut tny">{a.synced_at}</td>
                <td>
                  <button className="btn sm danger" onClick={() => onRelease(a)}>
                    Release
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="tbl-foot">
          <span>Showing {visible.length ? page * perPage + 1 : 0}–{Math.min((page + 1) * perPage, sorted.length)} of {sorted.length}</span>
          <div className="pager">
            <button disabled={page === 0} onClick={() => setPage(0)}>«</button>
            <button disabled={page === 0} onClick={() => setPage(page - 1)}><Icons.ChevronLeft size={12}/></button>
            <button className="active">{page + 1}</button>
            <span className="mut tny" style={{ padding: '0 6px' }}>of {pages || 1}</span>
            <button disabled={page >= pages - 1} onClick={() => setPage(page + 1)}><Icons.Chevron size={12}/></button>
            <button disabled={page >= pages - 1} onClick={() => setPage(pages - 1)}>»</button>
          </div>
        </div>
      </div>
    </>
  );
};

Object.assign(window, { PoolsList, PoolNew, AllocationsList });


// ===== src/pool_detail.jsx =====
const PoolDetail = ({ pool, allocations, pools, setRoute, onAllocate, onRelease, onDelete, realms, usernames }) => {
  const { Icons, Badge, Progress, SubnetGrid, Mono, StatusDot, useSort, SortHead, Modal } = window;

  const [form, setForm] = React.useState({ realm: '', username: '', ip: '' });
  const [q, setQ] = React.useState('');
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [confirmRel, setConfirmRel] = React.useState(null);
  const [hover, setHover] = React.useState(-1);

  const used = allocations.length;
  const total = pool.total;
  const free = total - used;
  const pct = Math.round(used / total * 100);

  const filtered = allocations.filter(a => {
    if (!q) return true;
    const s = q.toLowerCase();
    return a.ip.includes(s) || a.username.toLowerCase().includes(s) || a.realm.toLowerCase().includes(s);
  });
  const { sorted, sort, onSort } = useSort(filtered, { key: '_sort', dir: 'desc' });

  // Generate free IPs list
  const usedSet = new Set(allocations.map(a => a.ip));
  const freeIps = [];
  const parts = pool.cidr.split('/');
  const bits = parseInt(parts[1]);
  const baseParts = parts[0].split('.').map(Number);
  const base = (baseParts[0]<<24) + (baseParts[1]<<16) + (baseParts[2]<<8) + baseParts[3];
  const size = Math.pow(2, 32 - bits);
  for (let i = 1; i < size - 1 && freeIps.length < 50; i++) {
    const n = base + i;
    const ip = [(n>>>24)&255,(n>>16)&255,(n>>8)&255,n&255].join('.');
    if (ip === pool.gateway) continue;
    if (!usedSet.has(ip)) freeIps.push(ip);
  }

  const submit = (e) => {
    e.preventDefault();
    if (!form.realm || !form.username) return;
    onAllocate({ ...form, ip: form.ip || freeIps[0] });
    setForm({ realm: form.realm, username: '', ip: '' });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <a className="mut sm" onClick={() => setRoute({ name: 'pools' })} style={{ cursor: 'pointer' }}>
              ← Pools
            </a>
          </div>
          <h1 className="page-title">
            <StatusDot tone={pct > 90 ? 'bad' : pct > 70 ? 'warn' : 'ok'}/>
            {pool.name}
            <span className="mono-sub">{pool.cidr}</span>
          </h1>
          <div className="page-sub">{pool.description || 'No description.'}</div>
        </div>
        <div className="page-actions">
          <button className="btn ghost"><Icons.Pencil className="ico"/> Edit</button>
          <button className="btn danger" onClick={() => setConfirmDel(true)}>
            <Icons.Trash className="ico"/> Delete
          </button>
        </div>
      </div>

      <div className="stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat">
          <div className="stat-label">Allocated</div>
          <div className="stat-value">{used.toLocaleString()}</div>
          <Progress pct={pct}/>
        </div>
        <div className="stat">
          <div className="stat-label">Free</div>
          <div className="stat-value">{free.toLocaleString()}</div>
          <div className="stat-delta flat"><Icons.Dot size={11}/> next: {freeIps[0] || '—'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Utilization</div>
          <div className="stat-value">{pct}<span style={{color:'var(--mut-2)',fontSize:16}}>%</span></div>
          <div className="stat-delta flat"><Icons.Dot size={11}/> {total.toLocaleString()} total hosts</div>
        </div>
        <div className="stat">
          <div className="stat-label">Attribute</div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            <Badge tone="accent">{pool.attr_key}</Badge>
          </div>
          <div className="stat-delta flat"><Icons.Dot size={11}/> gateway {pool.gateway}</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head">
            <h3>Subnet map</h3>
            <span className="sub">{hover >= 0 ? `host .${hover}` : `${used} / ${total}`}</span>
          </div>
          <div className="card-body">
            <SubnetGrid total={Math.min(total, 1024)} used={used} onHover={setHover} hoverIndex={hover}/>
            <div className="spacer-8"/>
            {total > 1024 && <div className="tny mut">Showing first 1,024 of {total.toLocaleString()} hosts.</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Details</h3></div>
          <div className="card-body">
            <dl className="detail-grid">
              <dt>Name</dt><dd>{pool.name}</dd>
              <dt>CIDR</dt><dd><Mono copy>{pool.cidr}</Mono></dd>
              <dt>Attribute</dt><dd><Badge tone="accent">{pool.attr_key}</Badge></dd>
              <dt>Gateway</dt><dd><Mono copy>{pool.gateway}</Mono></dd>
              <dt>Created</dt><dd className="mono">{pool.created}</dd>
              <dt>Description</dt><dd className="mut">{pool.description || '—'}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h3>Allocate IP</h3>
          <span className="sub">next available · <Mono>{freeIps[0] || 'pool full'}</Mono></span>
        </div>
        <div className="card-body">
          <form onSubmit={submit} className="grid-form">
            <div className="field">
              <label>Realm</label>
              <select className="select" value={form.realm} onChange={e => setForm({ ...form, realm: e.target.value })} required>
                <option value="">— select —</option>
                {realms.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Username</label>
              <input className="input" placeholder="start typing…" value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                list="username-sugg" required/>
              <datalist id="username-sugg">
                {usernames.map(u => <option key={u} value={u}/>)}
              </datalist>
            </div>
            <div className="field">
              <label>IP address</label>
              <select className="select mono" value={form.ip} onChange={e => setForm({ ...form, ip: e.target.value })}>
                <option value="">Next available</option>
                {freeIps.map(ip => <option key={ip} value={ip}>{ip}</option>)}
              </select>
            </div>
            <div>
              <button type="submit" className="btn accent" disabled={!form.realm || !form.username}>
                <Icons.Plus className="ico"/> Allocate
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1 }}>
            <h3>Allocations</h3>
            <div style={{ position: 'relative', maxWidth: 260, flex: 1 }}>
              <input className="input" placeholder="Filter…" value={q}
                onChange={e => setQ(e.target.value)}
                style={{ paddingLeft: 30, fontSize: 12 }}/>
              <Icons.Search className="ico" style={{ position: 'absolute', left: 10, top: 10, color: 'var(--mut)' }}/>
            </div>
          </div>
          <span className="sub">{sorted.length} rows</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <SortHead sort={sort} onSort={onSort} k="ip">IP</SortHead>
              <SortHead sort={sort} onSort={onSort} k="username">Username</SortHead>
              <SortHead sort={sort} onSort={onSort} k="realm">Realm</SortHead>
              <th>Attribute</th>
              <SortHead sort={sort} onSort={onSort} k="_sort" align="right">Synced</SortHead>
              <th style={{ width: 88 }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 25).map(a => (
              <tr key={a.id}>
                <td><Mono copy>{a.ip}</Mono></td>
                <td>{a.username}</td>
                <td className="mut">{a.realm}</td>
                <td><Badge tone="accent">{a.attr_key}</Badge></td>
                <td className="num mut tny">{a.synced_at}</td>
                <td>
                  <button className="btn sm danger" onClick={() => setConfirmRel(a)}>Release</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="tbl-foot">
          <span>Showing {Math.min(25, sorted.length)} of {sorted.length}</span>
        </div>
      </div>

      {confirmDel && (
        <Modal title={`Delete pool "${pool.name}"?`}
          desc={used > 0 ? `This pool has ${used} active allocations. Release them first.` : 'This removes the pool definition. Allocations are unaffected in privacyIDEA.'}
          confirmLabel="Delete pool" danger
          onCancel={() => setConfirmDel(false)}
          onConfirm={() => { setConfirmDel(false); if (used === 0) onDelete(); }}/>
      )}
      {confirmRel && (
        <Modal title={`Release ${confirmRel.ip}?`}
          desc={`This removes attribute ${confirmRel.attr_key} from ${confirmRel.username}@${confirmRel.realm} in privacyIDEA.`}
          confirmLabel="Release" danger
          onCancel={() => setConfirmRel(null)}
          onConfirm={() => { onRelease(confirmRel); setConfirmRel(null); }}/>
      )}
    </>
  );
};

window.PoolDetail = PoolDetail;


// ===== src/sync.jsx =====
const SyncPage = ({ logs, onSync, syncing, lastSync }) => {
  const { Icons, Badge, Mono } = window;
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Sync</h1>
          <div className="page-sub">
            Reconcile local allocation cache with privacyIDEA state. Runs automatically every 6 hours.
          </div>
        </div>
        <div className="page-actions">
          <button className="btn accent" onClick={onSync} disabled={syncing}>
            <Icons.Sync className="ico" style={syncing ? { animation: 'spin 1s linear infinite' } : null}/>
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Last sync</h3></div>
          <div className="card-body">
            <dl className="detail-grid">
              <dt>Started</dt><dd className="mono">{lastSync.started}</dd>
              <dt>Finished</dt><dd className="mono">{lastSync.finished}</dd>
              <dt>Status</dt><dd><Badge tone={lastSync.status === 'success' ? 'ok' : 'bad'} dot>{lastSync.status}</Badge></dd>
              <dt>Details</dt><dd className="mut">{lastSync.details}</dd>
            </dl>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Schedule</h3></div>
          <div className="card-body">
            <dl className="detail-grid">
              <dt>Interval</dt><dd>Every 6 hours</dd>
              <dt>Next run</dt><dd className="mono">in 3h 14m · 2026-04-18 13:51</dd>
              <dt>Timeout</dt><dd>20s per PI request</dd>
              <dt>Strategy</dt><dd className="mut">Scan realms → diff → rebuild</dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>History</h3><span className="sub">last {logs.length} runs</span></div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Started</th>
              <th>Finished</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => {
              const dur = ((new Date(l.finished) - new Date(l.started)) / 1000) || 0;
              return (
                <tr key={l.id}>
                  <td className="mono">{l.started}</td>
                  <td className="mono">{l.finished}</td>
                  <td className="mono num">{dur}s</td>
                  <td><Badge tone={l.status === 'success' ? 'ok' : 'bad'} dot>{l.status}</Badge></td>
                  <td className={l.status === 'error' ? '' : 'mut'} style={{ whiteSpace: 'normal' }}>
                    {l.details}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

window.SyncPage = SyncPage;


// ===== src/palette.jsx =====
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


// ===== src/tweaks.jsx =====
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "density": "comfy",
  "accentHue": 190
}/*EDITMODE-END*/;

const Tweaks = ({ visible, values, onChange, onClose }) => {
  const { Icons } = window;
  if (!visible) return null;
  const hues = [{ h: 190, name: 'cyan' }, { h: 150, name: 'green' }, { h: 270, name: 'violet' }, { h: 320, name: 'pink' }, { h: 60, name: 'amber' }];
  return (
    <div className="tweaks">
      <div className="tweaks-head">
        <h4>Tweaks</h4>
        <button className="btn sm ghost" onClick={onClose} style={{ padding: 2 }}>
          <Icons.Close size={14}/>
        </button>
      </div>
      <div className="tweaks-body">
        <div className="tweak">
          <span className="tweak-label">Theme</span>
          <div className="chip-group">
            {['dark', 'light'].map(t => (
              <button key={t} className={values.theme === t ? 'on' : ''} onClick={() => onChange({ theme: t })}>{t}</button>
            ))}
          </div>
        </div>
        <div className="tweak">
          <span className="tweak-label">Density</span>
          <div className="chip-group">
            {['comfy', 'dense'].map(t => (
              <button key={t} className={values.density === t ? 'on' : ''} onClick={() => onChange({ density: t })}>{t}</button>
            ))}
          </div>
        </div>
        <div className="tweak">
          <span className="tweak-label">Accent</span>
          <div className="hue-picker">
            {hues.map(h => (
              <div key={h.h}
                className={`hue-swatch ${values.accentHue === h.h ? 'on' : ''}`}
                style={{ background: `oklch(0.82 0.13 ${h.h})` }}
                onClick={() => onChange({ accentHue: h.h })}
                title={h.name}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

window.Tweaks = Tweaks;
window.TWEAK_DEFAULTS = TWEAK_DEFAULTS;


// ===== src/app.jsx =====
const { useState, useEffect, useMemo } = React;

function App() {
  const { Icons, Sidebar, Dashboard, PoolsList, PoolNew, PoolDetail, AllocationsList, SyncPage, CommandPalette, Tweaks, TWEAK_DEFAULTS } = window;
  const { initialPools, makeAllocations, sampleUsernames, sampleRealms, syncLogs } = window.mockData;

  // Persist route across reloads for iterative design
  const [route, setRouteState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vp.route')) || { name: 'dashboard' }; }
    catch { return { name: 'dashboard' }; }
  });
  const setRoute = (r) => { setRouteState(r); try { localStorage.setItem('vp.route', JSON.stringify(r)); } catch {} };

  const [collapsed, setCollapsed] = useState(false);
  const [pools, setPools] = useState(initialPools);
  const [allocations, setAllocations] = useState(() => makeAllocations());
  const [logs, setLogs] = useState(syncLogs);
  const [syncing, setSyncing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Tweaks state
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [tweaksVisible, setTweaksVisible] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('collapsed', collapsed);
    document.body.classList.toggle('light', tweaks.theme === 'light');
    document.body.classList.toggle('dense', tweaks.density === 'dense');
    document.documentElement.style.setProperty('--accent-h', tweaks.accentHue);
  }, [collapsed, tweaks]);

  // Edit-mode bridge
  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setTweaksVisible(true);
      else if (d.type === '__deactivate_edit_mode') setTweaksVisible(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const applyTweak = (patch) => {
    setTweaks(v => {
      const next = { ...v, ...patch };
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*');
      return next;
    });
  };

  // Keyboard
  useEffect(() => {
    let gKey = false;
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(p => !p); return; }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === '/') { e.preventDefault(); setPaletteOpen(true); return; }
      if (e.key.toLowerCase() === 'g') { gKey = true; setTimeout(() => { gKey = false; }, 800); return; }
      if (gKey) {
        if (e.key === 'o') { setRoute({ name: 'dashboard' }); gKey = false; }
        if (e.key === 'p') { setRoute({ name: 'pools' }); gKey = false; }
        if (e.key === 'a') { setRoute({ name: 'allocations' }); gKey = false; }
        if (e.key === 's') { setRoute({ name: 'sync' }); gKey = false; }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const addToast = (t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(ts => [...ts, { id, ...t }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 3800);
  };

  const doSync = () => {
    setSyncing(true);
    setTimeout(() => {
      const now = new Date();
      const fmt = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
      const newLog = {
        id: Date.now(),
        started: fmt(now),
        finished: fmt(new Date(now.getTime() + 8000)),
        status: 'success',
        details: `Found ${allocations.length} allocation(s) across ${sampleRealms.length} realm(s)`,
      };
      setLogs(l => [newLog, ...l]);
      setSyncing(false);
      addToast({ tone: 'ok', title: 'Sync complete', detail: newLog.details });
    }, 1400);
  };

  const allocate = (poolId, { realm, username, ip }) => {
    const pool = pools.find(p => p.id === poolId);
    const id = `new-${Date.now()}`;
    const alloc = {
      id, pool_id: poolId, ip, username, realm,
      attr_key: pool.attr_key, synced_at: 'just now', _sort: Date.now(),
    };
    setAllocations(a => [...a, alloc]);
    addToast({ tone: 'ok', title: `IP ${ip} allocated`, detail: `${username}@${realm} → ${pool.name}` });
  };
  const release = (alloc) => {
    setAllocations(a => a.filter(x => x.id !== alloc.id));
    addToast({ tone: 'info', title: `Released ${alloc.ip}`, detail: `${alloc.username}@${alloc.realm}` });
  };
  const createPool = (form) => {
    const id = Math.max(...pools.map(p => p.id)) + 1;
    const bits = parseInt(form.cidr.split('/')[1] || '24');
    const total = Math.max(0, Math.pow(2, 32 - bits) - 2 - (form.gateway ? 1 : 0));
    setPools(p => [...p, { id, ...form, total, created: new Date().toISOString().slice(0, 10) }]);
    addToast({ tone: 'ok', title: 'Pool created', detail: `${form.name} · ${form.cidr}` });
  };
  const deletePool = (id) => {
    setPools(p => p.filter(x => x.id !== id));
    setAllocations(a => a.filter(x => x.pool_id !== id));
    addToast({ tone: 'info', title: 'Pool deleted' });
    setRoute({ name: 'pools' });
  };

  const lastSync = logs[0];

  // Render current page
  let page;
  if (route.name === 'dashboard') {
    page = <Dashboard pools={pools} allocations={allocations} lastSync={lastSync}
      setRoute={setRoute} onSync={doSync} syncing={syncing}/>;
  } else if (route.name === 'pools') {
    page = <PoolsList pools={pools} allocations={allocations} setRoute={setRoute}/>;
  } else if (route.name === 'pool_new') {
    page = <PoolNew onCreate={createPool} setRoute={setRoute}/>;
  } else if (route.name === 'allocations') {
    page = <AllocationsList pools={pools} allocations={allocations} setRoute={setRoute} onRelease={release}/>;
  } else if (route.name === 'pool_detail') {
    const pool = pools.find(p => p.id === route.id) || pools[0];
    const poolAllocs = allocations.filter(a => a.pool_id === pool.id);
    page = <PoolDetail pool={pool} allocations={poolAllocs} pools={pools} setRoute={setRoute}
      onAllocate={(f) => allocate(pool.id, f)}
      onRelease={release}
      onDelete={() => deletePool(pool.id)}
      realms={sampleRealms} usernames={sampleUsernames}/>;
  } else if (route.name === 'sync') {
    page = <SyncPage logs={logs} onSync={doSync} syncing={syncing} lastSync={lastSync}/>;
  }

  // Crumbs
  const crumbs = [];
  if (route.name === 'dashboard') crumbs.push('Overview');
  else if (route.name === 'pools') crumbs.push('Pools');
  else if (route.name === 'pool_new') { crumbs.push('Pools'); crumbs.push('New'); }
  else if (route.name === 'pool_detail') {
    crumbs.push('Pools');
    const p = pools.find(x => x.id === route.id);
    crumbs.push(p?.name || '—');
  }
  else if (route.name === 'allocations') crumbs.push('Allocations');
  else if (route.name === 'sync') crumbs.push('Sync');

  return (
    <div className="app">
      <Sidebar route={route} setRoute={setRoute} collapsed={collapsed} setCollapsed={setCollapsed}
        pools={pools} allocations={allocations} onPalette={() => setPaletteOpen(true)}/>
      <div className="main">
        <div className="topbar">
          <div className="crumbs">
            <Icons.Network size={14} style={{ color: 'var(--mut)' }}/>
            <span className="ghost">pooler</span>
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                <span className="sep">/</span>
                <span className={i === crumbs.length - 1 ? 'cur' : 'ghost'}>{c}</span>
              </React.Fragment>
            ))}
          </div>
          <span className="spacer"/>
          <div className="env-pill">
            <span className="dot"/> pi.corp.local
          </div>
          <button className="search" onClick={() => setPaletteOpen(true)}>
            <Icons.Search className="ico"/>
            <span>Search pools, IPs, users…</span>
            <span className="kbd">⌘K</span>
          </button>
          <button className="btn ghost sm" title="Logout">
            <Icons.Logout className="ico"/>
          </button>
        </div>
        <div className="content">{page}</div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)}
        pools={pools} setRoute={setRoute} onSync={doSync}
        onToggleTheme={() => applyTweak({ theme: tweaks.theme === 'dark' ? 'light' : 'dark' })}/>

      <Tweaks visible={tweaksVisible} values={tweaks}
        onChange={applyTweak} onClose={() => setTweaksVisible(false)}/>

      {toasts.length > 0 && (
        <div className="toasts">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.tone || 'info'}`}>
              <span className="dot"/>
              <div>
                <b>{t.title}</b>
                {t.detail && <span>{t.detail}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);


