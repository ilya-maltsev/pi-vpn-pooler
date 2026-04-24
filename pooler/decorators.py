"""Authentication decorators for PI JWT session."""
import base64
import json
import logging
from datetime import datetime, timezone, timedelta
from functools import wraps

from django.contrib import messages
from django.shortcuts import redirect
from django.utils.translation import gettext as _

from .pi_client import PIClientError

log = logging.getLogger('pooler')


def _jwt_expired(token, skew_seconds=60):
    """Return True if the JWT's exp claim is in the past (or within skew).

    A malformed token is treated as expired so the user is bounced to login
    instead of hitting the API and getting a 500.
    """
    try:
        payload_b64 = token.split('.')[1]
        payload_b64 += '=' * (-len(payload_b64) % 4)
        exp = json.loads(base64.urlsafe_b64decode(payload_b64))['exp']
        exp_at = datetime.fromtimestamp(exp, tz=timezone.utc)
    except Exception:
        return True
    return datetime.now(timezone.utc) >= exp_at - timedelta(seconds=skew_seconds)


def pi_auth_required(view_func):
    """Require a valid (unexpired) PI JWT + completed 2FA in the session."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        token = request.session.get('pi_token')
        if not token:
            return redirect('login')
        if _jwt_expired(token):
            username = request.session.get('pi_username', '?')
            log.info('JWT expired for user=%s — flushing session', username)
            request.session.flush()
            messages.info(request, _('Your session has expired. Please sign in again.'))
            return redirect('login')
        if not request.session.get('pi_2fa_ok'):
            return redirect('login_otp')
        try:
            return view_func(request, *args, **kwargs)
        except PIClientError as e:
            # JWT was locally unexpired but PI rejected it (container restart,
            # cache flush, token revoked, etc.). Treat as session-invalid.
            username = request.session.get('pi_username', '?')
            log.info('PI rejected JWT for user=%s (%s) — flushing session',
                     username, e)
            request.session.flush()
            messages.info(request, _('Your session is no longer valid. Please sign in again.'))
            return redirect('login')
    return wrapper
