"""Authentication decorators for PI JWT session."""
from functools import wraps

from django.shortcuts import redirect


def pi_auth_required(view_func):
    """Require a valid PI JWT + completed 2FA in the session."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.session.get('pi_token'):
            return redirect('login')
        if not request.session.get('pi_2fa_ok'):
            return redirect('login_otp')
        return view_func(request, *args, **kwargs)
    return wrapper
