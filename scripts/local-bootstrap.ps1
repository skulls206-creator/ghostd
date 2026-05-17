<#
.SYNOPSIS
  GHOSTD — Local Bootstrap Script (Windows)
.DESCRIPTION
  One-command setup for running GHOSTD locally on Windows.
  Checks prerequisites, creates .env.local, installs deps, starts dev server.
.PARAMETER AutoStart
  Skip the pause at the end and start the dev server immediately.
.EXAMPLE
  .\scripts\local-bootstrap.ps1
.NOTES
  Prerequisites:
    - Node.js 24+   (https://nodejs.org)
    - pnpm          (npm install -g pnpm)
    - A modern browser
#>

param(
  [switch]$AutoStart
)

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║        GHOSTD — Local Bootstrap         ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ─── Check prerequisites ───────────────────────────────────

try {
  $nodeVer = node -v 2>$null
} catch {
  Write-Host "❌ Node.js is not installed." -ForegroundColor Red
  Write-Host "   Install Node.js 24+: https://nodejs.org"
  exit 1
}

$nodeMajor = [int]($nodeVer -replace '[vV]', '' -split '\.')[0]
if ($nodeMajor -lt 24) {
  Write-Host "⚠️  Node.js $nodeVer detected — version 24+ is recommended." -ForegroundColor Yellow
  Write-Host "   Download the latest: https://nodejs.org"
}

try {
  $pnpmVer = pnpm -v 2>$null
} catch {
  Write-Host "❌ pnpm is not installed." -ForegroundColor Red
  Write-Host "   Install it: npm install -g pnpm"
  exit 1
}

Write-Host "✓ Node.js $nodeVer" -ForegroundColor Green
Write-Host "✓ pnpm $pnpmVer" -ForegroundColor Green
Write-Host ""

# ─── .env.local ────────────────────────────────────────────

$envPath = Join-Path (Get-Location) ".env.local"
$envExample = Join-Path (Get-Location) ".env.local.example"

if (-not (Test-Path $envPath)) {
  if (Test-Path $envExample) {
    Copy-Item $envExample $envPath
    Write-Host "⚠️  Created .env.local from .env.local.example" -ForegroundColor Yellow
    Write-Host "   → Open .env.local and set VITE_API_BASE_URL to your backend URL"
    Write-Host "   (You can find this in your Replit deployment or ask Skulls)"
    Write-Host ""
    Write-Host "   For quick testing, the dev server will start but won't connect"
    Write-Host "   to the API until VITE_API_BASE_URL is configured."
    Write-Host ""
  } else {
    Write-Host "⚠️  No .env.local found — continuing with defaults." -ForegroundColor Yellow
  }
} else {
  Write-Host "✓ .env.local exists" -ForegroundColor Green
}

# ─── Install dependencies ──────────────────────────────────

Write-Host "📦 Installing dependencies..." -ForegroundColor Magenta
pnpm install --no-frozen-lockfile
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# ─── Start dev server ──────────────────────────────────────

Write-Host "🚀 Starting GHOSTD dev server..." -ForegroundColor Cyan
Write-Host "   Open http://localhost:5173 in your browser"
Write-Host "   Press Ctrl+C to stop"
Write-Host ""

if (-not $AutoStart) {
  Write-Host "Press any key to start the dev server..." -ForegroundColor Gray
  $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
}

pnpm dev --host 0.0.0.0
