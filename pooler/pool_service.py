"""Business logic for VPN pool management."""
import logging
from datetime import timezone

from django.utils import timezone as dj_tz

from .ip_utils import enumerate_hosts, is_valid_ipv4, ip_in_cidr, cidr_overlaps, validate_cidr
from .models import VpnPool, Allocation, SyncLog
from .pi_client import PIClient, PIClientError

log = logging.getLogger('pooler')


class PoolServiceError(Exception):
    pass


def get_pi_client(session):
    """Build a PIClient from session-stored JWT."""
    token = session.get('pi_token')
    username = session.get('pi_username')
    password = session.get('pi_password')
    if not token:
        raise PoolServiceError('Not authenticated with privacyIDEA')
    client = PIClient()
    client._token = token
    client._username = username
    client._password = password
    # Decode expiry
    import json, base64
    from datetime import datetime
    payload_b64 = token.split('.')[1]
    payload_b64 += '=' * (-len(payload_b64) % 4)
    payload = json.loads(base64.urlsafe_b64decode(payload_b64))
    client._token_exp = datetime.fromtimestamp(payload['exp'], tz=timezone.utc)
    return client


# --- pool CRUD ---------------------------------------------------------------

def create_pool(name, cidr, attr_key, description='', gateway_ip=None):
    """Create a new VPN pool.  Validates CIDR and overlap."""
    net, err = validate_cidr(cidr)
    if err:
        raise PoolServiceError(f'Invalid CIDR: {err}')

    # Check for overlap with existing pools
    for existing in VpnPool.objects.all():
        if cidr_overlaps(cidr, existing.cidr):
            raise PoolServiceError(
                f'CIDR {cidr} overlaps with existing pool "{existing.name}" ({existing.cidr})'
            )

    if gateway_ip and not ip_in_cidr(gateway_ip, cidr):
        raise PoolServiceError(f'Gateway {gateway_ip} is not within CIDR {cidr}')

    pool = VpnPool.objects.create(
        name=name,
        cidr=str(net),
        attr_key=attr_key,
        description=description,
        gateway_ip=gateway_ip or None,
    )
    log.info('Pool created name=%s cidr=%s attr_key=%s gateway=%s',
             pool.name, pool.cidr, pool.attr_key, pool.gateway_ip or '-')
    return pool


def delete_pool(pool_id):
    """Delete a pool only if it has no allocations."""
    pool = VpnPool.objects.get(pk=pool_id)
    if pool.allocations.exists():
        raise PoolServiceError(
            f'Cannot delete pool "{pool.name}": it still has {pool.allocations.count()} allocation(s). '
            f'Release all IPs first.'
        )
    name, cidr = pool.name, pool.cidr
    pool.delete()
    log.info('Pool deleted name=%s cidr=%s', name, cidr)


def get_pool_stats(pool):
    """Return stats dict for a pool."""
    all_hosts = enumerate_hosts(pool.cidr, pool.gateway_ip)
    total = len(all_hosts)
    allocated = pool.allocations.count()
    return {
        'total': total,
        'allocated': allocated,
        'free': total - allocated,
        'percent': round(allocated / total * 100) if total else 0,
    }


def get_free_ips(pool, limit=500):
    """Return list of free IPs in a pool."""
    all_hosts = set(enumerate_hosts(pool.cidr, pool.gateway_ip))
    taken = set(pool.allocations.values_list('ip_address', flat=True))
    free = sorted(all_hosts - taken, key=lambda ip: tuple(int(x) for x in ip.split('.')))
    return free[:limit]


# --- allocation / release ----------------------------------------------------

def allocate_ip(session, pool_id, username, realm, ip_address=None):
    """Allocate an IP from pool to user.  If ip_address is None, picks next free."""
    pool = VpnPool.objects.get(pk=pool_id)
    client = get_pi_client(session)
    log.debug('Allocate requested pool=%s user=%s@%s requested_ip=%s',
              pool.name, username, realm, ip_address or 'auto')

    # Determine IP
    if ip_address:
        if not ip_in_cidr(ip_address, pool.cidr):
            raise PoolServiceError(f'{ip_address} is not within pool CIDR {pool.cidr}')
    else:
        free = get_free_ips(pool, limit=1)
        if not free:
            log.warning('Allocate failed pool=%s: no free IPs', pool.name)
            raise PoolServiceError(f'No free IPs in pool "{pool.name}"')
        ip_address = free[0]
        log.debug('Picked next free ip=%s from pool=%s', ip_address, pool.name)

    # Local uniqueness check
    existing = Allocation.objects.filter(ip_address=ip_address).first()
    if existing:
        raise PoolServiceError(
            f'IP {ip_address} is already allocated to {existing.username}@{existing.realm} '
            f'(pool: {existing.pool.name})'
        )

    # Check if user already has an IP in this pool
    existing_user = Allocation.objects.filter(
        pool=pool, username=username, realm=realm
    ).first()
    if existing_user:
        raise PoolServiceError(
            f'User {username}@{realm} already has IP {existing_user.ip_address} in pool "{pool.name}"'
        )

    # Fresh PI check — scan all users for this IP across all realms
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

    # Create local record
    alloc = Allocation.objects.create(
        pool=pool,
        ip_address=ip_address,
        username=username,
        realm=realm,
        attr_key=pool.attr_key,
    )
    log.info('IP allocated ip=%s user=%s@%s pool=%s attr=%s',
             ip_address, username, realm, pool.name, pool.attr_key)
    return alloc


def release_ip(session, pool_id, ip_address):
    """Release an IP — delete custom attr from PI and remove local record."""
    alloc = Allocation.objects.filter(pool_id=pool_id, ip_address=ip_address).first()
    if not alloc:
        raise PoolServiceError(f'Allocation not found for IP {ip_address}')

    client = get_pi_client(session)

    try:
        client.delete_user_attribute(alloc.attr_key, alloc.username, alloc.realm)
    except PIClientError as e:
        raise PoolServiceError(f'privacyIDEA error: {e}')

    session['pi_token'] = client._token
    username, realm, pool_name = alloc.username, alloc.realm, alloc.pool.name
    alloc.delete()
    log.info('IP released ip=%s user=%s@%s pool=%s', ip_address, username, realm, pool_name)


# --- sync --------------------------------------------------------------------

def full_sync(session):
    """Sync allocation cache with actual PI state."""
    sync_log = SyncLog.objects.create()
    client = get_pi_client(session)
    log.info('Full sync started')

    try:
        realms = client.get_realms()
        pools = {p.attr_key: p for p in VpnPool.objects.all()}
        pool_cidrs = {p.attr_key: p.cidr for p in pools.values()}
        log.debug('Sync scanning %d realm(s) against %d pool(s)', len(realms), len(pools))

        found_allocations = []

        for realm in realms:
            users = client.get_users(realm)
            log.debug('Sync realm=%s scanning %d user(s)', realm, len(users))
            for user in users:
                username = user.get('username', '')
                if not username:
                    continue
                for key, value in user.items():
                    if key in ('username', 'userid', 'resolver', 'editable',
                               'givenname', 'surname', 'email', 'phone',
                               'mobile', 'description'):
                        continue
                    if not is_valid_ipv4(str(value)):
                        continue
                    # Match to a known pool by attr_key
                    if key in pools:
                        pool = pools[key]
                        if ip_in_cidr(str(value), pool.cidr):
                            found_allocations.append({
                                'pool': pool,
                                'ip_address': str(value),
                                'username': username,
                                'realm': realm,
                                'attr_key': key,
                            })

        # Rebuild allocations
        Allocation.objects.all().delete()
        for item in found_allocations:
            Allocation.objects.create(**item)

        sync_log.status = 'success'
        sync_log.details = f'Found {len(found_allocations)} allocation(s) across {len(realms)} realm(s)'
        log.info('Full sync complete: %s', sync_log.details)

    except Exception as e:
        sync_log.status = 'error'
        sync_log.details = str(e)
        log.exception('Sync failed')

    sync_log.finished_at = dj_tz.now()
    sync_log.save()

    session['pi_token'] = client._token
    return sync_log
