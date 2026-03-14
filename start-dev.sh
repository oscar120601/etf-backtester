#!/bin/bash

# ETF Backtester - 一鍵啟動開發環境 (macOS/Linux 版本)
# 同時啟動後端 FastAPI 和前端 React

# 顏色設定
COLOR_HEADER='\033[36m'      # Cyan
COLOR_SUCCESS='\033[32m'     # Green
COLOR_WARNING='\033[33m'     # Yellow
COLOR_ERROR='\033[31m'       # Red
COLOR_RESET='\033[0m'        # Reset

# 輔助函數
print_step() {
    local num=$1
    local total=$2
    local msg=$3
    echo -n "[${COLOR_HEADER}${num}/${total}${COLOR_RESET}] ${msg}"
}

print_status() {
    local status=$1
    local color=${2:-$COLOR_SUCCESS}
    echo -e " ... ${color}${status}${COLOR_RESET}"
}

print_error() {
    echo -e "${COLOR_ERROR}[ERROR]${COLOR_RESET} $1"
}

print_header() {
    echo "=========================================="
    echo "   ETF Backtester - Development Mode"
    echo "=========================================="
    echo ""
}

# 清理函數
cleanup() {
    echo ""
    echo "=========================================="
    echo "  Shutting down development servers..."
    echo "=========================================="
    
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✓ Backend stopped"
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✓ Frontend stopped"
    fi
    
    echo ""
    echo "Thank you for using ETF Backtester!"
    exit 0
}

# 設定 trap
trap cleanup SIGINT SIGTERM

# 清除畫面
clear

# 標題
print_header

# 檢查參數
SKIP_BACKEND=false
SKIP_FRONTEND=false
NO_BROWSER=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-backend) SKIP_BACKEND=true ;;
        --skip-frontend) SKIP_FRONTEND=true ;;
        --no-browser) NO_BROWSER=true ;;
    esac
    shift
done

# 檢查 Python
print_step 1 5 "Checking Python"
if ! command -v python3 &> /dev/null; then
    print_status "NOT FOUND" "$COLOR_ERROR"
    print_error "Python not found! Please install Python 3.10+"
    exit 1
fi
PYTHON_VERSION=$(python3 --version 2>&1)
print_status "$PYTHON_VERSION"

# 檢查 Node.js
print_step 2 5 "Checking Node.js"
if ! command -v node &> /dev/null; then
    print_status "NOT FOUND" "$COLOR_ERROR"
    print_error "Node.js not found! Please install Node.js 18+"
    exit 1
fi
NODE_VERSION=$(node --version)
print_status "Node.js $NODE_VERSION"

# 設定路徑
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PATH="$SCRIPT_DIR/backend"
FRONTEND_PATH="$SCRIPT_DIR/frontend"
VENV_PATH="$BACKEND_PATH/venv"
PYTHON_EXE="$VENV_PATH/bin/python3"

# 檢查/建立虛擬環境
print_step 3 5 "Checking Python virtual environment"
if [ ! -f "$PYTHON_EXE" ]; then
    print_status "Creating..." "$COLOR_WARNING"
    cd "$BACKEND_PATH"
    python3 -m venv venv
    cd "$SCRIPT_DIR"
else
    print_status "OK"
fi

# 檢查相依
print_step 4 5 "Checking backend dependencies"
cd "$BACKEND_PATH"
if ! $PYTHON_EXE -c "import fastapi" 2>/dev/null; then
    print_status "Installing..." "$COLOR_WARNING"
    $PYTHON_EXE -m pip install -r requirements.txt -q
else
    print_status "OK"
fi
cd "$SCRIPT_DIR"

# 檢查前端相依
print_step 5 5 "Checking frontend dependencies"
cd "$FRONTEND_PATH"
if [ ! -d "node_modules" ]; then
    print_status "Installing..." "$COLOR_WARNING"
    npm install
else
    print_status "OK"
fi
cd "$SCRIPT_DIR"

echo ""
echo "=========================================="
echo "  Starting Development Servers"
echo "=========================================="
echo ""

# 啟動後端
if [ "$SKIP_BACKEND" = false ]; then
    echo "🚀 Starting backend server (FastAPI)..."
    cd "$BACKEND_PATH"
    $PYTHON_EXE -m uvicorn app.main:app --reload --port 8000 &
    BACKEND_PID=$!
    cd "$SCRIPT_DIR"
    echo "   PID: $BACKEND_PID"
    echo "   URL: http://localhost:8000"
    echo "   Docs: http://localhost:8000/docs"
    echo ""
    
    # 等待後端啟動
    sleep 2
fi

# 啟動前端
if [ "$SKIP_FRONTEND" = false ]; then
    echo "🚀 Starting frontend server (Vite)..."
    cd "$FRONTEND_PATH"
    npm run dev &
    FRONTEND_PID=$!
    echo "   PID: $FRONTEND_PID"
    echo "   URL: http://localhost:5173"
    echo ""
    
    # 等待前端啟動
    sleep 3
fi

echo "=========================================="
echo "  🎉 Development servers are running!"
echo "=========================================="
echo ""
echo "📊 Frontend: http://localhost:5173"
echo "⚙️  Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# 自動開啟瀏覽器
if [ "$NO_BROWSER" = false ] && [ "$SKIP_FRONTEND" = false ]; then
    sleep 2
    if command -v open &> /dev/null; then
        open "http://localhost:5173"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:5173"
    fi
fi

# 等待用戶中斷
wait
