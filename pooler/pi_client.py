"""privacyIDEA REST API client."""
import base64
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

    # --- authentication ------------------------------------------------------

    def authenticate(self, username, password):
        """Obtain a JWT from PI in a single call (no challenge support).

        Used by helper scripts (admin credentials with passOnNoToken) and by
        ``_ensure_auth`` ONLY when caller code chooses to keep credentials in
        memory.  The interactive login uses ``auth()`` instead so passwords
        never reach the session.
        """
        result = self.auth(username=username, password=password)
        token = result.get('token')
        if not token:
            raise PIClientError('Authentication requires OTP — use auth() directly.')
        return token

    def auth(self, username=None, password=None, transaction_id=None, realm=None):
        """POST /auth — supports challenge-response via transaction_id.

        Step 1 (trigger): ``auth(username, password, realm=…)``
        Step 2 (answer):  ``auth(username, password=otp, transaction_id=tid)``

        Returns one of:
          {'token': <JWT>}                     — authentication complete
          {'transaction_id': <tid>, 'message',
           'multi_challenge'}                  — challenge triggered, OTP required
        Raises ``PIClientError`` on auth failure or transport error.

        On success the JWT is cached on the instance so subsequent calls
        (list_tokens, get_users, …) work without re-auth.
        """
        data = {}
        if username:
            data['username'] = username
        if password is not None:
            data['password'] = password
        if transaction_id:
            data['transaction_id'] = transaction_id
        if realm:
            data['realm'] = realm
        log.debug('PI POST /auth user=%s tx=%s', username, transaction_id)
        resp = self._request(
            'POST',
            f'{self.base_url}/auth',
            data=data,
            verify=self.verify_ssl,
            timeout=15,
        )
        try:
            body = resp.json()
        except ValueError:
            raise PIClientError(f'Invalid response from PI (HTTP {resp.status_code})')
        result = body.get('result', {})
        if not result.get('status'):
            msg = result.get('error', {}).get('message', 'Authentication failed')
            log.warning('PI /auth user=%s tx=%s failed: %s',
                        username, transaction_id, msg)
            raise PIClientError(msg)
        detail = body.get('detail', {}) or {}
        # Challenge: status=true, value falsy, transaction_id in detail.
        if not result.get('value'):
            tx = detail.get('transaction_id')
            if tx:
                log.info('PI /auth challenge triggered user=%s tx=%s', username, tx)
                return {
                    'transaction_id': tx,
                    'message': detail.get('message', ''),
                    'multi_challenge': detail.get('multi_challenge', []),
                }
            raise PIClientError('Authentication failed')
        # Success: result.value is the token envelope.
        value = result.get('value') or {}
        token = value.get('token') if isinstance(value, dict) else None
        if not token:
            raise PIClientError('Authentication failed (no token in response)')
        self._token = token
        self._username = username
        payload_b64 = token.split('.')[1]
        payload_b64 += '=' * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        self._token_exp = datetime.fromtimestamp(payload['exp'], tz=timezone.utc)
        log.info('PI /auth success user=%s', username)
        return {'token': token}

    def _ensure_auth(self):
        if not self._token:
            raise PIClientError('Not authenticated. Call auth() first.')
        if datetime.now(timezone.utc) >= self._token_exp - timedelta(minutes=5):
            raise PIClientError('JWT expired — re-login required.')

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
        log.info('PI /user/ realm=%s users=%d bytes=%d',
                 realm, len(users), len(resp.content))
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

    # --- token management (2FA) -----------------------------------------------

    def set_token(self, token, username=None):
        """Inject a pre-existing JWT (e.g. from session) into this client."""
        self._token = token
        self._username = username
        payload_b64 = token.split('.')[1]
        payload_b64 += '=' * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        self._token_exp = datetime.fromtimestamp(payload['exp'], tz=timezone.utc)

    def list_tokens(self, username=None, realm=None):
        """List token objects (TOTP, HOTP, etc.) for a user.
        If username is None, returns tokens visible to the authenticated JWT."""
        self._ensure_auth()
        params = {}
        if username:
            params['user'] = username
        if realm:
            params['realm'] = realm
        log.debug('PI GET /token/ user=%s realm=%s', username, realm)
        resp = self._request(
            'GET',
            f'{self.base_url}/token/',
            params=params or None,
            headers=self._headers(),
            verify=self.verify_ssl,
            timeout=15,
        )
        data = resp.json()
        if not data.get('result', {}).get('status'):
            raise PIClientError('Failed to list tokens')
        tokens = data['result']['value'].get('tokens', [])
        log.debug('PI /token/ returned %d token(s)', len(tokens))
        return tokens

    def has_active_totp(self, username=None, realm=None):
        """Check if a user has at least one active TOTP token."""
        try:
            tokens = self.list_tokens(username=username, realm=realm)
            for t in tokens:
                if (t.get('tokentype', '').lower() == 'totp'
                        and t.get('active', False)
                        and not t.get('revoked', False)):
                    return True
            return False
        except PIClientError:
            log.warning('list_tokens failed for user=%s — treating as no TOTP', username)
            return False

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
