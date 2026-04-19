# Handoff: VPN Pooler UI Redesign

## Overview
A full visual + interaction redesign of the VPN Pooler Django app — a privacyIDEA-backed tool for managing VPN IP pools, allocating IPs to users, and syncing with privacyIDEA's user attributes.

The redesign modernizes the classic Bootstrap/DataTables admin into a dark-first network-operator console (inspired by Linear / Tailscale / Vercel), adds a subnet-map visualization as the hero view, and introduces a command palette + keyboard navigation.

## About the Design Files
The files bundled here (`prototype/index.html` and its assets) are **design references created in HTML/React** — a working prototype showing intended look, interactions, and behavior. They are **not** production code to drop into the Django app verbatim.

The task is to **recreate this prototype inside the existing Django codebase**, reusing the existing app structure:
- Django templates in `pooler/templates/pooler/`
- Static CSS in `pooler/static/pooler/style.css`
- Existing URL names, views (`pooler/views.py`), and context variables
- Existing i18n tags (`{% trans %}`), CSRF tags, etc.
- DataTables can be **replaced** by the new markup (sortable headers + filter input per column) — the new design does not depend on it, and dropping DataTables reduces JS surface.

You may introduce **Alpine.js** (or a tiny hand-rolled vanilla JS module) for the interactive bits (command palette, tweaks, subnet grid hover). Do **not** add React — the app is pure Django + jQuery today.

## Fidelity
**High-fidelity.** All colors, typography, spacing, and interactions are final. Reproduce pixel-perfect using the CSS tokens below.

## Design Tokens

All tokens live at `:root`. Light theme overrides via `body.light`.

### Colors (dark, default)
```css
--bg:    #0b0c0e;   /* page */
--bg-1:  #101215;   /* card surface */
--bg-2:  #15181c;   /* subtle fill (th bg, input bg) */
--bg-3:  #1b1f24;   /* hover / active rail */
--line:   #23272e;  /* primary border */
--line-2: #2d323a;  /* elevated border */
--fg:     #ececed;  /* primary text */
--fg-2:   #c0c3c9;  /* secondary text */
--mut:    #8a8f98;  /* muted label */
--mut-2:  #5c6068;  /* disabled / tertiary */

/* Accent — oklch, hue-configurable (default cyan 190) */
--accent-h: 190;
--accent:     oklch(0.82 0.13 var(--accent-h));
--accent-dim: oklch(0.82 0.13 var(--accent-h) / 0.18);
--accent-ink: #04121a;

/* Status — matched chroma/lightness, hue only */
--ok:   oklch(0.78 0.15 150);
--warn: oklch(0.82 0.13 80);
--bad:  oklch(0.72 0.18 25);
```

### Colors (light)
```css
--bg: #f7f7f6; --bg-1: #fff; --bg-2: #fbfbfa; --bg-3: #f1f1ef;
--line: #e6e6e3; --line-2: #d6d6d2;
--fg: #111214; --fg-2: #2a2c30; --mut: #6b6f76; --mut-2: #9ea2a9;
```

### Typography
- **Sans:** Inter (weights 400/500/600/700). Fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui`.
- **Mono:** JetBrains Mono (used for IPs, CIDRs, keycaps, timestamps, numeric stat values).
- **Base size:** 13px, line-height 1.45, antialiased.
- **Enable:** `font-feature-settings: 'ss01', 'cv11';`

| Use | Size | Weight |
|---|---|---|
| Page title (h1) | 22px | 600 |
| Card title (h3) | 13px | 600 |
| Body | 13px | 400 |
| Table cell | 12.5px | 400 |
| Table header | 10.5px uppercase letter-spacing:.07em | 500 |
| Stat value (mono) | 22px | 500 |
| Section label in sidebar | 10px uppercase letter-spacing:.09em | 500 |

### Spacing / Radius / Density
- Content padding: 24px. Max width 1400px.
- Card radius: 8px. Small radius: 5px. Badge radius: 4px.
- Table row height: 36px (comfy), 30.6px (dense, `body.dense` with `--density: 0.85`).
- Borders: 1px var(--line). No shadows except modals/palette.

### Backdrop
Graph-paper pattern behind the whole app, masked to fade:
```css
body::before {
  content: ''; position: fixed; inset: 0; z-index: 0;
  background:
    linear-gradient(to right, color-mix(in oklch, var(--line) 40%, transparent) 1px, transparent 1px) 0 0/32px 32px,
    linear-gradient(to bottom, color-mix(in oklch, var(--line) 40%, transparent) 1px, transparent 1px) 0 0/32px 32px;
  mask-image: radial-gradient(ellipse at 30% 0%, #000 0%, transparent 70%);
  pointer-events: none; opacity: 0.5;
}
```
`position: relative; z-index: 1` on `.app`.

## Global Layout

```
.app  (grid-template-columns: auto 1fr)
├── .side   (232px, collapses to 60px — persist in localStorage)
│   ├── .side-brand        (V-logo mark + "VPN Pooler" / "privacyIDEA · v2")
│   ├── .side-nav
│   │   ├── Quick search button (triggers palette)
│   │   ├── Monitor section → Overview
│   │   ├── Network section → Pools (+count), Allocations (+count), New pool
│   │   └── System section  → Sync, Collapse
│   └── .side-foot         (avatar + admin + pi.corp.local)
└── .main
    ├── .topbar   (sticky) — crumbs, env pill, search button, logout
    └── .content  — page body
```

When `body.collapsed`: hide `.side-label`, `.count`, `.kbd`, `.side-section`, `.brand-sub`, `.brand-text`, `.meta`. Show native `title="…"` tooltips on each nav item so hover reveals the label.

### Sidebar brand mark
28×28, radius 8, linear-gradient(135deg, accent → accent mixed 55% with bg). SVG: 5 circles (one filled center hub, 4 stroked corner endpoints) with 4 diagonal link lines. Adds `box-shadow: 0 0 0 1px accent@40, inset 0 1px 0 rgba(255,255,255,.2)`.

### Topbar
- Sticky, 52px min-height, 1px bottom border, blurred bg (`color-mix(bg 85%, transparent) + backdrop-filter: blur(10px)`).
- **Crumbs:** `pooler / <section> / <current>` with network icon prefix, `/` separators, current item weight 500.
- **Env pill:** rounded rectangle with pulsing green dot + `pi.corp.local` in mono. Indicates PI reachability.
- **Search button:** 260px min, `⌘K` keycap on right (use `Ctrl K` on non-Mac). Opens palette.
- **Logout:** ghost icon-only button.

## Screens

### 1. Overview (`/` → `dashboard_view`)
Hero page. Top: page title "Overview" + mono pill "{N} pools · {M} hosts". Subtitle shows "Last sync <timestamp> · <badge>".
Right: "History" button + "Sync now" primary.

**Stats row** (4 columns, 1px gap on var(--line)):
- Allocated / Capacity / Utilization (with progress bar under value) / Free.
- Each stat: uppercase label (11px, mut), large mono value (22px), small delta row underneath.

**Pools card:**
Head: "Pools" + accent/gateway/free legend dots + "+ New pool" small button.
Body: responsive grid (`minmax(340px, 1fr)`) of pool cards:
- Header row: status dot + name (600), accent badge with `attr_key` on right
- CIDR sub-label in mono (11.5px, mut)
- **SubnetGrid** — one cell per host, `aspect-ratio: 1`, 2px gap. Gateway = warn color, used = accent, free = var(--bg-3). Cap at 1024 cells for performance; show "Showing first 1,024 of N" when exceeded.
- Usage row: mono big number `used / total` + `{pct}%` right-aligned + "{free} free" under
- Thin linear progress bar (3px height, tone shifts at 60% / 85%)

**Two-up below:**
- "Recent allocations" (last 8, borderBottom rows)
- "Pool health" (one mini row per pool: dot + name + cidr | mono `used/total · pct%` → progress)

### 2. Pools list (`/pools/` → `pool_list_view`)
Header: title + total pill + filter input (with search icon) + `+ New pool` accent button.
Table columns (sortable, click header to toggle asc/desc/none):
Name (status dot + bold) · CIDR (mono) · Attribute (accent badge) · Used (num) · Free (num) · Usage (% + 90px progress) · Description · → chevron
Row is clickable → detail.
Footer: "Showing N of M pools" + pager (disabled on single page).

### 3. Pool detail (`/pools/<id>/` → `pool_detail_view`)
**Back link:** "← Pools" above title.
**Title:** status dot + pool name + mono pill with CIDR. Subtitle = description.
**Actions:** Edit (ghost), Delete (danger) — delete opens modal.

**Stats row (4):** Allocated (with progress), Free (+ "next: <ip>" delta), Utilization (+ "{total} total"), Attribute (accent badge + "gateway {ip}" delta).

**Two-up:**
- **Subnet map** card — large SubnetGrid, head shows "host .N" on hover or `used / total` default.
- **Details** card — `<dl>` with Name, CIDR (mono + copy-on-click), Attribute badge, Gateway (mono + copy), Created, Description.

**Allocate IP card:** inline form with 4 fields in a grid (auto-fit 180px): Realm (select, populated from PI), Username (text + `<datalist>` suggestions), IP address (select of free IPs, default "Next available"), Allocate button (accent, disabled until realm+user set). Head shows "next available · <ip>" right-aligned.

**Allocations table:** IP (mono + copy) · Username · Realm · Attribute · Synced · Release button (sm danger, opens confirm modal with PI-side consequence text).

### 4. Allocations list (`/allocations/` → new view, or reuse pool detail API)
Full cross-pool view. Search (IP/user/realm) + pool filter dropdown + CSV export button (can stub initially). Sortable table with same columns as pool detail allocations, plus a "Pool" column (underlined, click → detail). Pager with «, ‹, {page of pages}, ›, ». 25 per page.

### 5. Sync (`/sync/` → `sync_view`)
Title + "Sync now" accent button.
Two cards: **Last sync** (Started/Finished/Status badge/Details) and **Schedule** (Interval/Next run/Timeout/Strategy).
**History** table: Started · Finished · Duration (mono, computed `s`) · Status (ok/bad badge with dot) · Details (wraps; red text when error).

### 6. New pool (`/pools/new/` → `pool_create_view`)
Single card, 720px max. Grid-2 fields: Name | CIDR (mono). Attribute key (mono) | Gateway (mono). Description (textarea). Cancel (ghost) + "✓ Create pool" (accent, disabled until name/cidr/attr_key).

## Components

### Badge
```html
<span class="badge {tone}">{dot && <span class="dot"/>} {children}</span>
```
Tones: default, `accent`, `ok`, `warn`, `bad`. Font = mono 11px, padding 1px 7px, border + subtle bg.

### Progress
3px height, `var(--bg-3)` track, fill = accent (or warn/bad depending on pct or explicit prop). Width transitions 300ms cubic-bezier(0.3,0,0,1).

### StatusDot
6px circle with colored 3px box-shadow ring at ~18% opacity.

### SubnetGrid (the hero viz)
Inputs: `total`, `used`, `gateway` (optional), `onHover?`, `hoverIndex?`, `compact?`, `maxCells = 1024`.
- `cols = ceil(sqrt(min(total, maxCells) * (compact ? 2.5 : 3)))`
- Cell states: `.gw` (index 0 = warn), `.used` (accent), empty (free, bg-3).
- Hover adds 1.5px outline with `outline-offset: 1`.
- Implementation: seed a deterministic random set so the same input always renders the same cells — the prototype clusters used cells toward the low end for realism. In production, **use actual allocated indices** from the `Allocation.ip_address` list mapped into the CIDR.

### Command Palette (⌘K / /)
Fixed backdrop blur + centered 580px dialog. Sections: Navigate / Actions / Jump to pool. Arrow up/down to move, Enter to select, Esc to close. Footer shows kbd hints. Filter by label substring.

### Tweaks panel
Dev-only / user-preference panel, bottom-right, 260px. Theme (dark/light), Density (comfy/dense), Accent hue swatches (190/150/270/320/60). **In Django: drop or gate behind a debug flag.**

### Toasts
Bottom-right stack. Auto-dismiss ~3.8s. 3 tones. Used for: allocate success, release, sync complete, sync error.

### Modal
Centered 440px, 1px border, 10px radius. Title + description + Cancel / Confirm buttons in footer on `var(--bg-2)`. Used for delete pool + release IP.

## Interactions

- **⌘K / Ctrl+K / `/`** — open palette
- **g o / g p / g a / g s** — jump to Overview / Pools / Allocations / Sync (listen in global keydown handler; ignore when focus is in an input)
- **Sidebar collapse** — persist to `localStorage.sidebarCollapsed`
- **Route state** — persist current route in `localStorage.vp.route` (nice for iterative dev; optional in prod)
- **Click IP/CIDR in mono** — copy to clipboard, show "✓ copied" for 900ms
- **Sync button** — show spinning icon for ~1.4s, then push a new log entry + toast
- **Form validation** — disable submit until required fields filled; display server errors as error toasts (tie into Django `messages` framework)

## Django integration notes

### Templates to rewrite
- `base.html` — swap sidebar + topbar + remove DataTables CSS/JS
- `dashboard.html` — new stats row + pool cards + recent allocations + pool health
- `pool_list.html` — new sortable table
- `pool_detail.html` — stats + subnet map + details + allocate form + allocations table
- `pool_form.html` — new form card
- `sync.html` — new two-up + history

### New template partials
- `_sidebar.html`, `_topbar.html`, `_palette.html`, `_subnet_grid.html`
- `_badge.html`, `_progress.html`, `_status_dot.html`

### View/context additions
- `dashboard_view` should include per-pool allocation counts, last sync, and a serialized `used_indices` array per pool for the subnet grid.
- Add `/api/subnet/<pool_id>/` endpoint returning `{total, gateway_idx, used_indices}` if you prefer lazy-load.

### JS (vanilla or Alpine)
- `static/pooler/palette.js` — keyboard + overlay
- `static/pooler/table.js` — sortable header + inline filter (replaces DataTables)
- `static/pooler/subnet.js` — render grid from `data-total / data-used-idx` attrs
- `static/pooler/toast.js` — render `django.messages` as bottom-right toasts

Drop `jquery-3.7.1.min.js`, `datatables/*`, `font-awesome/*`. Use inline SVG icons (see prototype's `icons.jsx`) or lucide-static.

## Assets to copy over
- The SVG icon set from `prototype/src/icons.jsx` (16px, 1.6 stroke width) — port each to a `<symbol>` in a single `icons.svg` sprite and `<use href="#name"/>` in templates.
- The brand mark SVG from the sidebar (5 circles + 4 lines).

## Files bundled
- `prototype/index.html` — self-contained working React prototype (reference only). Open in any browser to inspect states.
- `prototype/styles.css`, `prototype/bundle.jsx`, `prototype/src/*` — the source of the prototype, for reference. You do not port these as-is.
- `README.md` — this file.

## Out of scope
- Login screen redesign (existing one is functional; optional follow-up)
- Mobile layout below 900px (the admin is desktop-first)
- Tweaks panel (dev affordance only)
