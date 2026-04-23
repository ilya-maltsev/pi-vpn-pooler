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
- **Live allocations** — no local cache; allocation state is always read fresh from privacyIDEA
- **2FA login** — challenge-response TOTP via privacyIDEA `/validate/check` with optional strict mode (`PI_REQUIRE_OTP`)
- **Dashboard** — stats row, pool cards with subnet-grid visualisation, recent allocations, pool health
- **Subnet map** — per-pool grid, one cell per host (`gateway` in warn, `used` in accent, free in surface)
- **Cross-pool allocations view** — search, pool filter, pager
- **Sortable + filterable tables** — native (no DataTables), per-column filter inputs
- **Command palette** — `⌘K` / `Ctrl+K` / `/` opens; `g o / g p / g a / g s` jumps to screens
- **Copy-on-click** — IP / CIDR / gateway cells flash "✓ copied" on click
- **Dark + light themes** — token-based, oklch accents, persisted in localStorage
- **i18n** — Russian / English

---

## Architecture

```
Browser ──> [ pi-vpn-pooler :5000 ] ── PI REST API ──> [ reverse_proxy :8443 ] ──> [ privacyidea :8080 ]
                   │                                                                        │
              [ pools.yaml ]                                                          [ PostgreSQL ]
              pool definitions                                                  - customuserattribute
              (Docker volume)                                                   (source of truth)
```

| Component | Role |
|-----------|------|
| **pi-vpn-pooler** | Django 4.2+, manages pools and allocations |
| **pools.yaml** | YAML file with pool definitions (Docker volume, thread-safe writes) |
| **privacyIDEA** | Source of truth for custom user attributes (all allocations) |

No local database. Pool definitions are stored in a YAML file. Allocations are
always queried live from privacyIDEA — the pooler never caches allocation state.
The pooler never writes directly to the PI database. All mutations go through
the PI REST API (`POST /user/attribute`, `DELETE /user/attribute/…`).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.13, Django 4.2+ |
| Storage | YAML file (pools), signed cookies (sessions), no database |
| PI integration | `requests` library, PI REST API with JWT auth |
| Frontend | Server-side Django templates |
| WSGI server | Gunicorn (production) |
| Reverse proxy | Nginx (self-signed TLS, production) |
| CSS | Token-based design system (oklch accents, dark default + light theme), no Bootstrap / Tailwind |
| Tables | Native — server-rendered + vanilla JS for sort/filter (`static/pooler/table.js`) |
| Icons | Inline SVG sprite (`static/pooler/icons.svg`) with `<use href="#name"/>` |
| Client JS | ~1 kB each — `app.js`, `palette.js`, `table.js`, `subnet.js`, `toast.js`. No jQuery, no React. |
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
| `make secrets` | Generate random `DJANGO_SECRET_KEY` |
| `make dev` | Start development stack (gunicorn + hot-reload) |
| `make stack` | Start production stack (gunicorn + nginx SSL) |
| `make build` | Build Docker image |
| `make stop` | Stop production stack |
| `make stop-dev` | Stop development stack |
| `make logs` | Show production app logs |
| `make logs-dev` | Show development app logs |
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

### 2. Open the UI

Navigate to **http://localhost:5000** and log in with your **privacyIDEA admin
credentials** (the same username/password you use for the PI admin panel).

If the user has an enrolled TOTP token and the `challenge_response` policy is
configured, a second step will prompt for a 6-digit OTP code.

### 3. Configure privacyIDEA policies

Before the pooler can set custom attributes and use challenge-response 2FA,
PI must have the right policies. In the PI admin panel create:

**Admin policy** (for custom attributes):

| Field | Value |
|-------|-------|
| **Scope** | `admin` |
| **Action** | `set_custom_user_attributes` = `*: *` |
| **Action** | `delete_custom_user_attributes` = `*` |
| **Admin realm** | *(your admin realm)* |

This permits any attribute key with any value. You can restrict it to specific
keys (e.g. `VPN1-IP: *, VPN2-IP: *`) for tighter control.

**Authentication policy** (for challenge-response 2FA):

| Field | Value |
|-------|-------|
| **Scope** | `authentication` |
| **Action** | `challenge_response` = `totp` |
| **Action** | `otppin` = `userstore` |
| **Action** | `passOnNoToken` = `true` |

This enables the 2-step login flow: password triggers a TOTP challenge,
then the user enters the OTP code to complete authentication. Users without
an enrolled TOTP token are allowed in (unless `PI_REQUIRE_OTP=true`).

### 4. Create a pool and allocate

1. **Pools > Create Pool** — enter name (`VPN1`), CIDR (`172.20.50.0/24`),
   attribute key (`VPN1-IP`), optional gateway.
2. Open the pool detail page.
3. Select a realm, pick a user, choose an IP (or leave "Next available"),
   click **Allocate**.
4. Verify in the PI user details page that the custom attribute appeared.

---

## Production Deployment (Standalone)

The production stack runs two containers: **Django + Gunicorn** and **Nginx**
(SSL termination). No database.

```
Browser ──HTTPS──> [ nginx :5443 ] ──HTTP──> [ gunicorn :8000 ]
                   (self-signed TLS)          (3 workers)
```

### 1. Generate certificates and secrets

```bash
make cert      # creates templates/pi.pem + templates/pi.key (10-year self-signed)
make secrets   # prints random DJANGO_SECRET_KEY
```

### 2. Configure environment

Edit `environment/application-pooler.env` and replace `changeme` values:

```env
DJANGO_SECRET_KEY=<from make secrets>
PI_API_URL=https://reverse_proxy    # or your PI address
PI_REQUIRE_OTP=true                 # deny login for users without TOTP
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
`privacyidea-docker/docker-compose.yaml` (without its own nginx). See the
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

### Pool storage

| Variable | Default | Description |
|----------|---------|-------------|
| `POOLS_FILE` | `/app/data/pools.yaml` | Path to the YAML file storing pool definitions |

### privacyIDEA

| Variable | Default | Description |
|----------|---------|-------------|
| `PI_API_URL` | `https://localhost:8443` | privacyIDEA API base URL |
| `PI_VERIFY_SSL` | `false` | Verify TLS certificate of PI |
| `PI_REQUIRE_OTP` | `false` | Strict 2FA mode. When `true`, users without an enrolled TOTP token are denied login. When `false`, users without TOTP are allowed in after password authentication. |

---

## Authentication Flow

The pooler has no local user database. All authentication is delegated to
privacyIDEA using a two-step challenge-response flow via `/validate/check`.

### Step 1 — Password + challenge trigger

```
User submits username + password
  → POST /auth  →  JWT token (stored in session for PI API calls)
  → POST /validate/check { user, pass=password }
     ├─ value=true  → no TOTP enrolled → login complete (unless PI_REQUIRE_OTP=true)
     └─ transaction_id returned → TOTP challenge triggered → redirect to OTP page
```

### Step 2 — OTP verification

```
User submits 6-digit TOTP code
  → POST /validate/check { transaction_id, pass=OTP }
     ├─ value=true  → login complete → redirect to dashboard
     └─ value=false → invalid code → retry
```

The `transaction_id` ties the two requests together — PI remembers the password
validation from step 1. Step 2 sends only `transaction_id` + `pass` (the OTP),
no `user` field needed.

### Strict OTP mode (`PI_REQUIRE_OTP`)

| `PI_REQUIRE_OTP` | User has TOTP | Result |
|-------------------|---------------|--------|
| `false` (default) | No | Login allowed after password |
| `false` | Yes | Must complete OTP challenge |
| `true` | No | **Login denied** — "contact administrator" |
| `true` | Yes | Must complete OTP challenge |

### Session guard

All protected views use the `@pi_auth_required` decorator, which checks:
1. `pi_token` in session → if missing, redirect to `/login/`
2. `pi_2fa_ok` in session → if `False`, redirect to `/login/otp/`

---

## Project Structure

```
pi-vpn-pooler/
├── Makefile                        # Build/deploy targets (cert, secrets, dev, stack…)
├── manage.py
├── requirements.txt                # Django, whitenoise, requests, gunicorn, pyyaml
├── Dockerfile                      # Python 3.13 + gunicorn (production CMD)
├── docker-compose.yaml             # Production: gunicorn + nginx SSL
├── docker-compose.dev.yaml         # Development: gunicorn with --reload
├── environment/
│   └── application-pooler.env      # Standalone env template
├── templates/
│   └── nginx.conf.template         # Nginx reverse proxy config (SSL termination)
├── data/
│   └── pools.yaml                  # Pool definitions (YAML, Docker volume)
├── config/
│   ├── settings.py                 # Django settings (env-driven, no database)
│   ├── urls.py                     # Root URL config
│   └── wsgi.py                     # WSGI entrypoint
├── pooler/                         # Main Django application
│   ├── pi_client.py                # privacyIDEA REST API client (challenge-response)
│   ├── views.py                    # Function-based views (login, 2FA, pools, allocations)
│   ├── urls.py                     # URL routing (15 routes)
│   ├── pool_store.py               # YAML-backed pool storage (thread-safe, file-locked)
│   ├── pool_service.py             # Business logic (allocate, release, validation)
│   ├── live.py                     # Live allocation queries from PI (no local cache)
│   ├── ip_utils.py                 # CIDR / IP helpers
│   ├── decorators.py               # @pi_auth_required (JWT + 2FA guard)
│   ├── context_processors.py       # PI status injection (auth state, username)
│   ├── view_helpers.py             # Subnet grid / palette context builders
│   ├── models.py                   # Empty (no ORM models)
│   ├── templates/pooler/
│   │   ├── base.html               # Layout (sidebar + topbar + palette slot)
│   │   ├── _sidebar.html           # Left rail nav with section counts
│   │   ├── _topbar.html            # Crumbs, env pill, search button, lang switch, logout
│   │   ├── _palette.html           # Command-palette mount point + JSON payload
│   │   ├── _badge.html             # Badge primitive (tones: accent/ok/warn/bad)
│   │   ├── _progress.html          # Thin 3px linear bar (auto-tones on pct)
│   │   ├── _status_dot.html        # 6px status dot with soft ring
│   │   ├── _subnet_grid.html       # Subnet-map host grid (rendered client-side)
│   │   ├── _icon.html              # <use href="#name"/> wrapper for the SVG sprite
│   │   ├── login.html              # Sign-in card (username + password)
│   │   ├── login_otp.html          # OTP step (6-digit TOTP code)
│   │   ├── dashboard.html          # Overview: stats + pool cards + subnet grids
│   │   ├── pool_list.html          # Sortable + per-column filter table
│   │   ├── pool_detail.html        # Stats + subnet map + allocate form + allocations
│   │   ├── pool_form.html          # Create / edit pool
│   │   └── allocation_list.html    # Cross-pool search + pager
│   └── static/pooler/
│       ├── style.css               # Token-based design system
│       ├── icons.svg               # SVG sprite (lucide-style, 1.6 stroke)
│       ├── favicon.svg             # Favicon
│       ├── app.js                  # Sidebar toggle, g-chords, confirm modal, copy-on-click
│       ├── palette.js              # ⌘K command palette
│       ├── table.js                # Sortable headers + per-column filter
│       ├── subnet.js               # Subnet-grid cell renderer
│       └── toast.js                # Promotes Django messages to toasts
└── locale/                         # i18n translations (ru, en)
```

---

## URL Routes

| Method | Path | View | Description |
|--------|------|------|-------------|
| GET/POST | `/login/` | `login_view` | Password authentication via PI JWT |
| GET/POST | `/login/otp/` | `login_otp_view` | OTP verification (challenge-response step 2) |
| GET | `/logout/` | `logout_view` | Clear session |
| GET | `/` | `dashboard_view` | Pool overview with utilisation cards |
| GET | `/pools/` | `pool_list_view` | List all pools |
| GET/POST | `/pools/create/` | `pool_create_view` | Create a new pool |
| GET | `/pools/<id>/` | `pool_detail_view` | Pool detail + allocations + allocate form |
| GET/POST | `/pools/<id>/edit/` | `pool_edit_view` | Edit pool metadata |
| POST | `/pools/<id>/delete/` | `pool_delete_view` | Delete pool (only if empty) |
| POST | `/pools/<id>/allocate/` | `allocate_view` | Allocate IP to user |
| POST | `/pools/<id>/release/` | `release_view` | Release IP from user |
| GET | `/allocations/` | `allocation_list_view` | Cross-pool search + pager |
| GET | `/api/users/?realm=X` | `api_users` | JSON: usernames for autocomplete |
| GET | `/api/pools/<id>/free-ips/` | `api_free_ips` | JSON: free IPs in pool |

---

## How It Works

### IP Allocation Flow

```
1. Admin selects pool, realm, username, IP (or "Next available")
2. Live PI check ── query all users in realm ─── IP already used? REJECT
3. Live PI check ── user already has IP in pool? ─────────────── REJECT
4. Cross-realm PI scan ── GET /user/ for ALL realms ── IP found? REJECT
5. PI API call ── POST /user/attribute {user, realm, key, value}
6. Success ── redirect back, fresh live query confirms allocation
```

Every allocation check queries privacyIDEA live. There is no local cache to go
stale. The cross-realm scan (step 4) ensures global IP uniqueness even if
attributes were set directly in the PI admin panel.

### Pool Storage

Pools are stored in `/app/data/pools.yaml` (mounted as a Docker volume).
Writes use `fcntl.flock()` for thread safety across gunicorn workers.

```yaml
pools:
  - id: a1b2c3d4
    name: VPN1
    cidr: 172.20.50.0/24
    attr_key: VPN1-IP
    description: Main VPN pool
    gateway_ip: 172.20.50.1
    created_at: '2024-01-15T10:30:00+00:00'
```

---

## Validation Rules

| Rule | Enforcement |
|------|-------------|
| IP globally unique | Live cross-realm PI scan before every allocation |
| One IP per user per pool | Live check against current PI user attributes |
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

### "OTP is required but you have no TOTP token enrolled"

This error appears when `PI_REQUIRE_OTP=true` and the user has no TOTP token.
Either enrol a TOTP token for the user, or set `PI_REQUIRE_OTP=false`.

### "Failed to set attribute" on allocation

- Ensure the PI admin policy `set_custom_user_attributes` is configured
  (Config > Policies > create a policy with scope `admin`)
- The policy must allow the attribute key used by the pool (e.g. `VPN1-IP: *`)

### Challenge not triggered (no OTP prompt)

- Ensure the `authentication` policy is configured with `challenge_response: totp`
  and `otppin: userstore` (see [Configure privacyIDEA policies](#3-configure-privacyidea-policies))
- Ensure the user has an active, non-revoked TOTP token enrolled

### Container won't start

```bash
docker compose -f docker-compose.dev.yaml logs app
```

Common issues:
- Port 5000 already in use — change `PROXY_PORT` in the environment
- PI not reachable — check `PI_API_URL`

---

## Logging and syslog

Console logging (stdout) is always on. Remote rsyslog forwarding is opt-in via `SYSLOG_ENABLED=true` + a `SYSLOG_HOST`. Everything is configurable via the `SYSLOG_*` environment variables described in the [Django env vars](#django) table above. Defaults: transport `udp`, port `514`, level `INFO`.

### Two log tiers

| Level | What you get |
|-------|--------------|
| `INFO` (default) | One-line operational events: login success/failure, logout, OTP challenge triggered/verified, pool create/delete, IP allocate/release, PI API errors. Safe for production. |
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
make dev        # start dev stack (gunicorn with --reload on :5000)
make logs-dev   # tail logs
make stop-dev   # stop
```

### Running Django commands

All Python commands run inside Docker (never on the host):

```bash
# Or directly:
docker compose -f docker-compose.dev.yaml exec app python manage.py collectstatic --noinput
```

### Live reload

The dev compose file mounts the project directory as a volume, so code changes
are picked up automatically by gunicorn `--reload`.

### Rebuilding after dependency changes

```bash
make build
make dev
```

---

## License

AGPL-3.0-or-later (consistent with privacyIDEA).
