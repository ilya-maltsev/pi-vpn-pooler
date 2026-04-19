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
