$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

if (-not $env:OKXE_DATA_DIR -or [string]::IsNullOrWhiteSpace($env:OKXE_DATA_DIR)) {
    $env:OKXE_DATA_DIR = $env:LOCALAPPDATA
}

$dataRoot = Join-Path $env:OKXE_DATA_DIR "okxe\data"
New-Item -ItemType Directory -Path $dataRoot -Force | Out-Null

Write-Host "OKXE_DATA_DIR=$($env:OKXE_DATA_DIR)"
Write-Host "SQLite path: $(Join-Path $dataRoot 'rentals.db')"
Write-Host "Starting backend on http://localhost:3000"

node server.js
