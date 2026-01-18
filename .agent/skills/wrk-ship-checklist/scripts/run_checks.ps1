param([string]$RepoPath = ".")

$ErrorActionPreference = "Continue"

function Run-Step {
  param([string]$Name, [string]$Command)

  Write-Host ""
  Write-Host "== $Name ==" -ForegroundColor Cyan
  Write-Host $Command -ForegroundColor DarkGray

  cmd /c $Command

  if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: $Name (exit $LASTEXITCODE)" -ForegroundColor Red
    return $false
  }

  Write-Host "OK: $Name" -ForegroundColor Green
  return $true
}

Push-Location $RepoPath

if (-not (Test-Path "package.json")) {
  Write-Host "No package.json found. Ship checks skipped." -ForegroundColor Yellow
  Pop-Location
  exit 0
}

$ok = $true

# Install deps
if (Test-Path "package-lock.json") {
  $ok = $ok -and (Run-Step "Install deps" "npm ci")
} else {
  $ok = $ok -and (Run-Step "Install deps" "npm install")
}

# Verify gate (lint + types + tests)
$ok = $ok -and (Run-Step "Verify (lint + types + tests)" "npm run verify")

# Optional server build
$pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($pkg.scripts.'server:build') {
  $ok = $ok -and (Run-Step "Server build" "npm run server:build")
} else {
  Write-Host ""
  Write-Host "SKIPPED: No server:build script." -ForegroundColor Yellow
}

# Optional expo static build (only if domain exists)
$domain = $env:REPLIT_INTERNAL_APP_DOMAIN
if (-not $domain) { $domain = $env:REPLIT_DEV_DOMAIN }
if (-not $domain) { $domain = $env:EXPO_PUBLIC_DOMAIN }

if ($pkg.scripts.'expo:static:build') {
  if ($domain) {
    $ok = $ok -and (Run-Step "Expo static build" "npm run expo:static:build")
  } else {
    Write-Host ""
    Write-Host "SKIPPED: No deployment domain env set." -ForegroundColor Yellow
    Write-Host "Set one of: REPLIT_INTERNAL_APP_DOMAIN / REPLIT_DEV_DOMAIN / EXPO_PUBLIC_DOMAIN" -ForegroundColor Yellow
    Write-Host "Example (PowerShell): `$env:EXPO_PUBLIC_DOMAIN='localhost:5000'" -ForegroundColor Yellow
  }
} else {
  Write-Host ""
  Write-Host "SKIPPED: No expo:static:build script." -ForegroundColor Yellow
}

Pop-Location

if (-not $ok) { exit 1 }
exit 0
