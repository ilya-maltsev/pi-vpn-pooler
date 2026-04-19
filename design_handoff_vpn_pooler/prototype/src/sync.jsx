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
