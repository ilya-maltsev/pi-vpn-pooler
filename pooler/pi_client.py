"""privacyIDEA REST API client."""
import json
import logging
from datetime import datetime, timezone, timedelta

import requests
from django.conf import settings

log = logging.getLogger('pooler')


# --- redaction for DEBUG packet dumps ----------------------------------------
# Values of any key whose lowercased name contains one of these substrings are
# replaced with "***" before being emitted to logs.
_SECRET_SUBSTRINGS = (
    'password', 'pass',
    'authorization', 'cookie',
    'token', 'secret',
    'pi-authorization',
)


def _is_secret_key(name):
    n = str(name).lower()
    return any(s in n for s in _SECRET_SUBSTRINGS)


def _redact_mapping(items):
    """Return a dict copy with sensitive values replaced by '***'."""
    if items is None:
        return {}
    try:
        iterator = items.items() if hasattr(items, 'items') else items
    except Exception:
        return {}
    out = {}
    for k, v in iterator:
        out[k] = '***' if _is_secret_key(k) else v
    return out


def _redact_json_body(text):
    """Redact values of sensitive keys in a JSON body. Returns original string
    on parse failure (likely not JSON)."""
    if not text:
        return text
    try:
        obj = json.loads(text)
    except Exception:
        return text

    def walk(node):
        if isinstance(node, dict):
            return {k: ('***' if _is_secret_key(k) else walk(v))
                    for k, v in node.items()}
        if isinstance(node, list):
            return [walk(x) for x in node]
        return node

    return json.dumps(walk(obj), separators=(',', ':'))


class PIClientError(Exception):
    pass


class PIClient:
    """Stateless helper that authenticates with PI and calls its REST API."""

    def __init__(self, base_url=None, verify_ssl=None):
        self.base_url = (base_url or settings.PI_API_URL).rstrip('/')
        self.verify_ssl = verify_ssl if verify_ssl is not None else settings.PI_VERIFY_SSL
        self._token = None
        self._token_exp = None
        self._username = None
        self._password = None

    # --- authentication ------------------------------------------------------

    def authenticate(self, username, password):
        """Obtain JWT token from PI.  Returns the token string or raises."""
        log.debug('PI auth request url=%s/auth user=%s', self.base_url, username)
        resp = self._request(
            'POST',
            f'{self.base_url}/auth',
            data={'username': username, 'password': password},
            verify=self.verify_ssl,
            timeout=15,
        )
        data = resp.json()
        result = data.get('result', {})
        if not result.get('status'):
            msg = result.get('error', {}).get('message', 'Authentication failed')
            log.warning('PI auth failed user=%s: %s', username, msg)
            raise PIClientError(msg)
        token = result['value']['token']
        self._token = token
        self._username = username
        self._password = password
        log.info('PI auth success user=%s', username)
        # Decode exp from JWT payload (base64, no verification — just for timing)
        import json, base64
        payload_b64 = token.split('.')[1]
        payload_b64 += '=' * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        self._token_exp = datetime.fromtimestamp(payload['exp'], tz=timezone.utc)
        return token

    def _ensure_auth(self):
        if not self._token:
            raise PIClientError('Not authenticated. Call authenticate() first.')
        if datetime.now(timezone.utc) >= self._token_exp - timedelta(minutes=5):
            if self._username and self._password:
                log.debug('JWT near expiry, refreshing for user=%s', self._username)
                self.authenticate(self._username, self._password)
            else:
                raise PIClientError('JWT expired and no credentials stored for refresh.')

    def _headers(self):
        return {'PI-Authorization': self._token}

    def _request(self, method, url, **kwargs):
        """Send an HTTP request and log full packet at DEBUG with redaction."""
        headers = kwargs.get('headers', {}) or {}
        params = kwargs.get('params')
        data = kwargs.get('data')
        log.debug('PI HTTP >>> %s %s headers=%s params=%s body=%s',
                  method, url,
                  _redact_mapping(headers),
                  _redact_mapping(params) if params else None,
                  _redact_mapping(data) if data else None)
        resp = requests.request(method, url, **kwargs)
        log.debug('PI HTTP <<< %s %s headers=%s body=%s',
                  resp.status_code, resp.reason,
                  _redact_mapping(resp.headers),
                  _redact_json_body(resp.text))
        return resp

    # --- realms --------------------------------------------------------------

    def get_realms(self):
        """Return list of realm names."""
        self._ensure_auth()
        log.debug('PI GET /realm/')
        resp = self._request(
            'GET',
            f'{self.base_url}/realm/',
            headers=self._headers(),
            verify=self.verify_ssl,
            timeout=15,
        )
        data = resp.json()
        if not data.get('result', {}).get('status'):
            log.warning('PI /realm/ returned non-success')
            raise PIClientError('Failed to get realms')
        realms = list(data['result']['value'].keys())
        log.debug('PI /realm/ returned %d realm(s)', len(realms))
        return realms

    # --- users ---------------------------------------------------------------

    def get_users(self, realm):
        """Return list of user dicts for a realm (includes custom attrs if any exist)."""
        self._ensure_auth()
        log.debug('PI GET /user/ realm=%s', realm)
        resp = self._request(
            'GET',
            f'{self.base_url}/user/',
            params={'realm': realm},
            headers=self._headers(),
            verify=self.verify_ssl,
            timeout=30,
        )
        data = resp.json()
        if not data.get('result', {}).get('status'):
            log.warning('PI /user/ realm=%s returned non-success', realm)
            raise PIClientError(f'Failed to get users for realm {realm}')
        users = data['result']['value']
        log.debug('PI /user/ realm=%s returned %d user(s)', realm, len(users))
        return users

    def get_user_attributes(self, username, realm):
        """Return custom attributes dict for a specific user."""
        self._ensure_auth()
        log.debug('PI GET /user/attribute user=%s realm=%s', username, realm)
        resp = self._request(
            'GET',
            f'{self.base_url}/user/attribute',
            params={'user': username, 'realm': realm},
            headers=self._headers(),
            verify=self.verify_ssl,
            timeout=15,
        )
        data = resp.json()
        if not data.get('result', {}).get('status'):
            log.warning('PI /user/attribute GET user=%s@%s returned non-success', username, realm)
            raise PIClientError(f'Failed to get attributes for {username}@{realm}')
        return data['result']['value'] or {}

    # --- custom attributes ---------------------------------------------------

    def set_user_attribute(self, username, realm, key, value):
        """Set a custom attribute on a user in PI.  Returns attribute ID."""
        self._ensure_auth()
        log.info('PI POST /user/attribute user=%s@%s %s=%s', username, realm, key, value)
        resp = self._request(
            'POST',
            f'{self.base_url}/user/attribute',
            data={'user': username, 'realm': realm, 'key': key, 'value': value},
            headers=self._headers(),
            verify=self.verify_ssl,
            timeout=15,
        )
        data = resp.json()
        result = data.get('result', {})
        if not result.get('status'):
            msg = result.get('error', {}).get('message', 'Failed to set attribute')
            log.warning('PI set_user_attribute user=%s@%s %s failed: %s', username, realm, key, msg)
            raise PIClientError(msg)
        return result['value']

    def delete_user_attribute(self, key, username, realm):
        """Delete a custom attribute from a user in PI.  Returns deleted count."""
        self._ensure_auth()
        from urllib.parse import quote
        url = f'{self.base_url}/user/attribute/{quote(key)}/{quote(username)}/{quote(realm)}'
        log.info('PI DELETE /user/attribute user=%s@%s key=%s', username, realm, key)
        resp = self._request(
            'DELETE',
            url,
            headers=self._headers(),
            verify=self.verify_ssl,
            timeout=15,
        )
        data = resp.json()
        result = data.get('result', {})
        if not result.get('status'):
            msg = result.get('error', {}).get('message', 'Failed to delete attribute')
            log.warning('PI delete_user_attribute user=%s@%s %s failed: %s', username, realm, key, msg)
            raise PIClientError(msg)
        return result['value']

    # --- scan all users for IP uniqueness ------------------------------------

    def find_ip_across_all_users(self, ip_address):
        """Scan all realms/users for a given IP in any custom attribute value.
        Returns (username, realm, attr_key) if found, else None."""
        log.debug('Scanning all realms for ip=%s', ip_address)
        realms = self.get_realms()
        for realm in realms:
            users = self.get_users(realm)
            log.debug('Scanning realm=%s (%d users) for ip=%s', realm, len(users), ip_address)
            for user in users:
                username = user.get('username', '')
                for k, v in user.items():
                    if k in ('username', 'userid', 'resolver', 'editable',
                             'givenname', 'surname', 'email', 'phone',
                             'mobile', 'description'):
                        continue
                    if str(v) == str(ip_address):
                        log.debug('ip=%s matched user=%s@%s attr=%s', ip_address, username, realm, k)
                        return username, realm, k
        log.debug('ip=%s not found in any user attribute', ip_address)
        return None
