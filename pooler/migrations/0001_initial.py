from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='VpnPool',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('cidr', models.CharField(max_length=43)),
                ('description', models.TextField(blank=True, default='')),
                ('attr_key', models.CharField(max_length=255, unique=True)),
                ('gateway_ip', models.GenericIPAddressField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='SyncLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('started_at', models.DateTimeField(auto_now_add=True)),
                ('finished_at', models.DateTimeField(blank=True, null=True)),
                ('status', models.CharField(default='running', max_length=20)),
                ('details', models.TextField(blank=True, default='')),
            ],
            options={
                'ordering': ['-started_at'],
            },
        ),
        migrations.CreateModel(
            name='Allocation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ip_address', models.GenericIPAddressField(unique=True)),
                ('username', models.CharField(max_length=320)),
                ('realm', models.CharField(max_length=120)),
                ('attr_key', models.CharField(max_length=255)),
                ('synced_at', models.DateTimeField(auto_now=True)),
                ('pool', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='allocations', to='pooler.vpnpool')),
            ],
            options={
                'ordering': ['ip_address'],
            },
        ),
        migrations.AddConstraint(
            model_name='allocation',
            constraint=models.UniqueConstraint(fields=('pool', 'username', 'realm'), name='one_ip_per_user_per_pool'),
        ),
    ]
