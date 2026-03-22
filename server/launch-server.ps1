# Launch the Rianell HTTP server (python -m server).
# From repo root:
#   powershell -ExecutionPolicy Bypass -File .\server\launch-server.ps1
#   pwsh -File .\server\launch-server.ps1
# Optional: $env:PORT = "9000"; $env:HOST = "0.0.0.0"
# Prefer PORT/HOST in security/.env (copy from security/.env.example).

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRootnto 
Set-Location -LiteralPath $ProjectRoot

$pythonExe = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonExe = (Get-Command python).Source
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonExe = "py"
    $pyArgs = @("-3", "-m", "server")
    Write-Host "Starting Rianell server from: $ProjectRoot"
    & $pythonExe @pyArgs @args
    exit $LASTEXITCODE
}

if (-not $pythonExe) {
    Write-Error "Python was not found on PATH. Install Python 3 and try again."
    exit 1
}

Write-Host "Starting Rianell server from: $ProjectRoot"
& $pythonExe -m server @args
exit $LASTEXITCODE
