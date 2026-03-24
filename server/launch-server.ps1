# Launch the Rianell HTTP server (python -m server).
# From repo root:
#   powershell -ExecutionPolicy Bypass -File .\server\launch-server.ps1
#   pwsh -File .\server\launch-server.ps1
# Optional: $env:PORT = "9000"; $env:HOST = "0.0.0.0"
# Prefer PORT/HOST in security/.env (copy from security/.env.example).

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

Write-Host "Preparing local minified site bundle (CI parity)..."

$nodeExe = $null
$npmExe = $null
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeExe = (Get-Command node).Source
}
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmExe = (Get-Command npm).Source
}

if (-not $nodeExe -or -not $npmExe) {
    Write-Error "Node.js and npm are required to build the local minified site. Install Node 20+ and retry."
    exit 1
}

$LocalSiteDir = Join-Path $ProjectRoot ".server-dist"

# Mirror the CI deploy-pages preparation path:
# 1) Copy web/* to site
# 2) Copy App build/* if present
# 3) npm ci
# 4) node web/build-site.mjs --site site
# 5) rewrite index.html app.js?v=* -> app.min.js?v=*
if (Test-Path -LiteralPath $LocalSiteDir) {
    Remove-Item -LiteralPath $LocalSiteDir -Recurse -Force
}
New-Item -ItemType Directory -Path $LocalSiteDir | Out-Null
Copy-Item -Path (Join-Path $ProjectRoot "web\*") -Destination $LocalSiteDir -Recurse -Force

$AppBuildDir = Join-Path $ProjectRoot "App build"
if (Test-Path -LiteralPath $AppBuildDir) {
    $SiteAppBuildDir = Join-Path $LocalSiteDir "App build"
    New-Item -ItemType Directory -Path $SiteAppBuildDir -Force | Out-Null
    Copy-Item -Path (Join-Path $AppBuildDir "*") -Destination $SiteAppBuildDir -Recurse -Force
}

& $npmExe ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $nodeExe "web/build-site.mjs" "--site" $LocalSiteDir
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $nodeExe "-e" @"
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), '.server-dist', 'index.html');
let h = fs.readFileSync(p, 'utf8');
h = h.replace(/app\.js\?v=(\d+)/g, function (_, v) { return 'app.min.js?v=' + v; });
fs.writeFileSync(p, h);
"@
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Point the Python server at the CI-parity local site output.
$env:RIANELL_WEB_DIR = $LocalSiteDir

$pythonExe = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonExe = (Get-Command python).Source
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonExe = "py"
    $pyArgs = @("-3", "-m", "server")
    Write-Host "Starting Rianell server from: $ProjectRoot"
    Write-Host "Serving local minified bundle: $LocalSiteDir"
    & $pythonExe @pyArgs @args
    exit $LASTEXITCODE
}

if (-not $pythonExe) {
    Write-Error "Python was not found on PATH. Install Python 3 and try again."
    exit 1
}

Write-Host "Starting Rianell server from: $ProjectRoot"
Write-Host "Serving local minified bundle: $LocalSiteDir"
& $pythonExe -m server @args
exit $LASTEXITCODE
