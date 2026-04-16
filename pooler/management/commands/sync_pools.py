"""Management command to sync VPN pool allocations with privacyIDEA."""
from django.core.management.base import BaseCommand

from pooler.pi_client import PIClient, PIClientError
from pooler.pool_service import full_sync


class Command(BaseCommand):
    help = 'Sync VPN pool allocations with privacyIDEA custom user attributes'

    def add_arguments(self, parser):
        parser.add_argument('--username', required=True, help='PI admin username')
        parser.add_argument('--password', required=True, help='PI admin password')

    def handle(self, *args, **options):
        client = PIClient()
        try:
            token = client.authenticate(options['username'], options['password'])
        except PIClientError as e:
            self.stderr.write(self.style.ERROR(f'Authentication failed: {e}'))
            return

        # Build a fake session dict for pool_service
        session = {
            'pi_token': token,
            'pi_username': options['username'],
            'pi_password': options['password'],
        }

        sync_log = full_sync(session)
        if sync_log.status == 'success':
            self.stdout.write(self.style.SUCCESS(sync_log.details))
        else:
            self.stderr.write(self.style.ERROR(f'Sync failed: {sync_log.details}'))
