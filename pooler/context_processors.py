"""Template context processors."""


def pi_status(request):
    return {
        'pi_authenticated': bool(request.session.get('pi_token')),
        'pi_username': request.session.get('pi_username', ''),
        'pi_realm': request.session.get('pi_realm', ''),
        'pi_2fa_ok': request.session.get('pi_2fa_ok', False),
        'pi_needs_otp': request.session.get('pi_needs_otp', False),
    }
