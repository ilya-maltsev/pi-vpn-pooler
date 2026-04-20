"""Template/context helpers used by redesigned views.

Keeps views.py uncluttered. Nothing here hits PI — just ipaddress math.
"""
import ipaddress
import json

from django.urls import reverse

from .ip_utils import enumerate_hosts


def pool_subnet_context(pool, *, used_ips=None, max_cells=1024):
    """Return a dict with {total, gateway_idx, used_indices_json, used_count}
    for the SubnetGrid partial."""
    hosts = enumerate_hosts(pool.cidr, gateway_ip=None)
    total = len(hosts)
    try:
        gateway_idx = 0
    except ValueError:
        gateway_idx = None

    pos = {ip: i for i, ip in enumerate(hosts)}
    used_ip_list = used_ips or []
    used = sorted(
        idx for idx in (pos.get(a) for a in used_ip_list)
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


def palette_context(pools=None):
    """Build JSON payload for the command palette.

    Sections: Navigate, Actions, Pools (jump-to-detail)."""
    from .pool_store import get_all_pools
    pools = list(pools) if pools is not None else get_all_pools()
    nav = [
        {'label': 'Overview',    'url': reverse('dashboard'),       'kbd': 'G O', 'icon': 'dashboard'},
        {'label': 'Pools',       'url': reverse('pool_list'),       'kbd': 'G P', 'icon': 'pools'},
        {'label': 'Allocations', 'url': reverse('allocation_list'), 'kbd': 'G A', 'icon': 'network'},
    ]
    actions = [
        {'label': 'New pool',  'url': reverse('pool_create'), 'icon': 'plus'},
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
