"""
資料同步 API 端點 - ETF 價格自動更新
"""
import os
import sys
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.etf import ETF, ETFPrice

router = APIRouter()

# 專案根目錄
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


def import_yahoo_data(symbols: List[str], db: Session) -> dict:
    """
    從 Yahoo Finance 匯入 ETF 價格資料
    """
    try:
        import yfinance as yf
        import pandas as pd
        from datetime import datetime
        
        results = {
            "success": [],
            "failed": [],
            "total_inserted": 0,
        }
        
        for symbol in symbols:
            try:
                # 獲取 ETF 資訊
                etf = db.query(ETF).filter(ETF.symbol == symbol).first()
                if not etf:
                    results["failed"].append(f"{symbol}: ETF not found in database")
                    continue
                
                # Yahoo Finance 代碼轉換
                yahoo_symbol = symbol
                if etf.exchange == "LSE":
                    yahoo_symbol = f"{symbol}.L"
                # 手動對應部分因為階段一資料庫 exchange 為 Null 的英股/國際股 ETF
                elif symbol in ["VUAA", "CNDX", "EQQQ", "IUMO", "EIMI", "VDEV"]:
                    yahoo_symbol = f"{symbol}.L"
                elif symbol == "AVWS":
                    yahoo_symbol = "AVDV" # AVWS is AVDV in yahoo
                
                # 獲取資料庫中最新日期
                latest_price = (
                    db.query(ETFPrice)
                    .filter(ETFPrice.symbol == symbol)
                    .order_by(ETFPrice.date.desc())
                    .first()
                )
                
                period_str = None
                if latest_price:
                    start_date = latest_price.date + timedelta(days=1)
                    end_date = datetime.now().date()
                    # 如果已是最新，跳過
                    if start_date >= end_date:
                        results["success"].append(f"{symbol}: Already up to date")
                        continue
                else:
                    # 如果沒有資料，則獲取最大歷史資料
                    start_date = None
                    end_date = None
                    period_str = "max"
                
                # 從 Yahoo Finance 下載
                ticker = yf.Ticker(yahoo_symbol)
                if period_str == "max":
                    df = ticker.history(period="max", auto_adjust=False)
                else:
                    df = ticker.history(start=start_date, end=end_date, auto_adjust=False)
                
                if df.empty:
                    results["failed"].append(f"{symbol}: No data available from Yahoo Finance")
                    continue
                
                # 插入資料庫
                inserted_count = 0
                for index, row in df.iterrows():
                    # Skip if missing closing price (e.g. days with only dividend info but no trading data)
                    if pd.isna(row['Close']):
                        continue
                        
                    # 檢查是否已存在
                    existing = (
                        db.query(ETFPrice)
                        .filter(
                            ETFPrice.symbol == symbol,
                            ETFPrice.date == index.date()
                        )
                        .first()
                    )
                    
                    if existing:
                        continue
                    
                    # 使用調整後收盤價 (Adj Close)，如無則使用收盤價
                    adj_close = row['Adj Close'] if 'Adj Close' in row and pd.notna(row['Adj Close']) else row['Close']
                    
                    price = ETFPrice(
                        symbol=symbol,
                        date=index.date(),
                        open_price=row['Open'],
                        high_price=row['High'],
                        low_price=row['Low'],
                        close_price=row['Close'],
                        adjusted_close=adj_close,
                        volume=int(row['Volume']) if pd.notna(row['Volume']) else None,
                        dividend=row['Dividends'] if pd.notna(row['Dividends']) else 0,
                        data_source='yahoo',
                    )
                    db.add(price)
                    inserted_count += 1
                
                db.commit()
                results["total_inserted"] += inserted_count
                results["success"].append(f"{symbol}: Inserted {inserted_count} records")
                
            except Exception as e:
                db.rollback()
                results["failed"].append(f"{symbol}: {str(e)}")
        
        return results
        
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Required packages (yfinance, pandas) not installed"
        )


@router.post("/update-prices")
async def update_prices(
    background_tasks: BackgroundTasks,
    symbols: Optional[List[str]] = Query(None, description="Specific symbols to update"),
    db: Session = Depends(get_db),
):
    """
    更新 ETF 價格資料
    
    - 如果指定 symbols，只更新這些 ETF
    - 如果未指定，更新所有活躍 ETF
    """
    try:
        if symbols:
            target_symbols = symbols
        else:
            # 獲取所有活躍 ETF
            etfs = db.query(ETF).filter(ETF.is_active == True).all()
            target_symbols = [etf.symbol for etf in etfs]
        
        if not target_symbols:
            return {
                "message": "No ETFs to update",
                "updated": [],
                "failed": [],
            }
        
        # 執行更新
        results = import_yahoo_data(target_symbols, db)
        
        return {
            "message": f"Price update completed for {len(results['success'])} ETFs",
            "total_inserted": results["total_inserted"],
            "updated": results["success"],
            "failed": results["failed"],
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/price-status")
async def get_price_status(
    db: Session = Depends(get_db),
):
    """
    獲取所有 ETF 的價格資料狀態（包含最早和最新日期）
    """
    try:
        etfs = db.query(ETF).filter(ETF.is_active == True).all()
        
        status_list = []
        for etf in etfs:
            # 獲取最新價格
            latest_price = (
                db.query(ETFPrice)
                .filter(ETFPrice.symbol == etf.symbol)
                .order_by(ETFPrice.date.desc())
                .first()
            )
            
            # 獲取最早價格
            earliest_price = (
                db.query(ETFPrice)
                .filter(ETFPrice.symbol == etf.symbol)
                .order_by(ETFPrice.date.asc())
                .first()
            )
            
            count = (
                db.query(ETFPrice)
                .filter(ETFPrice.symbol == etf.symbol)
                .count()
            )
            
            # 計算涵蓋年限
            data_span_years = None
            if earliest_price and latest_price:
                days = (latest_price.date - earliest_price.date).days
                data_span_years = round(days / 365.25, 1)
            
            status_list.append({
                "symbol": etf.symbol,
                "name": etf.name,
                "earliest_date": earliest_price.date.isoformat() if earliest_price else None,
                "latest_date": latest_price.date.isoformat() if latest_price else None,
                "record_count": count,
                "data_span_years": data_span_years,
                "days_since_update": (
                    (datetime.now().date() - latest_price.date).days
                    if latest_price else None
                ),
            })
        
        return {
            "total_etfs": len(status_list),
            "status": status_list,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update-single/{symbol}")
async def update_single_etf(
    symbol: str,
    db: Session = Depends(get_db),
):
    """
    更新單一 ETF 的價格資料
    """
    try:
        results = import_yahoo_data([symbol], db)
        
        return {
            "symbol": symbol,
            "total_inserted": results["total_inserted"],
            "messages": results["success"] + results["failed"],
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
