# CODING-NOTES — ghostd

## What This Project Is
GHOSTD — Precision frontend for CRP Exchange.

## Tech Stack
- React 19 + Vite + Tailwind v4 (standalone project, NOT monorepo)
- Radix UI primitives (accordion, dialog, dropdown, tooltip, etc.)
- TanStack React Query
- embla-carousel-react, react-hook-form, react-day-picker
- TypeScript (strict: true — already enabled)
- lucide-react icons

## Structure
```
/
├── src/                 # App source
├── vite.config.ts
├── tailwind.config.*
├── tsconfig.json        # strict: true
└── package.json
```

## Build & Dev
- **Install:** `pnpm install`
- **Build:** `pnpm run build`
- **Dev:** `pnpm run dev`
- **Preview:** `pnpm run preview`
- **Typecheck:** `pnpm run typecheck`

## Deploy
- GitHub Pages via `.github/workflows/deploy.yml`

## TypeScript
- strict: true (good — maintain this)

## Tests & Lint
- None configured yet for this project

## Known Gotchas
- Not a monorepo — standard Vite project
- Radix UI + Tailwind = accessible but large import surface. Use tree-shaking-friendly imports.
- CRP Exchange data is real-time — stale data from SW caching can be misleading

## Previous Bugs / Regressions
*(Fill in as they happen)*
