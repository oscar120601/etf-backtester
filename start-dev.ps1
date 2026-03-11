# ETF Backtester 開發環境啟動腳本

Write-Host "🚀 啟動 ETF 回測工具開發環境..." -ForegroundColor Green

# 檢查 Docker 是否執行
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker 未啟動，請先啟動 Docker Desktop" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker 未安裝或未啟動" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker 已啟動" -ForegroundColor Green

# 建立 Docker 網路（如果不存在）
Write-Host "📦 建立 Docker 網路..." -ForegroundColor Yellow
docker network create etf-network 2>$null

# 啟動資料庫和 Redis
Write-Host "🗄️ 啟動資料庫和 Redis..." -ForegroundColor Yellow
docker-compose up -d db redis

# 等待資料庫就緒
Write-Host "⏳ 等待資料庫就緒..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    $result = docker exec etf-db pg_isready -U etf_user -d etf_backtest 2>&1
    if ($result -match "accepting connections") {
        Write-Host "✅ 資料庫已就緒" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 2
    $attempt++
    Write-Host "  等待中... ($attempt/$maxAttempts)" -ForegroundColor Gray
}

if ($attempt -eq $maxAttempts) {
    Write-Host "❌ 資料庫啟動超時" -ForegroundColor Red
    exit 1
}

# 執行資料庫 Migration
Write-Host "🔄 執行資料庫 Migration..." -ForegroundColor Yellow
Set-Location -Path backend

# 安裝依賴（如果還沒安裝）
if (-not (Test-Path "venv")) {
    Write-Host "📥 建立 Python 虛擬環境..." -ForegroundColor Yellow
    python -m venv venv
}

# 啟動虛擬環境
& .\venv\Scripts\Activate.ps1

# 安裝依賴
Write-Host "📥 安裝 Python 依賴..." -ForegroundColor Yellow
pip install -q -r requirements.txt

# 執行 Migration
alembic upgrade head

# 插入種子資料
Write-Host "🌱 插入 ETF 種子資料..." -ForegroundColor Yellow
python -c "
import sys
sys.path.append('.')
from app.db.session import SessionLocal
from app.models.etf import ETF
from database.init.seed_etfs import seed_etfs

db = SessionLocal()
try:
    # 檢查是否已有資料
    if db.query(ETF).count() == 0:
        seed_etfs(db)
        print('✅ 種子資料已插入')
    else:
        print('✅ 資料已存在，跳過種子資料')
finally:
    db.close()
"

Set-Location -Path ..

Write-Host "" 
Write-Host "🎉 開發環境已就緒！" -ForegroundColor Green
Write-Host ""
Write-Host "📱 前端: http://localhost:3000"
Write-Host "🔌 後端 API: http://localhost:8000"
Write-Host "📚 API 文件: http://localhost:8000/docs"
Write-Host "🗄️ pgAdmin: http://localhost:5050 (admin@etfbacktester.com / admin123)"
Write-Host ""
Write-Host "🛑 停止環境: docker-compose down"
Write-Host ""

# 詢問是否啟動所有服務
$response = Read-Host "是否啟動所有服務（前端 + 後端）？(y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "🚀 啟動所有服務..." -ForegroundColor Green
    docker-compose up
} else {
    Write-Host "💡 手動啟動命令: docker-compose up" -ForegroundColor Yellow
}
