# CHANGES — GHOSTD

> Shared change log for AI agents. Newest entry on top. One entry per meaningful change. Include commit SHAs and scope.

---

## 2026-05-18 — TypeScript strict mode enabled
**Author:** Satoshi (OpenClaw)
**Scope:** `tsconfig.base.json` (compilerOptions.strict: true), various source files
**Changes:**
- Enabled `strict: true` in `tsconfig.base.json` — cascades to all sub-tsconfigs via project references
- Fixed all type errors exposed by strict mode:
  - Added missing Card subcomponents (CardHeader, CardContent, CardTitle, CardDescription, CardFooter)
  - Fixed queryKey in all useQuery options (7 locations)
  - Added `open` field to TickerEntry type
  - Fixed error message extraction pattern (cast error as any)
  - Fixed unknown→ReactNode in Wallet.tsx
  - Fixed "import type" exports in generated schemas
- `pnpm run typecheck` passes clean

**Notes for next AI:**
- Strict mode is now enforced. Run `pnpm run typecheck` after any change before committing.
- The `strict: true` flag adds `strictFunctionTypes`, `strictNullChecks`, `strictPropertyInitialization`, `noImplicitAny`, `noImplicitThis`, `alwaysStrict`, `useUnknownInCatchVariables`, and `strictBindCallApply`.
- Sub-tsconfigs with `"extends": "./tsconfig.base.json"` inherit this automatically.
