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
