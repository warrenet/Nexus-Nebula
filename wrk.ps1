param(
  [Parameter(Position=0)]
  [ValidateSet("status","ship","secrets","tree","preflight","fix","doctor","ci-last-fail","autofix","help")]
  [string]$Cmd = "status"
)

$ErrorActionPreference = "Stop"

# Prefer explicit override if provided
$kitCandidates = @(
  $env:WRK_KIT,
  "C:\Users\WET\WRK\KITS\wrk-agent-kit\wrk.ps1",
  "C:\Users\conta\WRK\KITS\wrk-agent-kit\wrk.ps1"
) | Where-Object { $_ -and $_.Trim() -ne "" } | Select-Object -Unique

$kit = $kitCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $kit) {
  Write-Host "WRK kit not found. Searched:" -ForegroundColor Yellow
  $kitCandidates | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
  Write-Host "Fix: set WRK_KIT env var or place kit at C:\Users\WET\WRK\KITS\wrk-agent-kit\wrk.ps1" -ForegroundColor Yellow
  exit 1
}

pwsh -NoProfile -ExecutionPolicy Bypass -File $kit $Cmd
