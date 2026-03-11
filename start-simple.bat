@echo off
chcp 65001 >nul
echo Starting ETF Backtester (Simple Mode)...
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.11+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

cd backend

REM Create virtual environment
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -q -r requirements.txt

REM Create SQLite database
echo Setting up SQLite database...
python -c "
import sys
sys.path.append('.')

# Use SQLite config
import shutil
shutil.copy('app/config_sqlite.py', 'app/config.py')
shutil.copy('app/db/session_sqlite.py', 'app/db/session.py')

# Create tables
from app.db.base import Base
from app.db.session import engine
Base.metadata.create_all(bind=engine)
print('Database ready')

# Seed data
from app.db.session import SessionLocal
from app.models.etf import ETF
from datetime import date

db = SessionLocal()
if db.query(ETF).count() == 0:
    etfs = [
        ETF(symbol='VTI', name='Vanguard Total Stock Market ETF', issuer='Vanguard',
            asset_class='Equity', asset_subclass='US Total Market', region='US',
            expense_ratio=0.0003, inception_date=date(2001, 5, 24), exchange='NYSE', currency='USD',
            is_active=True, is_recommended=True),
        ETF(symbol='VOO', name='Vanguard S&P 500 ETF', issuer='Vanguard',
            asset_class='Equity', asset_subclass='US Large Cap', region='US',
            expense_ratio=0.0003, inception_date=date(2010, 9, 7), exchange='NYSE', currency='USD',
            is_active=True, is_recommended=True),
        ETF(symbol='QQQ', name='Invesco QQQ Trust', issuer='Invesco',
            asset_class='Equity', asset_subclass='US Large Cap', region='US',
            expense_ratio=0.0020, inception_date=date(1999, 3, 10), exchange='NASDAQ', currency='USD',
            is_active=True, is_recommended=True),
        ETF(symbol='BND', name='Vanguard Total Bond Market ETF', issuer='Vanguard',
            asset_class='Fixed Income', asset_subclass='US Aggregate Bond', region='US',
            expense_ratio=0.0003, inception_date=date(2007, 4, 3), exchange='NASDAQ', currency='USD',
            is_active=True, is_recommended=True),
    ]
    for etf in etfs:
        db.add(etf)
    db.commit()
    print('Seed data inserted')
db.close()
"

REM Start backend
echo.
echo Starting backend server...
echo API will be available at: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
