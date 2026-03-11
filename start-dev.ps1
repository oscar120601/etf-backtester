# ETF Backtester Development Environment Startup Script
# Requires: Docker Desktop

param(
    [switch]$SkipServices
)

$ErrorActionPreference = "Stop"

Write-Host "Starting ETF Backtester Development Environment..." -ForegroundColor Green

# Check Docker
try {
    $null = docker info 2>$null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Start infrastructure services
Write-Host "Starting database and Redis..." -ForegroundColor Yellow
docker-compose up -d db redis

# Wait for database
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
$attempts = 0
$maxAttempts = 30
while ($attempts -lt $maxAttempts) {
    $result = docker exec etf-db pg_isready -U etf_user -d etf_backtest 2>&1
    if ($result -match "accepting connections") {
        Write-Host "Database is ready" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 2
    $attempts++
    Write-Host "  Waiting... ($attempts/$maxAttempts)" -ForegroundColor Gray
}

if ($attempts -eq $maxAttempts) {
    Write-Host "Error: Database startup timeout" -ForegroundColor Red
    exit 1
}

# Run database migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
Set-Location -Path backend

# Create virtual environment if not exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
& .\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -q -r requirements.txt

# Run migrations
alembic upgrade head

# Seed ETF data
Write-Host "Seeding ETF data..." -ForegroundColor Yellow
$seedScript = @"
import sys
sys.path.append('.')
from app.db.session import SessionLocal
from app.models.etf import ETF

db = SessionLocal()
try:
    if db.query(ETF).count() == 0:
        from sqlalchemy import text
        with open('../database/init/02-seed-etfs.sql', 'r', encoding='utf-8') as f:
            sql = f.read()
            db.execute(text(sql))
            db.commit()
        print('ETF seed data inserted successfully')
    else:
        print('ETF data already exists, skipping seed')
finally:
    db.close()
"@

$seedScript | python -

Set-Location -Path ..

Write-Host ""
Write-Host "Development environment is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "pgAdmin: http://localhost:5050 (admin@etfbacktester.com / admin123)" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipServices) {
    $response = Read-Host "Start all services (frontend + backend)? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "Starting all services..." -ForegroundColor Green
        docker-compose up
    } else {
        Write-Host "Manual start command: docker-compose up" -ForegroundColor Yellow
    }
}
