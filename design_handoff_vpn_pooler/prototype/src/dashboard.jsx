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
