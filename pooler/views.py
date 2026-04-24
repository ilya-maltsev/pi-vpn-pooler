"""Function-based views."""
import base64
import json
import logging
import time

from django.conf import settings
from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST

from .decorators import pi_auth_required
from .live import get_pi_client, live_allocations, live_allocations_all
from .pi_client import PIClient, PIClientError
from .pool_service import (
    create_pool, delete_pool, get_pool_stats, get_free_ips,
    allocate_ip, release_ip, PoolServiceError,
)
from .pool_store import get_all_pools, get_pool_or_404, update_pool
from .view_helpers import palette_context, pool_subnet_context

log = logging.getLogger('pooler')


def _jwt_payload(token):
    """Decode a JWT's payload. Returns {} on failure."""
    try:
        payload_b64 = token.split('.')[1]
        payload_b64 += '=' * (-len(payload_b64) % 4)
        return json.loads(base64.urlsafe_b64decode(payload_b64))
    except Exception:
        return {}


def _extract_realm(token):
    """Extract realm from a PI JWT payload. Returns '' on failure."""
    return _jwt_payload(token).get('realm', '')


def _bind_session_to_jwt(request, token):
    """Pin the Django session cookie to expire when the JWT does.

    PI controls JWT lifetime via its policies, not us — so the cookie
    should follow the token, not a hard-coded SESSION_COOKIE_AGE.
    """
    exp = _jwt_payload(token).get('exp')
    if exp:
        remaining = int(exp - time.time())
        if remaining > 0:
            request.session.set_expiry(remaining)


# --- auth --------------------------------------------------------------------

def login_view(request):
    """Step 1 of login: username + password.

    Posts directly to PI /auth.  Three outcomes:
      * ``{token}``           → passOnNoToken (no TOTP).  Gated by
                                ``PI_REQUIRE_OTP`` — when set, the user is
                                refused until they enrol a TOTP.
      * ``{transaction_id}``  → challenge triggered.  Only the tx_id is
                                stored in the session; the password is
                                never persisted.  Redirect to OTP step.
      * raises PIClientError  → wrong password.
    """
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        if not username or not password:
            messages.error(request, _('Username and password are required.'))
            return render(request, 'pooler/login.html')
        log.debug('Login attempt user=%s from %s', username,
                  request.META.get('REMOTE_ADDR', '?'))
        client = PIClient()
        try:
            result = client.auth(username=username, password=password)
        except PIClientError as e:
            log.warning('Login failed user=%s: %s', username, e)
            messages.error(request, _('Authentication failed: %(err)s') % {'err': e})
            return render(request, 'pooler/login.html')

        if result.get('transaction_id'):
            request.session['pi_username'] = username
            request.session['pi_transaction_id'] = result['transaction_id']
            request.session['pi_2fa_ok'] = False
            request.session['pi_needs_otp'] = True
            log.info('Login password OK user=%s — challenge triggered tid=%s',
                     username, result['transaction_id'])
            return redirect('login_otp')

        token = result.get('token')
        if not token:
            messages.error(request, _('Authentication failed.'))
            return render(request, 'pooler/login.html')

        # passOnNoToken: password valid, no TOTP enrolled.
        if settings.PI_REQUIRE_OTP:
            log.warning('Login blocked user=%s — OTP required but no TOTP enrolled',
                        username)
            messages.error(request, _('OTP is required but you have no TOTP token enrolled. '
                                      'Contact your administrator.'))
            return render(request, 'pooler/login.html')
        request.session['pi_token'] = token
        request.session['pi_username'] = username
        request.session['pi_realm'] = _extract_realm(token)
        request.session['pi_2fa_ok'] = True
        request.session['pi_needs_otp'] = False
        _bind_session_to_jwt(request, token)
        log.info('Login success user=%s (no TOTP enrolled)', username)
        return redirect('dashboard')

    return render(request, 'pooler/login.html')


def login_otp_view(request):
    """Step 2 of login: OTP answer.

    Resumes the /auth challenge with ``transaction_id`` + ``pass=<OTP>``.
    No password needed — PI remembers the step-1 password validation against
    the transaction_id.
    """
    username = request.session.get('pi_username')
    transaction_id = request.session.get('pi_transaction_id')
    if not username or not transaction_id:
        return redirect('login')
    if request.session.get('pi_2fa_ok'):
        return redirect('dashboard')

    if request.method == 'POST':
        otp = request.POST.get('otp', '').strip()
        if not otp or not otp.isdigit() or len(otp) != 6:
            messages.error(request, _('Enter a valid 6-digit code.'))
            return render(request, 'pooler/login_otp.html')

        client = PIClient()
        try:
            result = client.auth(username=username, password=otp,
                                 transaction_id=transaction_id)
        except PIClientError as e:
            log.warning('OTP validation error user=%s: %s', username, e)
            messages.error(request, _('Verification failed. Please try again.'))
            return render(request, 'pooler/login_otp.html')

        token = result.get('token')
        if not token:
            messages.error(request, _('Verification failed. Please try again.'))
            return render(request, 'pooler/login_otp.html')

        request.session['pi_token'] = token
        request.session['pi_realm'] = _extract_realm(token)
        request.session['pi_2fa_ok'] = True
        request.session.pop('pi_transaction_id', None)
        _bind_session_to_jwt(request, token)
        log.info('OTP verified user=%s', username)
        return redirect('dashboard')

    return render(request, 'pooler/login_otp.html')


def logout_view(request):
    username = request.session.get('pi_username', '?')
    request.session.flush()
    log.info('Logout user=%s', username)
    return redirect('login')


# --- dashboard ---------------------------------------------------------------

@pi_auth_required
def dashboard_view(request):
    pools = get_all_pools()
    # Single PI scan for all pools
    allocs_by_pool = live_allocations_all(request.session, pools)

    pool_data = []
    totals = {'total': 0, 'allocated': 0, 'free': 0}
    all_allocs = []

    for pool in pools:
        pool_allocs = allocs_by_pool.get(pool.id, [])
        used_ips = [a.ip_address for a in pool_allocs]
        stats = get_pool_stats(pool, used_ips=used_ips)
        totals['total'] += stats['total']
        totals['allocated'] += stats['allocated']
        totals['free'] += stats['free']
        pool_data.append({
            'pool': pool,
            **stats,
            **pool_subnet_context(pool, used_ips=used_ips, max_cells=512),
        })
        all_allocs.extend(pool_allocs)

    totals['percent'] = (
        round(totals['allocated'] / totals['total'] * 100) if totals['total'] else 0
    )
    # Show first 8 allocations sorted by IP (no "recent" concept anymore)
    sample_allocs = sorted(all_allocs, key=lambda a: tuple(int(x) for x in a.ip_address.split('.')))[:8]

    viewer = request.session.get('pi_username', '?')
    log.info('Dashboard view user=%s pools=%d total=%d allocated=%d free=%d percent=%d%%',
             viewer, len(pools), totals['total'], totals['allocated'],
             totals['free'], totals['percent'])
    for pd in pool_data:
        p = pd['pool']
        log.info('Dashboard pool name=%s cidr=%s attr=%s total=%d allocated=%d free=%d percent=%d%%',
                 p.name, p.cidr, p.attr_key,
                 pd['total'], pd['allocated'], pd['free'], pd['percent'])
    for a in sample_allocs:
        log.info('Dashboard alloc ip=%s user=%s@%s pool=%s attr=%s',
                 a.ip_address, a.username, a.realm, a.pool.name, a.attr_key)

    return render(request, 'pooler/dashboard.html', {
        'page': 'dashboard',
        'pool_data': pool_data,
        'totals': totals,
        'sample_allocs': sample_allocs,
        'pool_count': len(pools),
        **palette_context(pools),
    })


@pi_auth_required
def allocation_list_view(request):
    """Cross-pool allocation view."""
    pools = get_all_pools()
    allocs_by_pool = live_allocations_all(request.session, pools)

    # Flatten all allocations
    all_allocs = []
    for pool_allocs in allocs_by_pool.values():
        all_allocs.extend(pool_allocs)

    # Filter
    q = request.GET.get('q', '').strip()
    pool_filter = request.GET.get('pool', '').strip()

    if q:
        q_lower = q.lower()
        all_allocs = [a for a in all_allocs
                      if q_lower in a.ip_address.lower()
                      or q_lower in a.username.lower()
                      or q_lower in a.realm.lower()]
    if pool_filter:
        all_allocs = [a for a in all_allocs if a.pool.id == pool_filter]

    # Sort by IP
    all_allocs.sort(key=lambda a: tuple(int(x) for x in a.ip_address.split('.')))

    # Paginate
    page = int(request.GET.get('page', 1))
    per_page = 25
    total = len(all_allocs)
    start = max(0, (page - 1) * per_page)
    rows = all_allocs[start:start + per_page]
    pages = max(1, (total + per_page - 1) // per_page)

    # Realms for allocate form
    realms = []
    try:
        client = get_pi_client(request.session)
        realms = client.get_realms()
    except Exception:
        pass

    viewer = request.session.get('pi_username', '?')
    log.info('Allocations view user=%s total=%d page=%d/%d per_page=%d q=%r pool_filter=%r',
             viewer, total, page, pages, per_page, q, pool_filter)
    for a in rows:
        log.debug('Allocations row ip=%s user=%s@%s pool=%s attr=%s',
                  a.ip_address, a.username, a.realm, a.pool.name, a.attr_key)

    return render(request, 'pooler/allocation_list.html', {
        'page': 'allocations',
        'rows': rows,
        'q': q,
        'pool_filter': pool_filter,
        'pools': pools,
        'realms': realms,
        'total': total,
        'page_n': page,
        'pages': pages,
        'per_page': per_page,
        'pool_count': len(pools),
        **palette_context(pools),
    })


# --- pool CRUD ---------------------------------------------------------------

@pi_auth_required
def pool_list_view(request):
    pools = get_all_pools()
    allocs_by_pool = live_allocations_all(request.session, pools)
    pool_data = []
    for pool in pools:
        pool_allocs = allocs_by_pool.get(pool.id, [])
        used_ips = [a.ip_address for a in pool_allocs]
        stats = get_pool_stats(pool, used_ips=used_ips)
        pool_data.append({'pool': pool, **stats})

    viewer = request.session.get('pi_username', '?')
    log.debug('Pools view user=%s pools=%d', viewer, len(pools))
    for pd in pool_data:
        p = pd['pool']
        log.debug('Pools row name=%s cidr=%s attr=%s total=%d allocated=%d free=%d percent=%d%%',
                  p.name, p.cidr, p.attr_key,
                  pd['total'], pd['allocated'], pd['free'], pd['percent'])

    return render(request, 'pooler/pool_list.html', {
        'page': 'pools',
        'pool_data': pool_data,
        'pool_count': len(pools),
        **palette_context(pools),
    })


@pi_auth_required
def pool_create_view(request):
    pools = get_all_pools()
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        cidr = request.POST.get('cidr', '').strip()
        attr_key = request.POST.get('attr_key', '').strip()
        description = request.POST.get('description', '').strip()
        gateway_ip = request.POST.get('gateway_ip', '').strip() or None
        if not name or not cidr or not attr_key:
            messages.error(request, _('Name, CIDR, and Attribute Key are required.'))
            return render(request, 'pooler/pool_form.html', {
                'page': 'pool_new', 'editing': False,
                'form': request.POST,
                'pool_count': len(pools), **palette_context(pools),
            })
        try:
            pool = create_pool(name, cidr, attr_key, description, gateway_ip)
            messages.success(request, _('Pool "%(name)s" created.') % {'name': pool.name})
            return redirect('pool_detail', pk=pool.pk)
        except (PoolServiceError, Exception) as e:
            messages.error(request, str(e))
            return render(request, 'pooler/pool_form.html', {
                'page': 'pool_new', 'editing': False,
                'form': request.POST,
                'pool_count': len(pools), **palette_context(pools),
            })
    return render(request, 'pooler/pool_form.html', {
        'page': 'pool_new', 'editing': False, 'form': {},
        'pool_count': len(pools), **palette_context(pools),
    })


@pi_auth_required
def pool_edit_view(request, pk):
    pool = get_pool_or_404(pk)
    pools = get_all_pools()
    if request.method == 'POST':
        description = request.POST.get('description', '').strip()
        gateway_ip = request.POST.get('gateway_ip', '').strip() or None
        update_pool(pk, description=description, gateway_ip=gateway_ip)
        messages.success(request, _('Pool "%(name)s" updated.') % {'name': pool.name})
        return redirect('pool_detail', pk=pool.pk)
    return render(request, 'pooler/pool_form.html', {
        'page': 'pool_edit', 'editing': True, 'pool': pool,
        'form': {
            'name': pool.name, 'cidr': pool.cidr, 'attr_key': pool.attr_key,
            'description': pool.description, 'gateway_ip': pool.gateway_ip or '',
        },
        'pool_count': len(pools), **palette_context(pools),
    })


@pi_auth_required
def pool_detail_view(request, pk):
    pool = get_pool_or_404(pk)
    pools = get_all_pools()
    allocs = live_allocations(request.session, pool)
    used_ips = [a.ip_address for a in allocs]
    stats = get_pool_stats(pool, used_ips=used_ips)
    free_ips = get_free_ips(pool, used_ips, limit=50)

    # Get realms for dropdown
    realms = []
    try:
        client = get_pi_client(request.session)
        realms = client.get_realms()
    except Exception:
        pass

    viewer = request.session.get('pi_username', '?')
    log.info('Pool detail view user=%s pool=%s cidr=%s attr=%s total=%d allocated=%d free=%d percent=%d%%',
             viewer, pool.name, pool.cidr, pool.attr_key,
             stats['total'], stats['allocated'], stats['free'], stats['percent'])
    for a in allocs:
        log.info('Pool detail alloc pool=%s ip=%s user=%s@%s attr=%s',
                 pool.name, a.ip_address, a.username, a.realm, a.attr_key)

    return render(request, 'pooler/pool_detail.html', {
        'page': 'pool_detail',
        'pool': pool,
        'stats': stats,
        'allocations': allocs,
        'free_ips': free_ips,
        'next_ip': free_ips[0] if free_ips else None,
        'realms': realms,
        **pool_subnet_context(pool, used_ips=used_ips),
        'pool_count': len(pools),
        **palette_context(pools),
    })


@pi_auth_required
@require_POST
def pool_delete_view(request, pk):
    try:
        pool = get_pool_or_404(pk)
        pool_name = pool.name
        delete_pool(request.session, pk)
        messages.success(request, _('Pool "%(name)s" deleted.') % {'name': pool_name})
    except PoolServiceError as e:
        messages.error(request, str(e))
        return redirect('pool_detail', pk=pk)
    return redirect('pool_list')


# --- allocation / release ----------------------------------------------------

@pi_auth_required
@require_POST
def allocate_view(request, pk):
    username = request.POST.get('username', '').strip()
    realm = request.POST.get('realm', '').strip()
    ip_address = request.POST.get('ip_address', '').strip() or None
    if not username or not realm:
        messages.error(request, _('Username and realm are required.'))
        return redirect('pool_detail', pk=pk)
    try:
        allocated_ip = allocate_ip(request.session, pk, username, realm, ip_address)
        messages.success(request, _('IP %(ip)s allocated to %(user)s@%(realm)s') % {
            'ip': allocated_ip, 'user': username, 'realm': realm})
    except PoolServiceError as e:
        messages.error(request, str(e))
    return redirect('pool_detail', pk=pk)


@pi_auth_required
@require_POST
def release_view(request, pk):
    """Release an IP. POST body carries ip_address, username, realm."""
    ip_address = request.POST.get('ip_address', '').strip()
    username = request.POST.get('username', '').strip()
    realm = request.POST.get('realm', '').strip()
    if not ip_address or not username or not realm:
        messages.error(request, _('IP address, username, and realm are required.'))
        return redirect('pool_detail', pk=pk)
    try:
        release_ip(request.session, pk, ip_address, username, realm)
        messages.success(request, _('IP %(ip)s released.') % {'ip': ip_address})
    except PoolServiceError as e:
        messages.error(request, str(e))
    return redirect('pool_detail', pk=pk)


# --- JSON API ----------------------------------------------------------------

@pi_auth_required
def api_users(request):
    """Return users for a given realm (for autocomplete)."""
    realm = request.GET.get('realm', '')
    q = request.GET.get('q', '').strip().lower()
    if not realm:
        return JsonResponse({'users': []})
    try:
        client = get_pi_client(request.session)
        users = client.get_users(realm)
        usernames = sorted(u.get('username', '') for u in users if u.get('username'))
        if q:
            usernames = [u for u in usernames if q in u.lower()]
        return JsonResponse({'users': usernames[:10]})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@pi_auth_required
def api_free_ips(request, pk):
    """Return free IPs for a pool."""
    pool = get_pool_or_404(pk)
    allocs = live_allocations(request.session, pool)
    used_ips = [a.ip_address for a in allocs]
    ips = get_free_ips(pool, used_ips, limit=200)
    return JsonResponse({'ips': ips, 'total_free': len(ips)})
