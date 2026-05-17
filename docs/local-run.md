# GHOSTD — Local Run Guide

Run GHOSTD entirely on your local machine. The app serves from `http://localhost:<port>` and talks to the CRP Exchange API via the Replit-hosted backend.

**This is not XAMPP.** GHOSTD is a Node.js + React app. You need Node.js, not Apache + PHP + MySQL. If you're looking for the Utopia desktop client, go to [u.is](https://u.is).

## Prerequisites

| Software | Version | Why |
|---|---|---|
| **Node.js** | 24+ | Runtime for the Vite dev server and build tools |
| **pnpm** | latest | Package manager (faster than npm, handles workspaces) |
| **A browser** | modern | Chrome, Firefox, Edge, or Safari |

### Installing Node.js

**macOS / Linux:**
```bash
# Using nvm (recommended):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
nvm install 24
nvm use 24

# Or download directly: https://nodejs.org
```

**Windows:**
Download and run the installer from [nodejs.org](https://nodejs.org). Make sure "Add to PATH" is checked during installation.

### Installing pnpm

```bash
# macOS / Linux (with Node.js 22+):
corepack enable
corepack prepare pnpm@latest --activate

# Windows (or if corepack isn't available):
npm install -g pnpm
```

Verify it works:
```bash
node -v   # → v24.x.x
pnpm -v   # → 10.x.x
```

## Quick Start (One Command)

### macOS / Linux
```bash
chmod +x scripts/local-bootstrap.sh
./scripts/local-bootstrap.sh
```

### Windows PowerShell
```powershell
.\scripts\local-bootstrap.ps1
```

The script will:
1. Check that Node.js and pnpm are installed
2. Create `.env.local` from `.env.local.example` (if it doesn't exist)
3. Install dependencies with `pnpm install`
4. Start a local dev server at `http://localhost:5173`
5. Open the app in your browser (macOS/Linux only — open manually on Windows)

## Step-by-Step (Manual)

If you prefer to do it manually instead of using the bootstrap script:

```bash
# 1. Clone the repo
git clone https://github.com/skulls206-creator/ghostd.git
cd ghostd

# 2. Create your environment file
cp .env.local.example .env.local

# 3. Edit .env.local and set VITE_API_BASE_URL
#    Ask Skulls for the current backend URL, or check your Replit deployment.
#    Example: VITE_API_BASE_URL=https://abc123-xyz.spock.replit.dev

# 4. Install dependencies
pnpm install

# 5. Start the dev server
pnpm dev

# 6. Open http://localhost:5173 in your browser
```

## Configuration

### `.env.local` variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | Full origin of the GHOSTD API server. No trailing slash. |
| `VITE_BASE` | ❌ | Vite base path. Default `/`. Change only for subpath deployments. |
| `VITE_BASE_URL` | ❌ | Not used by GHOSTD — `VITE_API_BASE_URL` is the correct var. |

Gotcha: `VITE_API_BASE_URL` is **not** `VITE_BASE_URL`. If you see API calls going to `undefined/api/...`, you used the wrong variable name.

## Signing In

1. You need a **Utopia Public Key** and its **password** — the same credentials you use on [crp.is](https://crp.is).
2. If you don't have a Utopia account yet:
   - Download [Utopia](https://u.is) for your platform
   - Create an account and copy your Public Key
   - Register at [crp.is](https://crp.is) with that key
   - Come back and sign in on GHOSTD

### 2FA (Two-Factor Authentication)

If you have 2FA enabled on your CRP account, enter your PIN when prompted on the login screen.

## Common Errors

### "Failed to fetch" / CORS errors

**Problem:** API requests are being blocked because `VITE_API_BASE_URL` is not set or is wrong.

**Fix:**
1. Open `.env.local`
2. Make sure `VITE_API_BASE_URL` is set to the correct backend URL
3. Restart the dev server (Ctrl+C, then `pnpm dev` again)

### Blank white screen / "Module not found"

**Problem:** Dependencies aren't installed.

**Fix:**
```bash
pnpm install
pnpm dev
```

### "port 5173 is in use"

**Problem:** Another process is already using port 5173.

**Fix:** Either stop the other process, or start Vite on a different port:
```bash
pnpm dev --port 3000
```

### "pnpm: command not found"

**Problem:** pnpm is not installed.

**Fix:**
```bash
npm install -g pnpm
```

### Login succeeds but every request returns 401

**Problem:** The backend recently changed cookie settings to use `SameSite=None; Secure` (see CHANGES.md entry from 2026-05-16). This works great from HTTPS origins but **will not work** on plain `http://localhost` because browsers reject `Secure` cookies on non-HTTPS connections.

**Fix:** Use the Replit dev domain as your backend URL (it's already HTTPS). The setting is `VITE_API_BASE_URL` in `.env.local`. If you're testing locally against a local backend, you'll need to run both over HTTPS or set up a local proxy.

Session note: The backend stores sessions in-memory. If the backend restarts, everyone gets logged out. Just sign in again.

### TypeScript errors during build

The generated API client has some pre-existing TS errors (`useGetBalance`, `useGetTicker`, `useGetMe` in some signature variants). These are known debt from the source OpenAPI spec. The build intentionally skips `tsc --noEmit` so these don't block you.

## For AI Agents

See [AGENTS.md](../AGENTS.md) for repo conventions, architecture, API contract, and contribution rules.

## Replit In-Memory Session Caveat

If you're coming from the Replit environment: the backend stores sessions in memory, not in a database. A backend restart destroys all active sessions. This is normal — the production workflow keeps the backend alive. If you get logged out unexpectedly, just log back in.

## Building for Production

```bash
VITE_API_BASE_URL=https://your-backend-url.replit.dev pnpm build
```

Output goes to `dist/`. You can then serve it with any static file server:

```bash
pnpm dlx serve dist
```

Or preview the production build locally:
```bash
pnpm preview
```

---

**Need help?** Ask Skulls or open an issue on GitHub.
