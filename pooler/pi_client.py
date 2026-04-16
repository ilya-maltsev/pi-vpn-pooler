"""privacyIDEA REST API client."""
import logging
from datetime import datetime, timezone, timedelta

import requests
from django.conf import settings

log = logging.getLogger('pooler')


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
        resp = requests.post(
            f'{self.base_url}/auth',
            data={'username': username, 'password': password},
            verify=self.verify_ssl,
            timeout=15,
        )
        data = resp.json()
        result = data.get('result', {})
        if not result.get('status'):
            msg = result.get('error', {}).get('message', 'Authentication failed')
            raise PIClientError(msg)
        token = result['value']['token']
        self._token = token
        self._username = username
        self._password = password
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
                self.authenticate(self._username, self._password)
            else:
                raise PIClientError('JWT expired and no credentials stored for refresh.')

    def _headers(self):
        return {'PI-Authorization': self._token}

    # --- realms --------------------------------------------------------------

    def get_realms(self):
        """Return list of realm names."""
        self._ensure_auth()
        resp = requests.get(
            f'{self.base_url}/realm/',
            headers=self._headers(),
            verify=self.verify_ssl,
            timeout=15,
        )
        data = resp.json()
        if not data.get('result', {}).get('status'):
            raise PIClientError('Failed to get realms')
        return list(data['result']['value'].keys())

    # --- users ---------------------------------------------------------------

    def get_users(self, realm):
        """Return list of user dicts for a realm (includes custom attrs if any exist)."""
        self._ensure_auth()
        resp = requests.get(
            f'{self.base_url}/user/',
            params={'realm': realm},
            headers=self._headers(),
            verify=self.verify_ssl,
            timeout=30,
        )
        data = resp.json()
        if not data.get('result', {}).get('status'):
            raise PIClientError(f'Failed to get users for realm {realm}')
        return data['result']['value']

    def get_user_attributes(self, username, realm):
        """Return custom attributes dict for a specific user."""
        self._ensure_auth()
        resp = requests.get(
            f'{self.base_url}/user/attribute',
            params={'user': username, 'realm': realm},
            headers=self._headers(),
            verify=self.verify_ssl,
            timeout=15,
        )
        data = resp.json()
        if not data.get('result', {}).get('status'):
            raise PIClientError(f'Failed to get attributes for {username}@{realm}')
        return data['result']['value'] or {}

    # --- custom attributes ---------------------------------------------------

    def set_user_attribute(self, username, realm, key, value):
        """Set a custom attribute on a user in PI.  Returns attribute ID."""
        self._ensure_auth()
        resp = requests.post(
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
            raise PIClientError(msg)
        return result['value']

    def delete_user_attribute(self, key, username, realm):
        """Delete a custom attribute from a user in PI.  Returns deleted count."""
        self._ensure_auth()
        from urllib.parse import quote
        url = f'{self.base_url}/user/attribute/{quote(key)}/{quote(username)}/{quote(realm)}'
        resp = requests.delete(
            url,
            headers=self._headers(),
            verify=self.verify_ssl,
            timeout=15,
        )
        data = resp.json()
        result = data.get('result', {})
        if not result.get('status'):
            msg = result.get('error', {}).get('message', 'Failed to delete attribute')
            raise PIClientError(msg)
        return result['value']

    # --- scan all users for IP uniqueness ------------------------------------

    def find_ip_across_all_users(self, ip_address):
        """Scan all realms/users for a given IP in any custom attribute value.
        Returns (username, realm, attr_key) if found, else None."""
        realms = self.get_realms()
        for realm in realms:
            users = self.get_users(realm)
            for user in users:
                username = user.get('username', '')
                for k, v in user.items():
                    if k in ('username', 'userid', 'resolver', 'editable',
                             'givenname', 'surname', 'email', 'phone',
                             'mobile', 'description'):
                        continue
                    if str(v) == str(ip_address):
                        return username, realm, k
        return None
