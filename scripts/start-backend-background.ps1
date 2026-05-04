$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

if (-not $env:OKXE_DATA_DIR -or [string]::IsNullOrWhiteSpace($env:OKXE_DATA_DIR)) {
    $env:OKXE_DATA_DIR = $env:LOCALAPPDATA
}

$dataRoot = Join-Path $env:OKXE_DATA_DIR "okxe\data"
$logDir = Join-Path $projectRoot "logs"
New-Item -ItemType Directory -Path $dataRoot -Force | Out-Null
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$stdoutLog = Join-Path $logDir "backend.stdout.log"
$stderrLog = Join-Path $logDir "backend.stderr.log"

$existing = Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue |
    Select-Object -First 1

if ($existing) {
    Write-Host "Port 3000 is already in use by PID $($existing.OwningProcess)."
    exit 0
}

$process = Start-Process `
    -FilePath node `
    -ArgumentList "server.js" `
    -WorkingDirectory $projectRoot `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

Write-Host "Backend started in background."
Write-Host "PID: $($process.Id)"
Write-Host "URL: http://localhost:3000"
Write-Host "STDOUT: $stdoutLog"
Write-Host "STDERR: $stderrLog"
