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
