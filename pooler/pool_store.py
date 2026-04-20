"""YAML-file-backed pool storage.

Pools are stored in a single YAML file mounted as a Docker volume.
Thread-safe writes use a file lock to prevent corruption under concurrent
gunicorn workers.
"""
import fcntl
import logging
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import yaml
from django.conf import settings

log = logging.getLogger('pooler')

POOLS_FILE = Path(settings.POOLS_FILE)


@dataclass
class Pool:
    """In-memory representation of a VPN pool."""
    id: str
    name: str
    cidr: str
    attr_key: str
    description: str = ''
    gateway_ip: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    # Convenience properties to keep templates working (pool.pk)
    @property
    def pk(self):
        return self.id


def _ensure_file():
    """Create the pools file with an empty list if it doesn't exist."""
    POOLS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not POOLS_FILE.exists():
        POOLS_FILE.write_text(yaml.dump({'pools': []}, default_flow_style=False))


def _read_raw() -> list[dict]:
    _ensure_file()
    text = POOLS_FILE.read_text()
    data = yaml.safe_load(text) or {}
    return data.get('pools', [])


def _write_raw(pools: list[dict]):
    _ensure_file()
    with open(POOLS_FILE, 'r+') as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:
            f.seek(0)
            f.truncate()
            yaml.dump({'pools': pools}, f, default_flow_style=False, allow_unicode=True)
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)


def _dict_to_pool(d: dict) -> Pool:
    return Pool(
        id=d['id'],
        name=d['name'],
        cidr=d['cidr'],
        attr_key=d['attr_key'],
        description=d.get('description', ''),
        gateway_ip=d.get('gateway_ip'),
        created_at=d.get('created_at', ''),
    )


def _pool_to_dict(p: Pool) -> dict:
    return {
        'id': p.id,
        'name': p.name,
        'cidr': p.cidr,
        'attr_key': p.attr_key,
        'description': p.description,
        'gateway_ip': p.gateway_ip,
        'created_at': p.created_at,
    }


# --- Public API ---------------------------------------------------------------

def get_all_pools() -> list[Pool]:
    """Return all pools sorted by name."""
    pools = [_dict_to_pool(d) for d in _read_raw()]
    pools.sort(key=lambda p: p.name)
    return pools


def get_pool(pool_id: str) -> Optional[Pool]:
    """Return a single pool by ID, or None."""
    for d in _read_raw():
        if d['id'] == pool_id:
            return _dict_to_pool(d)
    return None


def get_pool_or_404(pool_id: str) -> Pool:
    """Return a pool or raise Http404."""
    from django.http import Http404
    pool = get_pool(pool_id)
    if pool is None:
        raise Http404(f'Pool {pool_id} not found')
    return pool


def create_pool(name: str, cidr: str, attr_key: str,
                description: str = '', gateway_ip: Optional[str] = None) -> Pool:
    """Create a new pool. Caller must validate before calling."""
    pool = Pool(
        id=str(uuid.uuid4())[:8],
        name=name,
        cidr=cidr,
        attr_key=attr_key,
        description=description,
        gateway_ip=gateway_ip,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    raw = _read_raw()
    raw.append(_pool_to_dict(pool))
    _write_raw(raw)
    log.info('Pool created id=%s name=%s cidr=%s attr_key=%s', pool.id, name, cidr, attr_key)
    return pool


def update_pool(pool_id: str, **kwargs) -> Pool:
    """Update pool fields. Returns updated pool."""
    raw = _read_raw()
    for d in raw:
        if d['id'] == pool_id:
            for k, v in kwargs.items():
                if k in ('description', 'gateway_ip', 'name', 'cidr', 'attr_key'):
                    d[k] = v
            _write_raw(raw)
            return _dict_to_pool(d)
    raise KeyError(f'Pool {pool_id} not found')


def delete_pool(pool_id: str):
    """Delete a pool by ID."""
    raw = _read_raw()
    new = [d for d in raw if d['id'] != pool_id]
    if len(new) == len(raw):
        raise KeyError(f'Pool {pool_id} not found')
    _write_raw(new)
    log.info('Pool deleted id=%s', pool_id)


def pool_count() -> int:
    return len(_read_raw())


def name_exists(name: str, exclude_id: Optional[str] = None) -> bool:
    for d in _read_raw():
        if d['name'] == name and d['id'] != exclude_id:
            return True
    return False


def attr_key_exists(attr_key: str, exclude_id: Optional[str] = None) -> bool:
    for d in _read_raw():
        if d['attr_key'] == attr_key and d['id'] != exclude_id:
            return True
    return False
