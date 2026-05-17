# AGENTS.md

Read this first if you're an AI agent working on this repo. It tells you what GHOSTD is, how it's wired, the rules, and the gotchas.

## What this is

GHOSTD is a web frontend for the CRP Exchange (`https://crp.is:8182`). It's a standalone Vite + React 18 + TypeScript app. The backend is an Express API server hosted on Replit at `https://<replit-deployment>/api/*` — **this repo does not contain the backend**. The frontend talks to that API cross-origin with cookies.

- **Live (custom domain)**: https://ghostd.khurk.xyz
- **Live (fallback)**: https://skulls206-creator.github.io/ghostd/
- **Backend repo**: the Replit monorepo (private). The Express server is at `artifacts/api-server` over there.
- **Brand**: GHOSTD — styled as Ghost**D**, where the D is the teal/cyan primary colour.
- **User account on CRP**: `VisiblyGone`. Don't hard-code it.

## Stack

- Vite 5 (build), React 18, TypeScript 5.9
- Wouter for routing (basename = `import.meta.env.BASE_URL.replace(/\/$/, "")`)
- TanStack Query for server state
- Radix primitives + Tailwind v4 for UI
- Framer Motion, Recharts, Lucide, Sonner, qrcode.react
- pnpm for installs; lockfile is `pnpm-lock.yaml`
- Node 24 in CI

## Layout

```
src/
  api/                Generated Orval client (React Query hooks) + custom-fetch
  api/zod/            Generated Zod schemas
  components/         Radix-based primitives + app components
  hooks/              useNotifications, usePriceAlerts, useOrderFillMonitor, etc.
  lib/
    apiFetch.ts       Wraps fetch with VITE_API_BASE_URL + credentials:"include"
    utils.ts          cn(), formatters
  pages/              Login, Dashboard, Markets, Trade, Orders, Wallet, History, Settings
  App.tsx             Router + global query client
  main.tsx            Entry; registers /sw.js
public/
  CNAME               ghostd.khurk.xyz
  404.html            SPA fallback (sessionStorage hand-off into index.html)
  sw.js               Service worker (background ticker polling, notifications)
  icon-192.png        PWA icon
index.html            SPA restore script at the top, then <div id="root">
vite.config.ts        base = VITE_BASE ?? "/", alias @ -> src/
.github/workflows/
  deploy.yml          pnpm install -> vite build -> deploy-pages
```

## How API calls work

**All API requests must go through `apiFetch` or the generated React Query hooks. Never call raw `fetch("/api/...")`.**

- `src/lib/apiFetch.ts` prepends `import.meta.env.VITE_API_BASE_URL` and sets `credentials: "include"`.
- `src/api/custom-fetch.ts` (the Orval-generated client's fetcher) does the same prefixing + credentials for hook-driven requests.
- At build time, `VITE_API_BASE_URL` is injected from the **GitHub Actions repo variable** of the same name (Settings → Secrets and variables → Actions → Variables).
- At runtime, every `/api/*` URL resolves to `${VITE_API_BASE_URL}/api/*`.
- Cookies (the `crp_session` cookie) only flow because the backend sends `Access-Control-Allow-Credentials: true` and an exact `Access-Control-Allow-Origin` matching this origin. The backend's `ALLOWED_ORIGINS` env var must include `https://ghostd.khurk.xyz` and `https://skulls206-creator.github.io`.

**If you add a new fetch call, use `apiFetch` and pass a path starting with `/api/...`. Do not hard-code the base URL.**

## Build, dev, deploy

- `pnpm install --frozen-lockfile`
- `pnpm dev` — local Vite dev server. Set `VITE_API_BASE_URL` in a `.env.local` pointing at the running backend.
- `pnpm build` — runs `vite build` only. **Do not add `tsc --noEmit` to the build script.** See "Known TS errors" below.
- `pnpm preview` — local preview of the built output.
- Deployment is automated: any push to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages. The `CNAME` file in `public/` survives the build and keeps the custom domain attached.

## Env vars

| Var | Where | What |
|---|---|---|
| `VITE_API_BASE_URL` | GitHub Actions Variables + local `.env.local` | Full backend origin, e.g. `https://abc-123.spock.replit.dev`. **No trailing slash.** Embedded in client bundle at build time (public — do not put secrets here). |
| `VITE_BASE` | GitHub Actions Variables | Vite `base`. `/` for custom domain, `/ghostd/` for github.io subpath. Defaults to `/`. |

When the backend moves to a `*.replit.app` production URL, update `VITE_API_BASE_URL` in repo Variables and re-run the workflow.

## CRP API contract (backend proxies these)

| Endpoint | Method | Notes |
|---|---|---|
| `/api/auth/login` | POST | `{ key, pw, pin? }` → sets `crp_session` cookie |
| `/api/auth/logout` | POST | clears session |
| `/api/auth/me` | GET | current user |
| `/api/balance` | GET | `[{ currency_id, name, value, locked }]` |
| `/api/market/ticker` | GET | `{ [pair]: { lastPrice, open, high, low, volume, bid, ask } }` |
| `/api/market/pairs` | GET | trading pairs |
| `/api/market/panel?pair=...` | GET | order book `{ asks, bids }` |
| `/api/market/price-history?pair=...&days=...` | GET | OHLCV (Kraken for major pairs, CRP trades fallback) |
| `/api/orders` | GET / POST | list / place orders |
| `/api/orders/:id/cancel` | POST | cancel |
| `/api/orders/history` | GET | filled/cancelled orders |
| `/api/history/trade` | GET | transactions |
| `/api/wallet/address/new` | POST | deposit address |
| `/api/wallet/withdraw` | POST | submit withdrawal |
| `/api/wallet/withdraw/check?id=...` | GET | poll withdrawal status |

**Currency IDs**: 12=CRP, 14=USDT, 16=DAI, 17=UUSD, 18=XMR, 19=BTC.

## Conventions

- TypeScript strict mode. Keep it strict.
- Components use Tailwind utility classes + the project's Radix-based primitives in `src/components/ui/`. Match the existing style.
- "Obsidian Terminal" design system: near-black `#0b0b0f` background, teal/cyan primary `#06B6D4`, Space Grotesk for UI, JetBrains Mono for numbers/prices, 36px table rows, 32px buttons, 28px order book rows.
- Trade page panel order: `["entry", "book", "trades"]` (entry on the LEFT). Enforced via localStorage version key `crp_trade_panel_order_v = "2"`. If you change the default, bump the version.
- Don't add console.logs to production code paths.
- Don't add abstraction layers without a clear second consumer.
- Surgical changes only — touch what the task requires.

## Known gotchas

1. **Codegen TS errors**: The generated Orval client has a small number of unused/missing imports (`useGetBalance`, `useGetTicker`, `useGetMe` in some signature variants). These are pre-existing debt from the source OpenAPI spec. The build script intentionally runs `vite build` only (no `tsc --noEmit`) so these don't gate CI. **Fix path**: regenerate the client from the updated OpenAPI spec in the backend repo, not by patching the generated files here.
2. **Cross-origin cookies**: If login appears to succeed but subsequent requests come back 401, the most likely cause is missing `credentials: "include"` on a new fetch call. Always use `apiFetch`.
3. **Service worker scope**: `src/main.tsx` registers `/sw.js` with `scope: "/"`. This works on the custom domain (served from root) but is wrong on the github.io subpath. The github.io URL is a fallback — the SW just won't activate there, which is fine.
4. **SPA deep links**: `public/404.html` does the sessionStorage hand-off. Don't remove it or deep links like `/trade/crp_usdt` will 404 from Pages.
5. **PWA icons**: Only `/icon-192.png` exists. Don't reference `/pwa-192x192.png` or `/pwa-64x64.png` — those files don't exist in `public/`.
6. **CNAME**: `public/CNAME` controls the custom domain. If you remove it, GitHub Pages will drop the custom domain on next deploy.
7. **Session persistence**: The backend stores sessions in-memory. A backend restart logs everyone out. This is a backend issue, not a frontend one — but be aware when testing.

## Required: log your changes

When you finish a meaningful change to this repo, add an entry to `CHANGES.md` so the next agent (or human) knows what you did and why. See the top of that file for the format. Keep entries short.
