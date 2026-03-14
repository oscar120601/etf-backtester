import sys
import os
from datetime import datetime

sys.path.insert(0, os.getcwd())

from sqlalchemy import text
from app.db.session import SessionLocal

CORE_ETFS = [
    {
        "symbol": "VTI", "name": "Vanguard Total Stock Market ETF", "name_zh": "Vanguard 全市場股票 ETF",
        "issuer": "Vanguard", "asset_class": "Equity", "asset_subclass": "US Total Market",
        "factor_type": None, "region": "US", "expense_ratio": 0.0003, "inception_date": "2001-05-24",
        "exchange": "NYSE", "currency": "USD", "is_active": True, "is_recommended": True,
        "min_data_year": 2001, "risk_level": 4, "tags": "broad-market,large-cap,mid-cap,small-cap"
    },
    {
        "symbol": "VOO", "name": "Vanguard S&P 500 ETF", "name_zh": "Vanguard S&P 500 ETF",
        "issuer": "Vanguard", "asset_class": "Equity", "asset_subclass": "US Large Cap",
        "factor_type": None, "region": "US", "expense_ratio": 0.0003, "inception_date": "2010-09-07",
        "exchange": "NYSE", "currency": "USD", "is_active": True, "is_recommended": True,
        "min_data_year": 2010, "risk_level": 4, "tags": "large-cap,sp500,core-holding"
    },
    {
        "symbol": "SPY", "name": "SPDR S&P 500 ETF Trust", "name_zh": "SPDR 標普 500 ETF",
        "issuer": "State Street Global Advisors", "asset_class": "Equity", "asset_subclass": "US Large Cap",
        "factor_type": None, "region": "US", "expense_ratio": 0.0009, "inception_date": "1993-01-22",
        "exchange": "NYSE", "currency": "USD", "is_active": True, "is_recommended": True,
        "min_data_year": 1993, "risk_level": 4, "tags": "large-cap,sp500"
    },
    {
        "symbol": "QQQ", "name": "Invesco QQQ Trust", "name_zh": "Invesco 納斯達克 100 ETF",
        "issuer": "Invesco", "asset_class": "Equity", "asset_subclass": "US Large Cap",
        "factor_type": "Growth", "region": "US", "expense_ratio": 0.0020, "inception_date": "1999-03-10",
        "exchange": "NASDAQ", "currency": "USD", "is_active": True, "is_recommended": True,
        "min_data_year": 1999, "risk_level": 4, "tags": "large-cap,growth,technology,nasdaq-100"
    },
    {
        "symbol": "BND", "name": "Vanguard Total Bond Market ETF", "name_zh": "Vanguard 總體債券市場 ETF",
        "issuer": "Vanguard", "asset_class": "Fixed Income", "asset_subclass": "US Aggregate Bond",
        "factor_type": None, "region": "US", "expense_ratio": 0.0003, "inception_date": "2007-04-03",
        "exchange": "NASDAQ", "currency": "USD", "is_active": True, "is_recommended": True,
        "min_data_year": 2007, "risk_level": 2, "tags": "bonds,investment-grade,aggregate,core-holding"
    },
    {
        "symbol": "VT", "name": "Vanguard Total World Stock ETF", "name_zh": "Vanguard 全世界股票 ETF",
        "issuer": "Vanguard", "asset_class": "Equity", "asset_subclass": "Global Total Market",
        "factor_type": None, "region": "Global", "expense_ratio": 0.0007, "inception_date": "2008-06-24",
        "exchange": "NYSE", "currency": "USD", "is_active": True, "is_recommended": True,
        "min_data_year": 2008, "risk_level": 4, "tags": "global,broad-market"
    }
]

def add_core_etfs():
    db = SessionLocal()
    try:
        print("=" * 70)
        print("新增 Core ETFs 基本資料到 etf_master")
        print("=" * 70)
        
        for etf in CORE_ETFS:
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
                    (symbol, name, name_zh, issuer, asset_class, asset_subclass, factor_type, region, 
                     expense_ratio, inception_date, exchange, currency, is_active, is_recommended, 
                     data_source, min_data_year, risk_level, tags, created_at, updated_at)
                    VALUES 
                    (:symbol, :name, :name_zh, :issuer, :asset_class, :asset_subclass, :factor_type, :region,
                     :expense_ratio, :inception_date, :exchange, :currency, :is_active, :is_recommended, 
                     'yahoo', :min_data_year, :risk_level, :tags, datetime('now'), datetime('now'))
                """),
                etf
            )
            print(f"[OK] 新增 {etf['symbol']}: {etf['name']}")
        
        db.commit()
        print("\n[OK] Core ETF 基本資料新增完成")
    except Exception as e:
        print(f"[ERROR] 錯誤: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_core_etfs()
