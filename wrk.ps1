param(
  [Parameter(Position=0)]
  [ValidateSet("status","ship","secrets","help")]
  [string]$Cmd = "status"
)

$ErrorActionPreference = "Stop"

$kit = Join-Path $HOME "WRK\KITS\wrk-agent-kit\wrk.ps1"
if (-not (Test-Path $kit)) {
  Write-Host "WRK kit not found at: $kit" -ForegroundColor Yellow
  Write-Host "Fix: ensure wrk-agent-kit exists under C:\Users\WET\WRK\KITS\wrk-agent-kit" -ForegroundColor Yellow
  exit 1
}

pwsh -NoProfile -ExecutionPolicy Bypass -File $kit $Cmd
