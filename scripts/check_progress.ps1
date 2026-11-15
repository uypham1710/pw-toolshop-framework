# check_progress.ps1
# Kiểm tra "Definition of Done" của ngày hôm nay, thiếu gì thì bắn Windows toast notification.
# Chạy bằng Task Scheduler lúc 20:00 và 22:00.

param(
    [string]$RepoPath = "D:\Study\Playwright\pw-toolshop-framework"  
)
Set-Location $RepoPath
$today      = Get-Date -Format "yyyy-MM-dd"
$missing    = @()

# 1. Có ít nhất 1 commit hôm nay với prefix "dayNN:" và đã push lên remote
git fetch --quiet 2>$null
$localCommits  = git log --since="$today 00:00" --oneline --grep="^day[0-9]\+:" 2>$null
$pushedCommits = git log "origin/main" --since="$today 00:00" --oneline --grep="^day[0-9]\+:" 2>$null
if (-not $localCommits)      { $missing += "Chưa có commit 'dayNN:' hôm nay" }
elseif (-not $pushedCommits) { $missing += "Có commit nhưng CHƯA push lên GitHub" }

# 2. daily-log.md có entry của hôm nay
$logFile = Join-Path $RepoPath "docs\daily-log.md"
if (-not (Test-Path $logFile) -or -not (Select-String -Path $logFile -Pattern "## $today" -Quiet)) {
    $missing += "Chưa ghi docs/daily-log.md (## $today)"
}

# 3. Có file review của Claude Code được tạo/sửa hôm nay
$reviewDir = Join-Path $RepoPath "reviews"
$reviewToday = $false
if (Test-Path $reviewDir) {
    $reviewToday = Get-ChildItem $reviewDir -Filter "*.md" |
        Where-Object { $_.LastWriteTime.Date -eq (Get-Date).Date }
}
if (-not $reviewToday) { $missing += "Chưa chạy /review trong Claude Code" }

# ---- Thông báo ----
if ($missing.Count -eq 0) {
    $title = "Playwright: DONE hôm nay ✅"
    $body  = "Đủ output rồi. Nghỉ ngơi đi!"
} else {
    $title = "Playwright: còn thiếu $($missing.Count) mục ⚠️"
    $body  = ($missing -join "`n")
}

if (Get-Module -ListAvailable -Name BurntToast) {
    Import-Module BurntToast
    New-BurntToastNotification -Text $title, $body
} else {
    # Fallback nếu chưa cài BurntToast
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($body, $title) | Out-Null
}
