# ETF Backtester - 一鍵啟動開發環境 (PowerShell 進階版)
# 同時啟動後端 FastAPI 和前端 React

param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$NoBrowser
)

# 設定輸出編碼
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# 顏色設定
$ColorHeader = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"
$ColorInfo = "White"

# 輔助函數
function Write-Step {
    param($Number, $Total, $Message)
    Write-Host "[" -NoNewline
    Write-Host "$Number/$Total" -NoNewline -ForegroundColor $ColorHeader
    Write-Host "] $Message" -NoNewline
}

function Write-Status {
    param($Status, $Color = $ColorSuccess)
    Write-Host " ... " -NoNewline
    Write-Host $Status -ForegroundColor $Color
}

function Test-Command {
    param($Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

# 清除畫面
Clear-Host

# 標題
Write-Host "==========================================" -ForegroundColor $ColorHeader
Write-Host "   ETF Backtester - Development Mode" -ForegroundColor $ColorHeader
Write-Host "==========================================" -ForegroundColor $ColorHeader
Write-Host ""

# 檢查 Python
Write-Step 1 5 "Checking Python"
if (-not (Test-Command "python")) {
    Write-Status "NOT FOUND" $ColorError
    Write-Host "[ERROR] Python not found! Please install Python 3.10+" -ForegroundColor $ColorError
    pause
    exit 1
}
$pythonVersion = python --version 2>&1
Write-Status $pythonVersion

# 檢查 Node.js
Write-Step 2 5 "Checking Node.js"
if (-not (Test-Command "node")) {
    Write-Status "NOT FOUND" $ColorError
    Write-Host "[ERROR] Node.js not found! Please install Node.js 18+" -ForegroundColor $ColorError
    pause
    exit 1
}
$nodeVersion = node --version 2>&1
Write-Status "Node.js $nodeVersion"

# 設定路徑
$BackendPath = Join-Path $PSScriptRoot "backend"
$FrontendPath = Join-Path $PSScriptRoot "frontend"
$VenvPath = Join-Path $BackendPath "venv"
$PythonExe = Join-Path $VenvPath "Scripts\python.exe"

# 檢查/建立虛擬環境
Write-Step 3 5 "Checking Python virtual environment"
if (-not (Test-Path $PythonExe)) {
    Write-Status "Creating..." $ColorWarning
    Set-Location $BackendPath
    python -m venv venv
    Set-Location $PSScriptRoot
} else {
    Write-Status "OK"
}

# 檢查相依
Write-Step 4 5 "Checking backend dependencies"
Set-Location $BackendPath
& $PythonExe -c "import fastapi" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Status "Installing..." $ColorWarning
    & $PythonExe -m pip install -r requirements.txt -q
} else {
    Write-Status "OK"
}
Set-Location $PSScriptRoot

# 啟動後端
if (-not $SkipBackend) {
    Write-Step 5 5 "Starting Backend Server"
    Write-Host ""
    Write-Host "       URL: http://localhost:8000" -ForegroundColor $ColorInfo
    Write-Host "       Docs: http://localhost:8000/docs" -ForegroundColor $ColorInfo
    Write-Host ""
    
    $BackendJob = Start-Job -ScriptBlock {
        param($Path, $Python)
        Set-Location $Path
        & $Python -m uvicorn app.main:app --reload --port 8000
    } -ArgumentList $BackendPath, $PythonExe
    
    # 等待後端啟動
    Write-Host "       Waiting for backend to start..." -NoNewline -ForegroundColor $ColorWarning
    Start-Sleep -Seconds 5
    
    # 測試後端健康
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/etfs/" -Method Get -TimeoutSec 5
        Write-Host " [OK]" -ForegroundColor $ColorSuccess
    } catch {
        Write-Host " [Started]" -ForegroundColor $ColorWarning
    }
} else {
    Write-Host "[SKIP] Backend startup skipped" -ForegroundColor $ColorWarning
}

# 檢查前端相依
Write-Host ""
Write-Step - - "Checking frontend dependencies"
$NodeModulesPath = Join-Path $FrontendPath "node_modules"
if (-not (Test-Path $NodeModulesPath)) {
    Write-Status "Installing npm packages..." $ColorWarning
    Set-Location $FrontendPath
    npm install | Out-Null
    Set-Location $PSScriptRoot
} else {
    Write-Status "OK"
}

# 啟動前端
if (-not $SkipFrontend) {
    Write-Host ""
    Write-Step - - "Starting Frontend Server"
    Write-Host ""
    Write-Host "       URL: http://localhost:5173" -ForegroundColor $ColorInfo
    Write-Host ""
    
    $FrontendJob = Start-Job -ScriptBlock {
        param($Path)
        Set-Location $Path
        npm run dev
    } -ArgumentList $FrontendPath
    
    # 等待前端啟動
    Write-Host "       Waiting for frontend to start..." -NoNewline -ForegroundColor $ColorWarning
    Start-Sleep -Seconds 5
    Write-Host " [OK]" -ForegroundColor $ColorSuccess
    
    # 自動開啟瀏覽器
    if (-not $NoBrowser) {
        Write-Host ""
        Write-Host "Opening browser..." -ForegroundColor $ColorInfo
        Start-Sleep -Seconds 2
        Start-Process "http://localhost:5173"
    }
} else {
    Write-Host "[SKIP] Frontend startup skipped" -ForegroundColor $ColorWarning
}

# 顯示儀表板
Write-Host ""
Write-Host "==========================================" -ForegroundColor $ColorHeader
Write-Host "   All Services Started!" -ForegroundColor $ColorSuccess
Write-Host "==========================================" -ForegroundColor $ColorHeader
Write-Host ""
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor $ColorInfo
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor $ColorInfo
Write-Host ""
Write-Host "  Press Ctrl+C to stop all services" -ForegroundColor $ColorWarning
Write-Host ""

# 等待用戶中斷
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # 檢查工作狀態
        if ($BackendJob -and $BackendJob.State -eq "Failed") {
            Write-Host "[ERROR] Backend stopped unexpectedly" -ForegroundColor $ColorError
            break
        }
        if ($FrontendJob -and $FrontendJob.State -eq "Failed") {
            Write-Host "[ERROR] Frontend stopped unexpectedly" -ForegroundColor $ColorError
            break
        }
    }
} finally {
    # 清理
    Write-Host ""
    Write-Host "Stopping services..." -ForegroundColor $ColorWarning
    
    if ($BackendJob) {
        Stop-Job $BackendJob -ErrorAction SilentlyContinue
        Remove-Job $BackendJob -ErrorAction SilentlyContinue
    }
    if ($FrontendJob) {
        Stop-Job $FrontendJob -ErrorAction SilentlyContinue
        Remove-Job $FrontendJob -ErrorAction SilentlyContinue
    }
    
    # 強制終止殘留程序
    Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "All services stopped." -ForegroundColor $ColorSuccess
    Start-Sleep -Seconds 2
}
