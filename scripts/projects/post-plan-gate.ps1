# Post-plan local gate: unit tests -> launch-server.ps1 (CI parity) -> boot audit -> stop server.
# Usage (repo root):
#   powershell -ExecutionPolicy Bypass -File .\scripts\projects\post-plan-gate.ps1
#   pwsh -File .\scripts\projects\post-plan-gate.ps1 -NoCompile
# Env: PROJECTS_EXTRA_VERIFY="verify:i18n" (optional npm script), PROBE_PORT=8080

param(
    [switch]$NoCompile,
    [switch]$SkipUnitTests,
    [switch]$SkipBootAudit,
    [int]$Port = $(if ($env:PROBE_PORT) { [int]$env:PROBE_PORT } else { 8080 })
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
Set-Location -LiteralPath $ProjectRoot

function Write-Step($msg) {
    Write-Host ""
    Write-Host "=== $msg ===" -ForegroundColor Cyan
}

function Stop-ServerTree($proc) {
    if (-not $proc -or $proc.HasExited) { return }
    try {
        & taskkill /PID $proc.Id /T /F 2>$null | Out-Null
    } catch {}
}

function Wait-ForServer($url, $timeoutSec = 600) {
    $deadline = (Get-Date).AddSeconds($timeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) {
                Write-Host "Server ready: $url"
                return
            }
        } catch {}
        Start-Sleep -Seconds 2
    }
    throw "Server did not become ready at $url within ${timeoutSec}s"
}

Write-Step "Unit tests"
if (-not $SkipUnitTests) {
    npm run test:unit
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Unit tests failed - stop flow, fix, re-run gate."
        exit $LASTEXITCODE
    }
} else {
    Write-Host "Skipping unit tests (-SkipUnitTests)."
}

$extraVerify = $env:PROJECTS_EXTRA_VERIFY
if ($extraVerify) {
    Write-Step "Plan extra verify: npm run $extraVerify"
    npm run $extraVerify
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Extra verify failed ($extraVerify) - stop flow, fix, re-run gate."
        exit $LASTEXITCODE
    }
}

if ($SkipBootAudit) {
    Write-Host "Skipping server + boot audit (-SkipBootAudit)."
    Write-Host "POST_PLAN_GATE_OK (unit tests only)"
    exit 0
}

Write-Step "Starting local server (CI parity via launch-server.ps1)"
$env:PORT = [string]$Port
$launchArgs = @("-ExecutionPolicy", "Bypass", "-File", (Join-Path $ProjectRoot "server\launch-server.ps1"))
if ($NoCompile) { $launchArgs += "-NoCompile" }
if ($SkipUnitTests -and $NoCompile) { $launchArgs += "-SkipUnitTests" }

$serverProc = Start-Process -FilePath "powershell.exe" -ArgumentList $launchArgs `
    -WorkingDirectory $ProjectRoot -PassThru -WindowStyle Hidden

$probeUrl = "http://127.0.0.1:$Port/"
try {
    Wait-ForServer $probeUrl

    Write-Step "Boot audit (strict, no page errors)"
    $env:PROBE_URL = $probeUrl
    npm run audit:boot:strict
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Boot audit failed - check audit-history/latest-boot-audit.json and server logs/. Stop flow, fix, re-run gate."
        exit $LASTEXITCODE
    }

    Write-Host ""
    Write-Host "POST_PLAN_GATE_OK" -ForegroundColor Green
    Write-Host "Local gate passed: unit tests + server + boot audit clean."
    exit 0
} finally {
    Write-Step "Stopping local server"
    Stop-ServerTree $serverProc
}
