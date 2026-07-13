# Schedule a Windows shutdown after a delay (default 10 minutes).
# Cancel: shutdown /a

param(
    [int]$Minutes = 10,
    [string]$Message = 'PC shutdown scheduled by shutdown-pc.ps1'
)

if ($Minutes -lt 1) {
    Write-Error 'Minutes must be at least 1.'
    exit 1
}

$Seconds = $Minutes * 60
shutdown /s /t $Seconds /c $Message
Write-Host "Shutdown in $Minutes minute(s) ($Seconds s). Cancel with: shutdown /a"
