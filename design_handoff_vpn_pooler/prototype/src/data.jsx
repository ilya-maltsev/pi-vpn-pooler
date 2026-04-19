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
