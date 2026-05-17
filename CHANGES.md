# CHANGES.md

Append-only log of meaningful changes made by agents (AI or human) working on this repo. Newest entries at the top. Keep entries short — a few bullets each. If you change behaviour, dependencies, env vars, or the API contract, log it here.

## Format

```
## YYYY-MM-DD — <one-line summary>
- **Who**: <agent name or human handle>
- **Why**: <one sentence on the trigger / goal>
- **What changed**:
  - <file or area>: <what>
  - <file or area>: <what>
- **Migration / follow-up** (if any): <what the next agent needs to know>
```

Only log things future agents need to know. Skip pure-noise commits (typo fixes, formatting passes, lockfile bumps).

---

## 2026-05-16 — Backend cookie fix for cross-origin login
  - **Who**: Replit Agent (main, working in the backend repo)
  - **Why**: Login from https://ghostd.khurk.xyz appeared to succeed but every subsequent authenticated request returned 401. Browsers were dropping the session cookie because it was being set with `SameSite=Lax; Secure=false` whenever `NODE_ENV !== "production"`, which is the case for the API server running as a Replit dev workflow.
  - **What changed** (in the **backend** repo, `artifacts/api-server/src/routes/auth.ts`):
    - `COOKIE_OPTS` now always uses `secure: true, sameSite: "none"`. Removed the `isProd` branch. The frontend is always cross-origin and the API is always served over HTTPS.
    - `/api/auth/logout` `clearCookie` updated to match.
  - **Frontend impact**: none. No changes in this repo. Just hard-reload the page if you're testing — old `SameSite=Lax` cookies in the browser need to clear first.
  - **Migration / follow-up**: if you ever run the API on plain `http://localhost` for development, this change will break cookies there (browsers reject `Secure` on non-HTTPS). Use the Replit dev domain instead — it's HTTPS.

  
## 2026-05-16 — Initial migration from Replit monorepo
- **Who**: Replit Agent (main)
- **Why**: Move the GHOSTD frontend out of the Replit monorepo (`artifacts/crp-exchange`) into a standalone GitHub repo so other agents can contribute via PRs without touching backend infrastructure.
- **What changed**:
  - Inlined `@workspace/api-client-react` (generated Orval client) into `src/api/`. All `@workspace/api-client-react` imports rewritten to `@/api`.
  - Inlined `@workspace/api-zod` schemas into `src/api/zod/`.
  - Added `src/lib/apiFetch.ts` — wraps fetch with `VITE_API_BASE_URL` prefix + `credentials: "include"`.
  - Patched `src/api/custom-fetch.ts` to do the same prefixing + credentials for hook-driven requests.
  - Rewrote all raw `fetch("/api/...")` calls in `App.tsx`, `Wallet.tsx`, `Trade.tsx`, `Dashboard.tsx`, `History.tsx`, `useOrderFillMonitor.ts` to use `apiFetch`.
  - Cleaned `vite.config.ts`: removed Replit-only plugins, `PORT`/`BASE_PATH` env requirements; added `base: VITE_BASE ?? "/"`.
  - New `package.json` with concrete versions (no `catalog:` or `workspace:*` refs); dropped `@replit/vite-plugin-*` deps.
  - `public/CNAME` = `ghostd.khurk.xyz`. `public/404.html` SPA fallback. SPA restore script in `index.html`.
  - Renamed broken PWA icon refs `/pwa-192x192.png` and `/pwa-64x64.png` → `/icon-192.png` (the file that actually exists).
  - `.github/workflows/deploy.yml`: pnpm install → `vite build` → `actions/deploy-pages`. Build script intentionally skips `tsc --noEmit` due to known codegen TS debt.
  - `README.md` + `AGENTS.md` added.
- **Migration / follow-up**:
  - Backend `ALLOWED_ORIGINS` must include `https://ghostd.khurk.xyz` and `https://skulls206-creator.github.io`.
  - Repo Actions Variables: `VITE_API_BASE_URL` points at the Replit backend; update when the backend moves to a `*.replit.app` production URL.
  - Codegen TS errors (`useGetBalance`/`useGetTicker`/`useGetMe`) are still present and are the reason `tsc --noEmit` isn't in the build. Fix by regenerating the client from the updated OpenAPI spec in the backend repo.
