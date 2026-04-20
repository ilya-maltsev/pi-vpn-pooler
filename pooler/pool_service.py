"""Business logic for VPN pool management.

Pools are stored in YAML. Allocations are live from PI.
"""
import logging

from .ip_utils import enumerate_hosts, is_valid_ipv4, ip_in_cidr, cidr_overlaps, validate_cidr
from .live import get_pi_client, live_allocations, LiveAllocation
from .pi_client import PIClient, PIClientError
from .pool_store import (
    Pool, get_all_pools, get_pool, get_pool_or_404,
    create_pool as store_create_pool, delete_pool as store_delete_pool,
    update_pool as store_update_pool, name_exists, attr_key_exists,
)

log = logging.getLogger('pooler')


class PoolServiceError(Exception):
    pass


# --- pool CRUD ---------------------------------------------------------------

def create_pool(name, cidr, attr_key, description='', gateway_ip=None):
    """Create a new VPN pool. Validates CIDR and overlap."""
    net, err = validate_cidr(cidr)
    if err:
        raise PoolServiceError(f'Invalid CIDR: {err}')

    if name_exists(name):
        raise PoolServiceError(f'Pool name "{name}" already exists')

    if attr_key_exists(attr_key):
        raise PoolServiceError(f'Attribute key "{attr_key}" already in use')

    # Check for overlap with existing pools
    for existing in get_all_pools():
        if cidr_overlaps(cidr, existing.cidr):
            raise PoolServiceError(
                f'CIDR {cidr} overlaps with existing pool "{existing.name}" ({existing.cidr})'
            )

    if gateway_ip and not ip_in_cidr(gateway_ip, cidr):
        raise PoolServiceError(f'Gateway {gateway_ip} is not within CIDR {cidr}')

    pool = store_create_pool(name, str(net), attr_key, description, gateway_ip or None)
    log.info('Pool created name=%s cidr=%s attr_key=%s gateway=%s',
             pool.name, pool.cidr, pool.attr_key, pool.gateway_ip or '-')
    return pool


def delete_pool(session, pool_id):
    """Delete a pool only if it has no live allocations."""
    pool = get_pool_or_404(pool_id)
    allocs = live_allocations(session, pool)
    if allocs:
        raise PoolServiceError(
            f'Cannot delete pool "{pool.name}": it still has {len(allocs)} allocation(s). '
            f'Release all IPs first.'
        )
    name, cidr = pool.name, pool.cidr
    store_delete_pool(pool_id)
    log.info('Pool deleted name=%s cidr=%s', name, cidr)


def get_pool_stats(pool, used_ips=None):
    """Return stats dict for a pool. If used_ips provided, skip PI query."""
    all_hosts = enumerate_hosts(pool.cidr, pool.gateway_ip)
    total = len(all_hosts)
    allocated = len(used_ips) if used_ips is not None else 0
    return {
        'total': total,
        'allocated': allocated,
        'free': total - allocated,
        'percent': round(allocated / total * 100) if total else 0,
    }


def get_free_ips(pool, used_ips, limit=500):
    """Return list of free IPs in a pool given a set of used IPs."""
    all_hosts = set(enumerate_hosts(pool.cidr, pool.gateway_ip))
    taken = set(used_ips)
    free = sorted(all_hosts - taken, key=lambda ip: tuple(int(x) for x in ip.split('.')))
    return free[:limit]


# --- allocation / release ----------------------------------------------------

def allocate_ip(session, pool_id, username, realm, ip_address=None):
    """Allocate an IP from pool to user. If ip_address is None, picks next free."""
    pool = get_pool_or_404(pool_id)
    client = get_pi_client(session)
    log.debug('Allocate requested pool=%s user=%s@%s requested_ip=%s',
              pool.name, username, realm, ip_address or 'auto')

    # Get current live allocations to check free IPs and user conflicts
    allocs = live_allocations(session, pool)
    used_ips = {a.ip_address for a in allocs}

    # Determine IP
    if ip_address:
        if not ip_in_cidr(ip_address, pool.cidr):
            raise PoolServiceError(f'{ip_address} is not within pool CIDR {pool.cidr}')
    else:
        free = get_free_ips(pool, used_ips, limit=1)
        if not free:
            log.warning('Allocate failed pool=%s: no free IPs', pool.name)
            raise PoolServiceError(f'No free IPs in pool "{pool.name}"')
        ip_address = free[0]
        log.debug('Picked next free ip=%s from pool=%s', ip_address, pool.name)

    # Check if IP is already taken (live)
    if ip_address in used_ips:
        owner = next((a for a in allocs if a.ip_address == ip_address), None)
        if owner:
            raise PoolServiceError(
                f'IP {ip_address} is already allocated to {owner.username}@{owner.realm} '
                f'(pool: {pool.name})'
            )

    # Check if user already has an IP in this pool (live)
    for a in allocs:
        if a.username == username and a.realm == realm:
            raise PoolServiceError(
                f'User {username}@{realm} already has IP {a.ip_address} in pool "{pool.name}"'
            )

    # Fresh PI cross-realm scan for IP uniqueness
    try:
        found = client.find_ip_across_all_users(ip_address)
        if found:
            owner_user, owner_realm, owner_key = found
            raise PoolServiceError(
                f'IP {ip_address} is already assigned to {owner_user}@{owner_realm} '
                f'(attribute: {owner_key}) in privacyIDEA'
            )
    except PIClientError as e:
        raise PoolServiceError(f'Failed to verify IP uniqueness in PI: {e}')

    # Set attribute in PI
    try:
        client.set_user_attribute(username, realm, pool.attr_key, ip_address)
    except PIClientError as e:
        raise PoolServiceError(f'privacyIDEA error: {e}')

    # Update session token (might have been refreshed)
    session['pi_token'] = client._token
    log.info('IP allocated ip=%s user=%s@%s pool=%s attr=%s',
             ip_address, username, realm, pool.name, pool.attr_key)
    return ip_address


def release_ip(session, pool_id, ip_address, username, realm):
    """Release an IP — delete custom attr from PI."""
    pool = get_pool_or_404(pool_id)
    client = get_pi_client(session)

    try:
        client.delete_user_attribute(pool.attr_key, username, realm)
    except PIClientError as e:
        raise PoolServiceError(f'privacyIDEA error: {e}')

    session['pi_token'] = client._token
    log.info('IP released ip=%s user=%s@%s pool=%s', ip_address, username, realm, pool.name)
