"""
Phase 1 ETF 擴充腳本
導入缺少的 8 檔 ETF 數據
美股: VUAA, AVUV, QMOM, SCHD
英股: CNDX, EQQQ, AVWS, IUMO
國際: VXUS
"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import yfinance as yf
from datetime import datetime
from decimal import Decimal

engine = create_engine("sqlite:///./etf_backtester.db")
SessionLocal = sessionmaker(bind=engine)

NEW_ETFS = [
    {"symbol": "VUAA", "yahoo_symbol": "VUAA.L", "name": "Vanguard S&P 500 UCITS ETF (USD) Accumulating", 
     "asset_class": "Equity", "region": "US", "factor_type": "Large Cap", 
     "expense_ratio": Decimal("0.0007"), "currency": "USD"},
    {"symbol": "AVUV", "name": "Avantis U.S. Small Cap Value ETF", 
     "asset_class": "Equity", "region": "US", "factor_type": "Small Value", 
     "expense_ratio": Decimal("0.0025"), "currency": "USD"},
    {"symbol": "QMOM", "name": "Alpha Architect U.S. Quantitative Momentum ETF", 
     "asset_class": "Equity", "region": "US", "factor_type": "Momentum", 
     "expense_ratio": Decimal("0.0079"), "currency": "USD"},
    {"symbol": "SCHD", "name": "Schwab US Dividend Equity ETF", 
     "asset_class": "Equity", "region": "US", "factor_type": "Dividend", 
     "expense_ratio": Decimal("0.0006"), "currency": "USD"},
    {"symbol": "CNDX", "yahoo_symbol": "CNDX.L", "name": "iShares NASDAQ 100 UCITS ETF", 
     "asset_class": "Equity", "region": "US", "factor_type": "Tech", 
     "expense_ratio": Decimal("0.0033"), "currency": "GBP"},
    {"symbol": "EQQQ", "yahoo_symbol": "EQQQ.L", "name": "Invesco EQQQ NASDAQ-100 UCITS ETF", 
     "asset_class": "Equity", "region": "US", "factor_type": "Tech", 
     "expense_ratio": Decimal("0.003"), "currency": "EUR"},
    {"symbol": "AVWS", "yahoo_symbol": "AVDV", "name": "Avantis International Small Cap Value ETF", 
     "asset_class": "Equity", "region": "International", "factor_type": "Small Value", 
     "expense_ratio": Decimal("0.0036"), "currency": "USD"},
    {"symbol": "IUMO", "yahoo_symbol": "IUMO.L", "name": "iShares MSCI USA Momentum Factor UCITS ETF", 
     "asset_class": "Equity", "region": "US", "factor_type": "Momentum", 
     "expense_ratio": Decimal("0.002"), "currency": "USD"},
    {"symbol": "VXUS", "name": "Vanguard Total International Stock ETF", 
     "asset_class": "Equity", "region": "International", "factor_type": "Total Market", 
     "expense_ratio": Decimal("0.0008"), "currency": "USD"},
]

def add_etf_master():
    db = SessionLocal()
    try:
        print("=" * 70)
        print("新增 ETF 基本資料到 etf_master")
        print("=" * 70)
        
        for etf in NEW_ETFS:
            result = db.execute(
                text("SELECT COUNT(*) FROM etf_master WHERE symbol = :symbol"),
                {"symbol": etf["symbol"]}
            ).scalar()
            
            if result > 0:
                print(f"[SKIP] {etf['symbol']} 已存在")
                continue
            
            db.execute(
                text("""
                    INSERT INTO etf_master 
                    (symbol, name, asset_class, asset_subclass, factor_type, region, 
                     expense_ratio, currency, is_active, data_source, min_data_year, 
                     created_at, updated_at)
                    VALUES 
                    (:symbol, :name, :asset_class, :asset_subclass, :factor_type, :region,
                     :expense_ratio, :currency, 1, 'yahoo', 2000, 
                     datetime('now'), datetime('now'))
                """),
                {
                    "symbol": etf["symbol"],
                    "name": etf["name"],
                    "asset_class": etf["asset_class"],
                    "asset_subclass": f"{etf['region']} {etf['factor_type']}",
                    "factor_type": etf["factor_type"],
                    "region": etf["region"],
                    "expense_ratio": float(etf["expense_ratio"]),
                    "currency": etf["currency"]
                }
            )
            print(f"[OK] 新增 {etf['symbol']}: {etf['name']}")
        
        db.commit()
        print("\n[OK] ETF 基本資料新增完成")
        
    except Exception as e:
        print(f"[ERROR] 錯誤: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def download_prices(symbol, yahoo_symbol=None, start_date='2020-01-01', end_date=None):
    if end_date is None:
        end_date = datetime.now().strftime('%Y-%m-%d')
    
    # 使用 yahoo_symbol 如果提供，否則使用 symbol
    query_symbol = yahoo_symbol if yahoo_symbol else symbol
    
    print(f"\n[DL] 下載 {symbol} (Yahoo: {query_symbol}) 價格數據...")
    
    try:
        ticker = yf.Ticker(query_symbol)
        df = ticker.history(start=start_date, end=end_date, auto_adjust=False)
        
        if df.empty:
            print(f"[WARN] {symbol}: 無數據")
            return None
        
        print(f"  [OK] 下載了 {len(df)} 筆資料 ({df.index[0].date()} 到 {df.index[-1].date()})")
        return df
        
    except Exception as e:
        print(f"[ERROR] {symbol} 下載失敗: {e}")
        return None

def save_prices_to_db(symbol, df):
    if df is None or df.empty:
        return 0
    
    db = SessionLocal()
    try:
        result = db.execute(
            text("SELECT COUNT(*) FROM etf_prices WHERE symbol = :symbol"),
            {"symbol": symbol}
        ).scalar()
        
        if result > 0:
            print(f"  [DEL] 刪除舊資料 ({result} 筆)")
            db.execute(
                text("DELETE FROM etf_prices WHERE symbol = :symbol"),
                {"symbol": symbol}
            )
        
        count = 0
        for index, row in df.iterrows():
            db.execute(
                text("""
                    INSERT INTO etf_prices 
                    (symbol, date, open_price, high_price, low_price, close_price, 
                     adjusted_close, volume, dividend, data_source)
                    VALUES 
                    (:symbol, :date, :open, :high, :low, :close, 
                     :adj_close, :volume, :dividend, 'yahoo')
                """),
                {
                    "symbol": symbol,
                    "date": index.date(),
                    "open": float(row['Open']),
                    "high": float(row['High']),
                    "low": float(row['Low']),
                    "close": float(row['Close']),
                    "adj_close": float(row['Adj Close']),
                    "volume": int(row['Volume']),
                    "dividend": float(row['Dividends']) if row['Dividends'] > 0 else 0
                }
            )
            count += 1
        
        db.commit()
        return count
        
    except Exception as e:
        print(f"[ERROR] 儲存失敗: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def import_all_prices():
    print("\n" + "=" * 70)
    print("導入價格數據")
    print("=" * 70)
    
    for etf in NEW_ETFS:
        symbol = etf["symbol"]
        yahoo_symbol = etf.get("yahoo_symbol")  # 可能為 None
        df = download_prices(symbol, yahoo_symbol)
        
        if df is not None:
            count = save_prices_to_db(symbol, df)
            print(f"  [SAVE] 已儲存 {count} 筆資料到資料庫")

def verify_import():
    print("\n" + "=" * 70)
    print("驗證導入結果")
    print("=" * 70)
    
    db = SessionLocal()
    try:
        print("\n[DB] etf_master 統計:")
        for etf in NEW_ETFS:
            result = db.execute(
                text("SELECT COUNT(*) FROM etf_master WHERE symbol = :symbol"),
                {"symbol": etf["symbol"]}
            ).scalar()
            status = "[OK]" if result > 0 else "[MISS]"
            print(f"  {status} {etf['symbol']}: {'已新增' if result > 0 else '未找到'}")
        
        print("\n[DB] etf_prices 統計:")
        for etf in NEW_ETFS:
            result = db.execute(
                text("SELECT COUNT(*), MIN(date), MAX(date) FROM etf_prices WHERE symbol = :symbol"),
                {"symbol": etf["symbol"]}
            ).fetchone()
            
            count, min_date, max_date = result
            if count > 0:
                print(f"  [OK] {etf['symbol']}: {count} 筆 ({min_date} 到 {max_date})")
            else:
                print(f"  [MISS] {etf['symbol']}: 無價格數據")
        
        total_etf = db.execute(
            text("SELECT COUNT(*) FROM etf_master WHERE is_active = 1")
        ).scalar()
        print(f"\n[TOTAL] 總計: {total_etf} 檔 ETF 可用")
        
    finally:
        db.close()

if __name__ == "__main__":
    print("Phase 1 ETF 擴充腳本")
    print(f"開始時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    add_etf_master()
    import_all_prices()
    verify_import()
    
    print("\n" + "=" * 70)
    print("Phase 1 ETF 擴充完成!")
    print(f"結束時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
