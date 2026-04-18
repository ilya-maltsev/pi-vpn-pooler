# pi-vpn-pooler

VPN IP Pool Manager for [privacyIDEA](https://www.privacyidea.org/).

Standalone Django application that manages VPN IP address pools and allocates
addresses to users via privacyIDEA custom user attributes. Runs as a separate
Docker service alongside the privacyIDEA stack — **does not modify the
privacyIDEA codebase**.

---

## Features

- **Pool management** — define VPN pools by name and CIDR subnet (e.g. `172.20.50.0/24`)
- **IP allocation** — assign a free IP from a pool to a privacyIDEA user
- **Global uniqueness** — no two users can hold the same IP address across *any* pool
- **Multiple addresses** — a user can have IPs from different pools (e.g. `VPN1-IP`, `VPN2-IP`)
- **Release** — free an IP and remove the custom attribute from privacyIDEA
- **Sync** — rebuild local allocation cache from the actual privacyIDEA state
- **Dashboard** — pool utilisation cards with progress bars
- **DataTables** — sortable, filterable allocation tables
- **User autocomplete** — realm-aware username lookup via PI API
- **i18n** — Russian / English

---

## Architecture

```
Browser ──> [ pi-vpn-pooler :5000 ] ── PI REST API ──> [ reverse_proxy :8443 ] ──> [ privacyidea :8080 ]
                   │                                                                        │
              [ PostgreSQL ]                                                           [ MariaDB ]
              - vpn_pool                                                     - customuserattribute
              - allocation
              - sync_log
```

| Component | Role |
|-----------|------|
| **pi-vpn-pooler** | Django 4.2+, manages pools and allocations |
| **PostgreSQL 16** | Stores pool definitions and allocation cache |
| **privacyIDEA** | Source of truth for custom user attributes |

The pooler never writes directly to the PI database.  All mutations go through
the PI REST API (`POST /user/attribute`, `DELETE /user/attribute/…`).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.13, Django 4.2+ |
| Database | PostgreSQL 16 |
| PI integration | `requests` library, PI REST API with JWT auth |
| Frontend | Server-side Jinja2-style Django templates |
| WSGI server | Gunicorn (production) |
| Reverse proxy | Nginx 1.27 with self-signed TLS (production) |
| CSS | Custom framework (CSS variables, no Bootstrap) |
| Tables | jQuery 3.7 + DataTables (per-column filtering) |
| Icons | Font Awesome 4 |
| Static files | WhiteNoise (dev), Nginx (production) |
| Containerisation | Docker, Docker Compose |
| Build tool | GNU Make |

---

## Makefile Commands

All operations are available via `make`:

```bash
make help         # Show all available targets
```

| Target | Description |
|--------|-------------|
| `make cert` | Generate self-signed SSL certificates (10 years) |
| `make secrets` | Generate random `DJANGO_SECRET_KEY` and `DB_PASSWORD` |
| `make dev` | Start development stack (runserver + hot-reload) |
| `make stack` | Start production stack (gunicorn + nginx SSL) |
| `make build` | Build Docker image |
| `make stop` | Stop production stack |
| `make stop-dev` | Stop development stack |
| `make logs` | Show production app logs |
| `make logs-dev` | Show development app logs |
| `make shell` | Open Django shell in dev container |
| `make migrate` | Run migrations in dev container |
| `make clean` | Stop and remove all containers (preserves volumes) |
| `make distclean` | Remove containers **and** volumes (data loss!) |

---

## Quick Start (Development)

### Prerequisites

- Docker Engine 24+ and Docker Compose v2
- A running privacyIDEA instance (the default Docker stack on port 8443)

### 1. Clone and start

```bash
cd privacyidea-docker/pi-vpn-pooler

make dev
# or manually:
# docker compose -f docker-compose.dev.yaml up -d
```

This starts two containers:

| Service | Port | Description |
|---------|------|-------------|
| `app`   | `localhost:5000` | Django dev server (auto-reload) |
| `db`    | `localhost:5433` | PostgreSQL 16 |

Migrations run automatically on startup.

### 2. Open the UI

Navigate to **http://localhost:5000** and log in with your **privacyIDEA admin
credentials** (the same username/password you use for the PI admin panel).

### 3. Configure privacyIDEA policies

Before the pooler can set custom attributes, PI must allow it.  In the PI admin
panel create a policy:

| Field | Value |
|-------|-------|
| **Scope** | `admin` |
| **Action** | `set_custom_user_attributes` = `*: *` |
| **Action** | `delete_custom_user_attributes` = `*` |
| **Admin realm** | *(your admin realm)* |

This permits any attribute key with any value.  You can restrict it to specific
keys (e.g. `VPN1-IP: *, VPN2-IP: *`) for tighter control.

### 4. Create a pool and allocate

1. **Pools > Create Pool** — enter name (`VPN1`), CIDR (`172.20.50.0/24`),
   attribute key (`VPN1-IP`), optional gateway.
2. Open the pool detail page.
3. Select a realm, pick a user, choose an IP (or leave "Next available"),
   click **Allocate**.
4. Verify in the PI user details page that the custom attribute appeared.

---

## Production Deployment (Standalone)

The production stack runs three containers: **PostgreSQL**, **Django + Gunicorn**,
and **Nginx** (SSL termination).

```
Browser ──HTTPS──> [ nginx :5443 ] ──HTTP──> [ gunicorn :8000 ] ──> [ PostgreSQL ]
                   (self-signed TLS)          (3 workers)
```

### 1. Generate certificates and secrets

```bash
make cert      # creates templates/pi.pem + templates/pi.key (10-year self-signed)
make secrets   # prints random DJANGO_SECRET_KEY and DB_PASSWORD
```

### 2. Configure environment

Edit `environment/application-prod.env` and replace `changeme` values with the
generated secrets:

```env
DJANGO_SECRET_KEY=<from make secrets>
DB_PASSWORD=<from make secrets>
PI_API_URL=https://reverse_proxy    # or your PI address
PROXY_PORT=5443                     # external HTTPS port
SERVERNAME=vpn-pooler.example.com   # for nginx server_name
CSRF_TRUSTED_ORIGINS=https://vpn-pooler.example.com
```

### 3. Start the stack

```bash
make stack
```

Navigate to **https://localhost:5443** and log in with PI admin credentials.

### 4. Stop / clean

```bash
make stop       # stop containers
make clean      # stop + remove containers (keeps data)
make distclean  # remove containers + volumes (confirmation required)
```

### Alternative: embed in the main PI stack

You can also add the pooler as a service in the main
`privacyidea-docker/docker-compose.yaml` (without its own nginx).  See the
`docker-compose.yaml` in this directory for the service definitions to copy.

---

## Environment Variables

### Django

| Variable | Default | Description |
|----------|---------|-------------|
| `DJANGO_SECRET_KEY` | insecure dev key | Session signing key (change in production!) |
| `DJANGO_DEBUG` | `true` | Debug mode |
| `DJANGO_ALLOWED_HOSTS` | `*` | Comma-separated allowed hostnames |
| `CSRF_TRUSTED_ORIGINS` | `http://localhost:*` | Comma-separated trusted origins for CSRF |
| `DJANGO_LOG_LEVEL` | `INFO` | Logging level for `pooler` logger |
| `SYSLOG_ENABLED` | `false` | Enable remote syslog forwarding from Django. When `false`, logs only go to stdout / container logs. |
| `SYSLOG_HOST` | (empty) | Remote rsyslog host. Required when `SYSLOG_ENABLED=true`. |
| `SYSLOG_PORT` | `514` | Remote rsyslog port |
| `SYSLOG_PROTO` | `udp` | Transport for remote rsyslog: `udp` or `tcp` |
| `SYSLOG_FACILITY` | `local0` | Syslog facility |
| `SYSLOG_TAG` | `pi-vpn-pooler` | Syslog program name / ident |
| `SYSLOG_LEVEL` | `INFO` | Minimum level forwarded: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`. Set to `DEBUG` to capture full HTTP request/response packets against the privacyIDEA API. |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_NAME` | `vpn_pooler` | PostgreSQL database name |
| `DB_USER` | `vpn_pooler` | PostgreSQL user |
| `DB_PASSWORD` | `vpn_pooler` | PostgreSQL password |
| `DB_HOST` | `127.0.0.1` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |

### privacyIDEA

| Variable | Default | Description |
|----------|---------|-------------|
| `PI_API_URL` | `https://localhost:8443` | privacyIDEA API base URL |
| `PI_VERIFY_SSL` | `false` | Verify TLS certificate of PI |

---

## Project Structure

```
pi-vpn-pooler/
├── Makefile                        # Build/deploy targets (cert, secrets, dev, stack…)
├── manage.py
├── requirements.txt                # Django, psycopg2, whitenoise, requests, gunicorn
├── Dockerfile                      # Python 3.13 + gunicorn (production CMD)
├── docker-compose.yaml             # Production: postgres + gunicorn + nginx SSL
├── docker-compose.dev.yaml         # Development: postgres + runserver (hot-reload)
├── environment/
│   └── application-prod.env        # Production env template
├── templates/
│   ├── nginx.conf.template         # Nginx reverse proxy config (SSL termination)
│   ├── pi.pem                      # Generated certificate (gitignored)
│   └── pi.key                      # Generated private key (gitignored)
├── config/
│   ├── settings.py                 # Django settings (env-driven)
│   ├── urls.py                     # Root URL config
│   └── wsgi.py                     # WSGI entrypoint
├── pooler/                         # Main Django application
│   ├── models.py                   # VpnPool, Allocation, SyncLog
│   ├── views.py                    # Function-based views
│   ├── urls.py                     # URL routing (14 routes)
│   ├── pi_client.py                # privacyIDEA REST API client
│   ├── pool_service.py             # Business logic
│   ├── ip_utils.py                 # CIDR / IP helpers
│   ├── decorators.py               # @pi_auth_required
│   ├── context_processors.py       # PI status injection
│   ├── management/commands/
│   │   └── sync_pools.py           # CLI sync command
│   ├── migrations/
│   │   └── 0001_initial.py
│   ├── templates/pooler/
│   │   ├── base.html               # Layout (sidebar + topbar)
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── pool_list.html
│   │   ├── pool_detail.html        # Allocations + allocate form
│   │   ├── pool_form.html          # Create / edit pool
│   │   └── sync.html               # Sync history
│   └── static/pooler/
│       ├── style.css               # Custom CSS (CSS variables)
│       └── vendor/                 # jQuery, DataTables, Font Awesome
└── locale/                         # i18n translations (ru, en)
```

---

## Data Model

### VpnPool

| Field | Type | Description |
|-------|------|-------------|
| `name` | `CharField(unique)` | Pool name, e.g. `VPN1` |
| `cidr` | `CharField` | Network in CIDR notation, e.g. `172.20.50.0/24` |
| `attr_key` | `CharField(unique)` | Custom attribute key in PI, e.g. `VPN1-IP` |
| `gateway_ip` | `GenericIPAddressField` | Optional gateway (excluded from allocation) |
| `description` | `TextField` | Free-text description |

### Allocation

| Field | Type | Description |
|-------|------|-------------|
| `pool` | `ForeignKey(VpnPool)` | Parent pool |
| `ip_address` | `GenericIPAddressField(unique)` | **Globally unique** IP address |
| `username` | `CharField` | PI username |
| `realm` | `CharField` | PI realm |
| `attr_key` | `CharField` | Attribute key used in PI |

**Constraints:**
- `ip_address` is globally unique — no IP can be assigned to two users even across different pools
- `(pool, username, realm)` is unique — one IP per user per pool

### SyncLog

Tracks sync operations with timestamps, status (`running` / `success` / `error`),
and details.

---

## URL Routes

| Method | Path | View | Description |
|--------|------|------|-------------|
| GET | `/` | `dashboard_view` | Pool overview with utilisation cards |
| GET/POST | `/login/` | `login_view` | Authenticate via PI JWT |
| GET | `/logout/` | `logout_view` | Clear session |
| GET | `/pools/` | `pool_list_view` | List all pools (DataTable) |
| GET/POST | `/pools/create/` | `pool_create_view` | Create a new pool |
| GET | `/pools/<id>/` | `pool_detail_view` | Pool detail + allocations + allocate form |
| GET/POST | `/pools/<id>/edit/` | `pool_edit_view` | Edit pool metadata |
| POST | `/pools/<id>/delete/` | `pool_delete_view` | Delete pool (only if empty) |
| POST | `/pools/<id>/allocate/` | `allocate_view` | Allocate IP to user |
| POST | `/pools/<id>/release/<ip>/` | `release_view` | Release IP from user |
| GET/POST | `/sync/` | `sync_view` | Sync history / trigger sync |
| GET | `/api/users/?realm=X` | `api_users` | JSON: usernames for autocomplete |
| GET | `/api/pools/<id>/free-ips/` | `api_free_ips` | JSON: free IPs in pool |

---

## How It Works

### Authentication

The pooler has no local user database.  Login credentials are forwarded to
privacyIDEA's `POST /auth` endpoint to obtain a JWT token.  The token is stored
in the Django session and used for all subsequent PI API calls.  When the JWT
expires, the user is redirected back to the login page.

### IP Allocation Flow

```
1. Admin selects pool, realm, username, IP (or "Next available")
2. Local check  ─── Allocation.objects.filter(ip_address=ip) ── taken? REJECT
3. Local check  ─── Allocation per user per pool ────────────── exists? REJECT
4. Fresh PI check ── GET /user/?realm=* ── scan ALL custom attrs ── found? REJECT
5. PI API call  ─── POST /user/attribute {user, realm, key, value}
6. Success      ─── Create local Allocation record
```

The double-check (local cache + fresh PI scan) prevents race conditions and
catches attributes set directly in the PI admin panel.

### Sync

Sync rebuilds the local `Allocation` table from the actual PI state:

1. Fetch all realms from PI (`GET /realm/`)
2. For each realm, fetch all users with custom attributes (`GET /user/?realm=X`)
3. For each user attribute that matches a known pool's `attr_key` and contains
   a valid IP within the pool's CIDR — create an `Allocation` record
4. Remove stale entries that no longer exist in PI

Sync can be triggered:
- **UI** — "Sync Now" button on the dashboard or sync page
- **CLI** — `python manage.py sync_pools --username admin --password secret`

---

## Management Commands

### sync_pools

Sync allocations from privacyIDEA (useful for cron jobs):

```bash
docker compose -f docker-compose.dev.yaml exec app \
  python manage.py sync_pools --username admin --password admin
```

---

## Validation Rules

| Rule | Enforcement |
|------|-------------|
| IP globally unique | `Allocation.ip_address` has `unique=True` + fresh PI scan before allocation |
| One IP per user per pool | `UniqueConstraint(pool, username, realm)` |
| CIDR overlap prevention | `ipaddress.ip_network.overlaps()` checked on pool creation |
| Network/broadcast excluded | `ipaddress.ip_network.hosts()` skips them automatically |
| Gateway excluded | Removed from free IP list if configured |
| Subnet size limit | `/16` maximum (65534 hosts) to prevent accidental huge pools |
| PI policy required | Allocation fails with clear error if `set_custom_user_attributes` policy is missing |

---

## Troubleshooting

### "Authentication failed" on login

- Verify PI is running: `curl -k https://localhost:8443/healthz/`
- Check `PI_API_URL` env var points to the correct address
- From inside Docker network, PI is reached via `https://reverse_proxy`
- From the host, PI is reached via `https://localhost:8443`

### "Failed to set attribute" on allocation

- Ensure the PI admin policy `set_custom_user_attributes` is configured
  (Config > Policies > create a policy with scope `admin`)
- The policy must allow the attribute key used by the pool (e.g. `VPN1-IP: *`)

### Allocations out of sync

Click **Sync Now** on the dashboard, or run:

```bash
docker compose -f docker-compose.dev.yaml exec app \
  python manage.py sync_pools --username admin --password admin
```

### Container won't start

```bash
docker compose -f docker-compose.dev.yaml logs app
docker compose -f docker-compose.dev.yaml logs db
```

Common issues:
- PostgreSQL not ready yet (the healthcheck handles this, but first start takes ~10s)
- Port 5000 already in use — change `VPN_POOLER_PORT` in the environment

---

## Logging and syslog

Console logging (stdout) is always on. Remote rsyslog forwarding is opt-in via `SYSLOG_ENABLED=true` + a `SYSLOG_HOST`. Everything is configurable via the `SYSLOG_*` environment variables described in the [Django env vars](#django) table above. Defaults: transport `udp`, port `514`, level `INFO`.

### Two log tiers

| Level | What you get |
|-------|--------------|
| `INFO` (default) | One-line operational events: login success/failure, logout, pool create/delete, IP allocate/release, sync start/complete, PI API errors. Safe for production. |
| `DEBUG` | Everything at INFO, plus full HTTP request/response packet dumps for every privacyIDEA API call (see below). Verbose — intended for troubleshooting. |

### Full-packet DEBUG dumps

With `SYSLOG_LEVEL=DEBUG` (or `DJANGO_DEBUG=true`), the `PIClient` logs full-packet dumps for every call to the privacyIDEA API:

| Log prefix | Source | When |
|------------|--------|------|
| `PI HTTP >>> <method> <url> headers=… params=… body=…` | Outbound HTTP request | Before `requests.request()` |
| `PI HTTP <<< <status> <reason> headers=… body=…` | Inbound HTTP response | After `requests.request()` |

### Secret redaction (always on)

Packet dumps are **redacted by default** — this is not a toggle. The `PIClient` strips values of any attribute, header, URL param, or JSON field whose name (case-insensitive) contains:

`password`, `pass`, `authorization`, `cookie`, `token`, `secret`, `pi-authorization`

Matched values are replaced with `***` before the message is emitted. JSON response bodies are parsed and redacted recursively; bodies that fail to parse are logged verbatim.

### Quick test

Start a UDP listener on the host and configure the env:

```
nc -u -l 1514
```

```env
SYSLOG_ENABLED=true
SYSLOG_HOST=host.docker.internal
SYSLOG_PORT=1514
SYSLOG_LEVEL=DEBUG
```

---

## Development

### Starting the dev environment

```bash
make dev        # start dev stack (postgres + runserver on :5000)
make logs-dev   # tail logs
make stop-dev   # stop
```

### Running Django commands

All Python commands run inside Docker (never on the host):

```bash
make shell      # Django shell
make migrate    # Apply migrations

# Or directly:
docker compose -f docker-compose.dev.yaml exec app python manage.py makemigrations
docker compose -f docker-compose.dev.yaml exec app python manage.py collectstatic --noinput
```

### Live reload

The dev compose file mounts the project directory as a volume (`.:/app`), so
code changes are picked up automatically by the Django dev server.

### Rebuilding after dependency changes

```bash
make build
make dev
```

---

## License

AGPL-3.0-or-later (consistent with privacyIDEA).
