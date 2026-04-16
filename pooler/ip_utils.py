import ipaddress
import re

_IPV4_RE = re.compile(
    r'^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$'
)


def is_valid_ipv4(value):
    return bool(_IPV4_RE.match(str(value).strip()))


def parse_cidr(cidr_str):
    return ipaddress.ip_network(cidr_str.strip(), strict=False)


def enumerate_hosts(cidr_str, gateway_ip=None):
    """Return list of usable host IPs in a CIDR (excluding network, broadcast, gateway)."""
    network = parse_cidr(cidr_str)
    excluded = set()
    if gateway_ip:
        excluded.add(ipaddress.ip_address(gateway_ip))
    return [str(ip) for ip in network.hosts() if ip not in excluded]


def cidr_overlaps(cidr_a, cidr_b):
    """Check if two CIDRs overlap."""
    return parse_cidr(cidr_a).overlaps(parse_cidr(cidr_b))


def ip_in_cidr(ip_str, cidr_str):
    """Check if an IP address is within a CIDR."""
    return ipaddress.ip_address(ip_str) in parse_cidr(cidr_str)


def validate_cidr(cidr_str):
    """Validate a CIDR string. Returns (network, error_message)."""
    try:
        net = ipaddress.ip_network(cidr_str.strip(), strict=False)
    except (ValueError, TypeError) as e:
        return None, str(e)
    if net.version != 4:
        return None, "Only IPv4 networks are supported"
    if net.prefixlen < 16:
        return None, "Network too large (must be /16 or smaller)"
    return net, None
