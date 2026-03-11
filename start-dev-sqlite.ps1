# ETF Backtester 开发环境启动脚本（SQLite 版本）
# 无需 Docker，适合快速开发测试

$ErrorActionPreference = "Stop"

Write-Host "Starting ETF Backtester Development Environment (SQLite Mode)..." -ForegroundColor Green
Write-Host "Note: Using SQLite for quick development. For production, use PostgreSQL." -ForegroundColor Yellow

# 切换到后端目录
Set-Location -Path backend

# 创建虚拟环境
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# 激活虚拟环境
& .\venv\Scripts\Activate.ps1

# 安装依赖
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -q -r requirements.txt

# 备份原配置
if (Test-Path "app\config.py") {
    Copy-Item "app\config.py" "app\config_postgres.py" -Force
}

# 使用 SQLite 配置
Write-Host "Switching to SQLite configuration..." -ForegroundColor Yellow
Copy-Item "app\config_sqlite.py" "app\config.py" -Force

# 备份原数据库会话
if (Test-Path "app\db\session.py") {
    Copy-Item "app\db\session.py" "app\db\session_postgres.py" -Force
}

# 使用 SQLite 会话
Copy-Item "app\db\session_sqlite.py" "app\db\session.py" -Force

# 创建数据库表
Write-Host "Creating database tables..." -ForegroundColor Yellow
python -c "
import sys
sys.path.append('.')
from app.db.base import Base
from app.db.session_sqlite import engine
Base.metadata.create_all(bind=engine)
print('Database tables created successfully')
"

# 插入种子数据
Write-Host "Seeding ETF data..." -ForegroundColor Yellow
$seedScript = @"
import sys
sys.path.append('.')
from app.db.session_sqlite import SessionLocal
from app.models.etf import ETF
from sqlalchemy import text

db = SessionLocal()
try:
    if db.query(ETF).count() == 0:
        # 读取 SQL 文件并执行
        with open('../database/init/02-seed-etfs.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # 移除 PostgreSQL 特有语法，转换为 SQLite 兼容
        # 简化版：直接插入基础数据
        from database.seed_data import seed_etfs_sqlite
        seed_etfs_sqlite(db)
        print('ETF seed data inserted successfully')
    else:
        print('ETF data already exists, skipping seed')
finally:
    db.close()
"@

# 创建 Python 种子数据脚本
$seedDataScript = @'
def seed_etfs_sqlite(db):
    """SQLite 版本的种子数据"""
    from app.models.etf import ETF
    from datetime import date
    
    etfs = [
        ETF(symbol="VTI", name="Vanguard Total Stock Market ETF", issuer="Vanguard", 
            asset_class="Equity", asset_subclass="US Total Market", region="US",
            expense_ratio=0.0003, inception_date=date(2001, 5, 24), exchange="NYSE", currency="USD",
            is_active=True, is_recommended=True),
        ETF(symbol="VOO", name="Vanguard S&P 500 ETF", issuer="Vanguard",
            asset_class="Equity", asset_subclass="US Large Cap", region="US",
            expense_ratio=0.0003, inception_date=date(2010, 9, 7), exchange="NYSE", currency="USD",
            is_active=True, is_recommended=True),
        ETF(symbol="QQQ", name="Invesco QQQ Trust", issuer="Invesco",
            asset_class="Equity", asset_subclass="US Large Cap", region="US", factor_type="Growth",
            expense_ratio=0.0020, inception_date=date(1999, 3, 10), exchange="NASDAQ", currency="USD",
            is_active=True, is_recommended=True),
        ETF(symbol="BND", name="Vanguard Total Bond Market ETF", issuer="Vanguard",
            asset_class="Fixed Income", asset_subclass="US Aggregate Bond", region="US",
            expense_ratio=0.0003, inception_date=date(2007, 4, 3), exchange="NASDAQ", currency="USD",
            is_active=True, is_recommended=True),
        ETF(symbol="VXUS", name="Vanguard Total International Stock ETF", issuer="Vanguard",
            asset_class="Equity", asset_subclass="International Total Market", region="International",
            expense_ratio=0.0008, inception_date=date(2011, 1, 26), exchange="NASDAQ", currency="USD",
            is_active=True, is_recommended=True),
    ]
    
    for etf in etfs:
        db.add(etf)
    
    db.commit()
    print(f"Inserted {len(etfs)} ETFs")
'@

# 确保 database 目录存在
if (-not (Test-Path "database")) {
    New-Item -ItemType Directory -Path "database" | Out-Null
}

$seedDataScript | Out-File -FilePath "database\seed_data.py" -Encoding utf8

# 执行种子数据插入
try {
    $seedScript | python -
} catch {
    Write-Host "Warning: Seed script failed, but continuing..." -ForegroundColor Yellow
}

Set-Location -Path ..

Write-Host ""
Write-Host "Development environment is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000 (if started)" -ForegroundColor Cyan
Write-Host ""

# 启动后端
Write-Host "Starting backend server..." -ForegroundColor Green
Set-Location -Path backend
& .\venv\Scripts\Activate.ps1
Write-Host "Command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Gray
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
