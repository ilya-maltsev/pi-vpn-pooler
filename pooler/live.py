"""Live allocation queries against privacyIDEA.

No local state — every call scans PI user attributes and returns fresh results.
"""
import logging
from dataclasses import dataclass
from datetime import datetime, timezone

from django.utils import timezone as dj_tz

from .ip_utils import is_valid_ipv4, ip_in_cidr
from .pi_client import PIClient, PIClientError
from .pool_store import Pool

log = logging.getLogger('pooler')

# Keys to skip when scanning user dicts for IP attributes
_SKIP_KEYS = frozenset({
    'username', 'userid', 'resolver', 'editable',
    'givenname', 'surname', 'email', 'phone',
    'mobile', 'description',
})


@dataclass(frozen=True)
class LiveAllocation:
    """Mirrors the old Allocation model row so templates work unchanged."""
    pool: Pool
    ip_address: str
    username: str
    realm: str
    attr_key: str
    synced_at: datetime
    pk: str  # synthetic: f"{pool.id}-{ip_address}"


def _make_alloc(pool: Pool, ip: str, username: str, realm: str, attr_key: str, now: datetime) -> LiveAllocation:
    return LiveAllocation(
        pool=pool,
        ip_address=ip,
        username=username,
        realm=realm,
        attr_key=attr_key,
        synced_at=now,
        pk=f"{pool.id}-{ip}",
    )


def get_pi_client(session) -> PIClient:
    """Build a PIClient from session-stored JWT."""
    token = session.get('pi_token')
    username = session.get('pi_username')
    if not token:
        raise PIClientError('Not authenticated with privacyIDEA')
    client = PIClient()
    client.set_token(token, username=username)
    return client


def live_allocations(session, pool: Pool) -> list[LiveAllocation]:
    """Query PI for all allocations in a single pool.

    Returns list sorted by IP address.
    """
    client = get_pi_client(session)
    now = dj_tz.now()
    results = []

    realms = client.get_realms()
    for realm in realms:
        users = client.get_users(realm)
        matched = []
        for user in users:
            username = user.get('username', '')
            if not username:
                continue
            for key, value in user.items():
                if key in _SKIP_KEYS:
                    continue
                val = str(value)
                if key == pool.attr_key and is_valid_ipv4(val) and ip_in_cidr(val, pool.cidr):
                    results.append(_make_alloc(pool, val, username, realm, key, now))
                    matched.append(f'{username}={val}')
        log.info('Scan realm=%s pool=%s attr=%s users=%d matched=%d [%s]',
                 realm, pool.name, pool.attr_key, len(users),
                 len(matched), ','.join(matched))

    results.sort(key=lambda a: tuple(int(x) for x in a.ip_address.split('.')))
    return results


def live_allocations_all(session, pools: list[Pool]) -> dict[str, list[LiveAllocation]]:
    """Query PI once and return allocations for all pools.

    Returns dict keyed by pool.id -> list[LiveAllocation].
    Critical perf optimisation: scans realms/users only once for N pools.
    """
    if not pools:
        return {}

    client = get_pi_client(session)
    now = dj_tz.now()

    # Build lookup structures
    pool_by_attr = {}  # attr_key -> pool
    for pool in pools:
        pool_by_attr[pool.attr_key] = pool

    results: dict[str, list[LiveAllocation]] = {p.id: [] for p in pools}

    realms = client.get_realms()
    for realm in realms:
        users = client.get_users(realm)
        matched_per_attr: dict[str, list[str]] = {k: [] for k in pool_by_attr}
        for user in users:
            username = user.get('username', '')
            if not username:
                continue
            for key, value in user.items():
                if key in _SKIP_KEYS:
                    continue
                if key not in pool_by_attr:
                    continue
                val = str(value)
                pool = pool_by_attr[key]
                if is_valid_ipv4(val) and ip_in_cidr(val, pool.cidr):
                    results[pool.id].append(
                        _make_alloc(pool, val, username, realm, key, now)
                    )
                    matched_per_attr[key].append(f'{username}={val}')
        for attr_key, matched in matched_per_attr.items():
            pool = pool_by_attr[attr_key]
            log.info('Scan realm=%s pool=%s attr=%s users=%d matched=%d [%s]',
                     realm, pool.name, attr_key, len(users),
                     len(matched), ','.join(matched))

    # Sort each pool's allocations by IP
    for pool_id in results:
        results[pool_id].sort(key=lambda a: tuple(int(x) for x in a.ip_address.split('.')))

    return results
