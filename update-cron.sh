#!/bin/bash
# ETF Backtester - 自動更新歷史價格腳本

# 取得腳本所在目錄的絕對路徑
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo "開始更新 ETF 歷史價格 - $(date)"

# 切換到 backend 目錄
cd "$BACKEND_DIR" || exit 1

# 啟用虛擬環境並執行更新腳本
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
    
    # 執行 Python 腳本呼叫內部 API 邏輯來更新
    python -c "
import sys
import os
sys.path.insert(0, os.getcwd())
from app.db.session import SessionLocal
from app.api.v1.endpoints.data_sync import import_yahoo_data
from app.models.etf import ETF

try:
    db = SessionLocal()
    etfs = db.query(ETF).filter(ETF.is_active == True).all()
    symbols = [e.symbol for e in etfs]
    print(f'正在同步 {len(symbols)} 檔 ETF...')
    results = import_yahoo_data(symbols, db)
    print(f'成功新增 {results[\"total_inserted\"]} 筆價格資料。')
    print('成功清單:', len(results[\"success\"]))
    print('失敗清單:', len(results[\"failed\"]))
    if results[\"failed\"]:
        print('失敗詳情:', results[\"failed\"])
finally:
    db.close()
"
else:
    echo "錯誤：找不到虛擬環境 (.venv/bin/activate)"
    exit 1
fi

echo "更新完成 - $(date)"
