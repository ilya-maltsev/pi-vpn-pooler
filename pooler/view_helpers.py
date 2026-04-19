"""Template/context helpers used by redesigned views.

Keeps views.py uncluttered. Nothing here hits PI — just local DB + ipaddress math.
"""
import ipaddress
import json

from django.urls import reverse

from .ip_utils import enumerate_hosts
from .models import Allocation, VpnPool


def pool_subnet_context(pool, *, max_cells=1024):
    """Return a dict with {total, gateway_idx, used_indices_json, used_count}
    for the SubnetGrid partial. `used_indices` is truncated to `max_cells`."""
    hosts = enumerate_hosts(pool.cidr, gateway_ip=None)
    total = len(hosts)
    try:
        network = ipaddress.ip_network(pool.cidr, strict=False)
        # Gateway sits at index 0 in the grid regardless of where it actually is
        # in the subnet — matches the handoff spec ("Gateway (index 0)").
        gateway_idx = 0
    except ValueError:
        gateway_idx = None

    pos = {ip: i for i, ip in enumerate(hosts)}
    used = sorted(
        idx for idx in (pos.get(a) for a in
                        pool.allocations.values_list('ip_address', flat=True))
        if idx is not None
    )
    used_trimmed = [i for i in used if i < max_cells]
    return {
        'total': total,
        'gateway_idx': gateway_idx,
        'used_count': len(used),
        'used_indices_json': json.dumps(used_trimmed),
        'max_cells': max_cells,
    }


def global_counts():
    return {
        'pool_count': VpnPool.objects.count(),
        'alloc_count': Allocation.objects.count(),
    }


def palette_context(pools=None):
    """Build JSON payload for the command palette.

    Sections: Navigate, Actions, Pools (jump-to-detail)."""
    pools = list(pools) if pools is not None else list(VpnPool.objects.all())
    nav = [
        {'label': 'Overview',    'url': reverse('dashboard'),   'kbd': 'G O', 'icon': 'dashboard'},
        {'label': 'Pools',       'url': reverse('pool_list'),   'kbd': 'G P', 'icon': 'pools'},
        {'label': 'Allocations', 'url': reverse('allocation_list'), 'kbd': 'G A', 'icon': 'network'},
        {'label': 'Sync',        'url': reverse('sync'),        'kbd': 'G S', 'icon': 'sync'},
    ]
    actions = [
        {'label': 'New pool',  'url': reverse('pool_create'), 'icon': 'plus'},
        {'label': 'Run sync',  'url': reverse('sync'),        'icon': 'sync'},
        {'label': 'Logout',    'url': reverse('logout'),      'icon': 'logout'},
    ]
    pool_items = [
        {'label': p.name, 'sub': p.cidr, 'url': reverse('pool_detail', args=[p.pk]), 'icon': 'pools'}
        for p in pools
    ]
    return {
        'palette_json': json.dumps({
            'sections': [
                {'title': 'Navigate',      'items': nav},
                {'title': 'Actions',       'items': actions},
                {'title': 'Jump to pool',  'items': pool_items},
            ],
        }),
    }
