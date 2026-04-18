"""Function-based views (GostCA pattern)."""
import logging

from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST

from .decorators import pi_auth_required
from .models import VpnPool, Allocation, SyncLog
from .pi_client import PIClient, PIClientError
from .pool_service import (
    create_pool, delete_pool, get_pool_stats, get_free_ips,
    allocate_ip, release_ip, full_sync, get_pi_client,
    PoolServiceError,
)

log = logging.getLogger('pooler')


# --- auth --------------------------------------------------------------------

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        if not username or not password:
            messages.error(request, 'Username and password are required.')
            return render(request, 'pooler/login.html')
        log.debug('Login attempt user=%s from %s', username,
                  request.META.get('REMOTE_ADDR', '?'))
        client = PIClient()
        try:
            token = client.authenticate(username, password)
            request.session['pi_token'] = token
            request.session['pi_username'] = username
            request.session['pi_password'] = password
            log.info('Login success user=%s', username)
            return redirect('dashboard')
        except PIClientError as e:
            log.warning('Login failed user=%s: %s', username, e)
            messages.error(request, f'Authentication failed: {e}')
    return render(request, 'pooler/login.html')


def logout_view(request):
    username = request.session.get('pi_username', '?')
    request.session.flush()
    log.info('Logout user=%s', username)
    return redirect('login')


# --- dashboard ---------------------------------------------------------------

@pi_auth_required
def dashboard_view(request):
    pools = VpnPool.objects.all()
    pool_data = []
    for pool in pools:
        stats = get_pool_stats(pool)
        pool_data.append({'pool': pool, **stats})
    last_sync = SyncLog.objects.first()
    return render(request, 'pooler/dashboard.html', {
        'page': 'dashboard',
        'pool_data': pool_data,
        'last_sync': last_sync,
    })


# --- pool CRUD ---------------------------------------------------------------

@pi_auth_required
def pool_list_view(request):
    pools = VpnPool.objects.all()
    pool_data = []
    for pool in pools:
        stats = get_pool_stats(pool)
        pool_data.append({'pool': pool, **stats})
    return render(request, 'pooler/pool_list.html', {
        'page': 'pools',
        'pool_data': pool_data,
    })


@pi_auth_required
def pool_create_view(request):
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        cidr = request.POST.get('cidr', '').strip()
        attr_key = request.POST.get('attr_key', '').strip()
        description = request.POST.get('description', '').strip()
        gateway_ip = request.POST.get('gateway_ip', '').strip() or None
        if not name or not cidr or not attr_key:
            messages.error(request, 'Name, CIDR, and Attribute Key are required.')
            return render(request, 'pooler/pool_form.html', {
                'page': 'pools', 'editing': False,
                'form': request.POST,
            })
        try:
            pool = create_pool(name, cidr, attr_key, description, gateway_ip)
            messages.success(request, f'Pool "{pool.name}" created.')
            return redirect('pool_detail', pk=pool.pk)
        except (PoolServiceError, Exception) as e:
            messages.error(request, str(e))
            return render(request, 'pooler/pool_form.html', {
                'page': 'pools', 'editing': False,
                'form': request.POST,
            })
    return render(request, 'pooler/pool_form.html', {
        'page': 'pools', 'editing': False, 'form': {},
    })


@pi_auth_required
def pool_edit_view(request, pk):
    pool = get_object_or_404(VpnPool, pk=pk)
    if request.method == 'POST':
        pool.description = request.POST.get('description', '').strip()
        gateway_ip = request.POST.get('gateway_ip', '').strip()
        pool.gateway_ip = gateway_ip or None
        pool.save()
        messages.success(request, f'Pool "{pool.name}" updated.')
        return redirect('pool_detail', pk=pool.pk)
    return render(request, 'pooler/pool_form.html', {
        'page': 'pools', 'editing': True, 'pool': pool,
        'form': {
            'name': pool.name, 'cidr': pool.cidr, 'attr_key': pool.attr_key,
            'description': pool.description, 'gateway_ip': pool.gateway_ip or '',
        },
    })


@pi_auth_required
def pool_detail_view(request, pk):
    pool = get_object_or_404(VpnPool, pk=pk)
    stats = get_pool_stats(pool)
    allocations = pool.allocations.all()
    free_ips = get_free_ips(pool, limit=50)

    # Get realms for dropdown
    realms = []
    try:
        client = get_pi_client(request.session)
        realms = client.get_realms()
    except Exception:
        pass

    return render(request, 'pooler/pool_detail.html', {
        'page': 'pools',
        'pool': pool,
        'stats': stats,
        'allocations': allocations,
        'free_ips': free_ips,
        'realms': realms,
    })


@pi_auth_required
@require_POST
def pool_delete_view(request, pk):
    try:
        pool_name = VpnPool.objects.get(pk=pk).name
        delete_pool(pk)
        messages.success(request, f'Pool "{pool_name}" deleted.')
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
        messages.error(request, 'Username and realm are required.')
        return redirect('pool_detail', pk=pk)
    try:
        alloc = allocate_ip(request.session, pk, username, realm, ip_address)
        messages.success(request, f'IP {alloc.ip_address} allocated to {username}@{realm}')
    except PoolServiceError as e:
        messages.error(request, str(e))
    return redirect('pool_detail', pk=pk)


@pi_auth_required
@require_POST
def release_view(request, pk, ip):
    try:
        release_ip(request.session, pk, ip)
        messages.success(request, f'IP {ip} released.')
    except PoolServiceError as e:
        messages.error(request, str(e))
    return redirect('pool_detail', pk=pk)


# --- sync --------------------------------------------------------------------

@pi_auth_required
def sync_view(request):
    if request.method == 'POST':
        try:
            sync_log = full_sync(request.session)
            if sync_log.status == 'success':
                messages.success(request, sync_log.details)
            else:
                messages.error(request, f'Sync failed: {sync_log.details}')
        except PoolServiceError as e:
            messages.error(request, str(e))
        return redirect('dashboard')
    # GET — show sync history
    logs = SyncLog.objects.all()[:20]
    return render(request, 'pooler/sync.html', {
        'page': 'sync',
        'logs': logs,
    })


# --- JSON API ----------------------------------------------------------------

@pi_auth_required
def api_users(request):
    """Return users for a given realm (for autocomplete)."""
    realm = request.GET.get('realm', '')
    if not realm:
        return JsonResponse({'users': []})
    try:
        client = get_pi_client(request.session)
        users = client.get_users(realm)
        usernames = [u.get('username', '') for u in users if u.get('username')]
        return JsonResponse({'users': sorted(usernames)})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@pi_auth_required
def api_free_ips(request, pk):
    """Return free IPs for a pool."""
    pool = get_object_or_404(VpnPool, pk=pk)
    ips = get_free_ips(pool, limit=200)
    return JsonResponse({'ips': ips, 'total_free': len(ips)})
