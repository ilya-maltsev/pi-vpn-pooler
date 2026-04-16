from django.db import models


class VpnPool(models.Model):
    name = models.CharField(max_length=100, unique=True)
    cidr = models.CharField(max_length=43)
    description = models.TextField(blank=True, default='')
    attr_key = models.CharField(max_length=255, unique=True)
    gateway_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.cidr})"


class Allocation(models.Model):
    pool = models.ForeignKey(VpnPool, on_delete=models.CASCADE, related_name='allocations')
    ip_address = models.GenericIPAddressField(unique=True)
    username = models.CharField(max_length=320)
    realm = models.CharField(max_length=120)
    attr_key = models.CharField(max_length=255)
    synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['ip_address']
        constraints = [
            models.UniqueConstraint(
                fields=['pool', 'username', 'realm'],
                name='one_ip_per_user_per_pool',
            ),
        ]

    def __str__(self):
        return f"{self.ip_address} -> {self.username}@{self.realm}"


class SyncLog(models.Model):
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='running')
    details = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"Sync {self.started_at:%Y-%m-%d %H:%M} — {self.status}"
