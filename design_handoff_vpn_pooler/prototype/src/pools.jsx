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
