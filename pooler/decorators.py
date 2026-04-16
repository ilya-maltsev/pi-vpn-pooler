"""Authentication decorators for PI JWT session."""
from functools import wraps

from django.shortcuts import redirect


def pi_auth_required(view_func):
    """Require a valid PI JWT in the session.  Redirects to /login/ otherwise."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.session.get('pi_token'):
            return redirect('login')
        return view_func(request, *args, **kwargs)
    return wrapper
