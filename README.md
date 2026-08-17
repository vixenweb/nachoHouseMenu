# Nacho House — Digital Menu

A fully responsive, RTL Persian digital menu for a café/restaurant, with a built-in admin panel
that lets the owner update prices from their phone — with **zero backend, zero hosting cost, and
no dedicated domain.**


## Stack

- **HTML5 / CSS3** — custom-property design tokens, RTL layout, `Rye` + `Lalezar` + `Vazirmatn`
  Google Fonts pairing to match the café's print-menu branding
- **Vanilla JavaScript** (no frameworks/build step) — `IntersectionObserver` for scroll-reveal
  animation, `fetch` for data loading
- **GitHub Pages** — static hosting, auto-deploys on every push to `main`
- **GitHub REST API as the backend** — the admin panel authenticates with a repo-scoped
  fine-grained Personal Access Token and commits updated prices straight to `prices.json` via the
  Contents API (`GET`/`PUT` with base64-encoded, UTF-8-safe content). GitHub enforces the
  authentication server-side — there's no custom auth server to build, host, or secure.
- **JSON as the data layer** — `prices.json` decouples pricing from markup; the public pages and
  the admin panel both read/write the same single source of truth.

## How it works

1. Menu pages (`Appetizers.html`, `burger.html`, ...) render item names/descriptions statically, then fetch
   `prices.json` client-side and fill in the prices.
2. `admin/` is a plain static page — no server-side auth is possible on GitHub Pages, so instead of
   building a fake client-side login, it uses a real GitHub Personal Access Token as the
   credential. The token is checked by GitHub itself on every read/write.
3. Saving in the admin panel = one authenticated `PUT` to the GitHub Contents API → a real git
   commit → GitHub Pages redeploys automatically (~1 minute) → live prices update.

## Highlights

- 100% static, $0/month, no domain required
- Real, server-enforced authentication without running any server
- Region-resilient: only depends on domains (`github.com`, `api.github.com`) known to be reachable
  for the target users
- Scroll-triggered reveal animations and micro-interactions built with plain CSS + JS, no animation
  libraries

---
**Live site:** https://vixenweb.github.io/nachoHouseMenu/