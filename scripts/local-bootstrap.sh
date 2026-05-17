#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# GHOSTD — Local Bootstrap Script (macOS / Linux)
# ─────────────────────────────────────────────────────────────
# Usage:  chmod +x scripts/local-bootstrap.sh
#         ./scripts/local-bootstrap.sh
#
# Prerequisites:
#   - Node.js 24+   (https://nodejs.org)
#   - pnpm          (install: corepack enable && corepack prepare pnpm@latest --activate)
#   - A modern browser
#
# What this script does:
#   1. Checks prerequisites (node, pnpm)
#   2. Copies .env.local.example → .env.local if not present
#   3. Runs pnpm install
#   4. Starts the Vite dev server
#   5. Opens the app in your browser
# ─────────────────────────────────────────────────────────────

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║        GHOSTD — Local Bootstrap         ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# ─── Check prerequisites ───────────────────────────────────

if ! command -v node &>/dev/null; then
  echo "❌ Node.js is not installed."
  echo "   Install Node.js 24+: https://nodejs.org"
  exit 1
fi

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 24 ]; then
  echo "⚠️  Node.js $(node -v) detected — version 24+ is recommended."
  echo "   Install the latest: https://nodejs.org"
fi

if ! command -v pnpm &>/dev/null; then
  echo "❌ pnpm is not installed."
  echo "   Install it: corepack enable && corepack prepare pnpm@latest --activate"
  echo "   Or: npm install -g pnpm"
  exit 1
fi

echo "✓ Node.js $(node -v)"
echo "✓ pnpm $(pnpm -v)"
echo ""

# ─── .env.local ────────────────────────────────────────────

if [ ! -f ".env.local" ]; then
  if [ -f ".env.local.example" ]; then
    cp .env.local.example .env.local
    echo "⚠️  Created .env.local from .env.local.example"
    echo "   → Open .env.local and set VITE_API_BASE_URL to your backend URL"
    echo "   (You can find this in your Replit deployment or ask Skulls)"
    echo ""
    echo "   For quick testing, the dev server will start but won't connect"
    echo "   to the API until VITE_API_BASE_URL is configured."
    echo ""
  else
    echo "⚠️  No .env.local or .env.local.example found — continuing with defaults."
    echo ""
  fi
else
  echo "✓ .env.local exists"
fi

# ─── Install dependencies ──────────────────────────────────

echo "📦 Installing dependencies..."
pnpm install --no-frozen-lockfile
echo "✓ Dependencies installed"
echo ""

# ─── Start dev server ──────────────────────────────────────

echo "🚀 Starting GHOSTD dev server..."
echo "   Open http://localhost:5173 in your browser"
echo "   Press Ctrl+C to stop"
echo ""

pnpm dev --host 0.0.0.0
