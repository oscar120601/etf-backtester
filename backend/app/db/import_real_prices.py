"""
從 Yahoo Finance 下載真實 ETF 價格資料
"""
import yfinance as yf
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.etf import ETFPrice
from app.db.session import SessionLocal


def download_etf_prices(symbol: str, start_date: str = "2020-01-01", end_date: str = None) -> int:
    """
    從 Yahoo Finance 下載 ETF 歷史價格資料
    
    Args:
        symbol: ETF 代號 (如 VTI, VOO, QQQ)
        start_date: 開始日期 (YYYY-MM-DD)
        end_date: 結束日期 (YYYY-MM-DD)，預設為今天
    
    Returns:
        匯入的資料筆數
    """
    if end_date is None:
        end_date = date.today().strftime("%Y-%m-%d")
    
    print(f"[下載] {symbol} 的價格資料 ({start_date} ~ {end_date})...")
    
    try:
        # 從 Yahoo Finance 下載資料
        ticker = yf.Ticker(symbol)
        df = ticker.history(start=start_date, end=end_date)
        
        if df.empty:
            print(f"[警告] 無法取得 {symbol} 的資料")
            return 0
        
        db = SessionLocal()
        imported_count = 0
        
        for index, row in df.iterrows():
            # 將 pandas Timestamp 轉換為 Python date
            price_date = index.date() if hasattr(index, 'date') else index
            
            # 檢查是否已存在
            existing = db.query(ETFPrice).filter(
                ETFPrice.symbol == symbol,
                ETFPrice.date == price_date
            ).first()
            
            if existing:
                continue
            
            # 建立價格記錄
            price = ETFPrice(
                symbol=symbol,
                date=price_date,
                open_price=Decimal(str(round(row['Open'], 2))),
                high_price=Decimal(str(round(row['High'], 2))),
                low_price=Decimal(str(round(row['Low'], 2))),
                close_price=Decimal(str(round(row['Close'], 2))),
                adjusted_close=Decimal(str(round(row['Close'], 2))),
                volume=int(row['Volume']),
                dividend=Decimal(str(round(row.get('Dividends', 0), 4))),
                data_source='yahoo',
                is_verified=True
            )
            
            db.add(price)
            imported_count += 1
            
            # 每 100 筆提交一次
            if imported_count % 100 == 0:
                db.commit()
                print(f"  已匯入 {imported_count} 筆...")
        
        db.commit()
        db.close()
        
        print(f"[成功] {symbol}: 成功匯入 {imported_count} 筆真實價格資料")
        return imported_count
        
    except Exception as e:
        print(f"[錯誤] {symbol} 下載失敗: {e}")
        return 0


def download_multiple_etfs(symbols: list, start_date: str = "2020-01-01", end_date: str = None):
    """
    下載多個 ETF 的價格資料
    """
    total = 0
    for symbol in symbols:
        count = download_etf_prices(symbol, start_date, end_date)
        total += count
    
    print(f"\n[完成] 總共匯入 {total} 筆真實價格資料")
    return total


if __name__ == "__main__":
    # 下載所有 ETF 的真實資料
    etfs = ['VTI', 'VOO', 'QQQ', 'BND', 'VT']
    download_multiple_etfs(etfs, start_date="2020-01-01")
