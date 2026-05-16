# GHOSTD

A precision-built frontend for the CRP Exchange (Utopia ecosystem).

Live at **[ghostd.khurk.xyz](https://ghostd.khurk.xyz)**.

## Stack

- React 19 + Vite 7
- TypeScript
- TailwindCSS v4 + shadcn/ui
- TanStack Query
- Wouter (router)

## Backend

This is the frontend only. It talks to a separate API server hosted on Replit at the URL configured by `VITE_API_BASE_URL`.

## Development

```bash
pnpm install
VITE_API_BASE_URL=https://<your-api-host> pnpm dev
```

## Build

```bash
VITE_API_BASE_URL=https://<your-api-host> pnpm build
```

Output goes to `dist/`.

## Deployment

Deployed automatically to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`.

Required repo secrets:
- `VITE_API_BASE_URL` — full origin of the API server (e.g. `https://api.example.com`)

Optional repo variables:
- `VITE_BASE` — base path for the build (default `/`)

The API server's `ALLOWED_ORIGINS` env var must include this site's origin (`https://ghostd.khurk.xyz` and/or `https://skulls206-creator.github.io`).
