@echo off
chcp 65001 >nul 2>&1
:: ETF Backtester - 一鍵啟動開發環境
:: 同時啟動後端 FastAPI 和前端 React

title ETF Backtester Dev Launcher
echo ==========================================
echo    ETF Backtester - Development Mode
echo ==========================================
echo.

:: 檢查 Python
echo [1/5] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Please install Python 3.10+
    pause
    exit /b 1
)
echo        Python OK

:: 檢查 Node.js
echo [2/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found! Please install Node.js 18+
    pause
    exit /b 1
)
echo        Node.js OK

:: 檢查後端相依
echo [3/5] Checking backend dependencies...
if not exist "backend\venv\Scripts\python.exe" (
    echo        Creating virtual environment...
    cd backend
    python -m venv venv
    cd ..
)

:: 安裝/更新後端相依套件
echo [3.5/5] Installing Python dependencies...
cd backend
call venv\Scripts\activate
pip install -q -r requirements.txt
cd ..
echo        Dependencies OK

:: 啟動後端
echo [4/5] Starting Backend Server...
echo        URL: http://localhost:8000
echo        Docs: http://localhost:8000/docs
echo.
start "Backend - FastAPI" cmd /k "cd backend && venv\Scripts\activate && python -m uvicorn app.main:app --reload --port 8000"

:: 等待後端啟動
timeout /t 5 /nobreak >nul

:: 檢查前端相依
echo [5/5] Checking frontend dependencies...
if not exist "frontend\node_modules" (
    echo        Installing npm packages...
    cd frontend
    call npm install
    cd ..
)

:: 啟動前端
echo        Starting Frontend Server...
echo        URL: http://localhost:5173
echo.
start "Frontend - React" cmd /k "cd frontend && npm run dev"

echo ==========================================
echo    All Services Started!
echo ==========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to stop all services...
pause >nul

echo.
echo Stopping services...
taskkill /FI "WindowTitle eq Backend - FastAPI*" /F >nul 2>&1
taskkill /FI "WindowTitle eq Frontend - React*" /F >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo.
echo All services stopped.
timeout /t 2 /nobreak >nul
