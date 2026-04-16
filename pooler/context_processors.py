"""Template context processors."""


def pi_status(request):
    return {
        'pi_authenticated': bool(request.session.get('pi_token')),
        'pi_username': request.session.get('pi_username', ''),
    }
