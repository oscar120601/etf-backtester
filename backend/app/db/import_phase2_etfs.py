"""
Phase 2 ETF 匯入腳本

新增 8 檔因子投資 ETF：
- 價值/成長因子: VTV, VUG, VBR, VBK
- 股息策略: VIG, VYM, DGRO, HDV

使用方法:
    cd backend
    python -m app.db.import_phase2_etfs
"""

import sys
from datetime import date
from sqlalchemy.orm import Session

# 加入專案路徑
sys.path.insert(0, '.')

from app.db.session import SessionLocal
from app.models.etf import ETF


# Phase 2 ETF 資料
PHASE2_ETFS = [
    # 價值/成長因子
    {
        "symbol": "VTV",
        "name": "Vanguard Value ETF",
        "name_zh": "先鋒價值股 ETF",
        "issuer": "Vanguard",
        "asset_class": "Equity",
        "asset_subclass": "US Large Cap",
        "factor_type": "Value",
        "region": "US",
        "expense_ratio": 0.0004,
        "inception_date": date(2004, 1, 26),
        "exchange": "NYSE",
        "currency": "USD",
        "is_active": True,
        "is_recommended": True,
        "min_data_year": 2004,
        "risk_level": 4,
        "tags": "value,large-cap,us-equity,factor",
        "description": "追蹤 CRSP US Large Cap Value Index，投資於美國大型價值股",
        "tracking_index_name": "CRSP US Large Cap Value Index",
    },
    {
        "symbol": "VUG",
        "name": "Vanguard Growth ETF",
        "name_zh": "先鋒成長股 ETF",
        "issuer": "Vanguard",
        "asset_class": "Equity",
        "asset_subclass": "US Large Cap",
        "factor_type": "Growth",
        "region": "US",
        "expense_ratio": 0.0004,
        "inception_date": date(2004, 1, 26),
        "exchange": "NYSE",
        "currency": "USD",
        "is_active": True,
        "is_recommended": True,
        "min_data_year": 2004,
        "risk_level": 4,
        "tags": "growth,large-cap,us-equity,factor",
        "description": "追蹤 CRSP US Large Cap Growth Index，投資於美國大型成長股",
        "tracking_index_name": "CRSP US Large Cap Growth Index",
    },
    {
        "symbol": "VBR",
        "name": "Vanguard Small-Cap Value ETF",
        "name_zh": "先鋒小型價值股 ETF",
        "issuer": "Vanguard",
        "asset_class": "Equity",
        "asset_subclass": "US Small Cap",
        "factor_type": "Value",
        "region": "US",
        "expense_ratio": 0.0007,
        "inception_date": date(2004, 1, 26),
        "exchange": "NYSE",
        "currency": "USD",
        "is_active": True,
        "is_recommended": True,
        "min_data_year": 2004,
        "risk_level": 5,
        "tags": "value,small-cap,us-equity,factor",
        "description": "追蹤 CRSP US Small Cap Value Index，投資於美國小型價值股",
        "tracking_index_name": "CRSP US Small Cap Value Index",
    },
    {
        "symbol": "VBK",
        "name": "Vanguard Small-Cap Growth ETF",
        "name_zh": "先鋒小型成長股 ETF",
        "issuer": "Vanguard",
        "asset_class": "Equity",
        "asset_subclass": "US Small Cap",
        "factor_type": "Growth",
        "region": "US",
        "expense_ratio": 0.0007,
        "inception_date": date(2004, 1, 26),
        "exchange": "NYSE",
        "currency": "USD",
        "is_active": True,
        "is_recommended": True,
        "min_data_year": 2004,
        "risk_level": 5,
        "tags": "growth,small-cap,us-equity,factor",
        "description": "追蹤 CRSP US Small Cap Growth Index，投資於美國小型成長股",
        "tracking_index_name": "CRSP US Small Cap Growth Index",
    },
    # 股息策略
    {
        "symbol": "VIG",
        "name": "Vanguard Dividend Appreciation ETF",
        "name_zh": "先鋒股息成長 ETF",
        "issuer": "Vanguard",
        "asset_class": "Equity",
        "asset_subclass": "US Large Cap",
        "factor_type": "Dividend Growth",
        "region": "US",
        "expense_ratio": 0.0006,
        "inception_date": date(2006, 4, 21),
        "exchange": "NYSE",
        "currency": "USD",
        "is_active": True,
        "is_recommended": True,
        "min_data_year": 2006,
        "risk_level": 3,
        "tags": "dividend-growth,large-cap,us-equity,income",
        "description": "追蹤 NASDAQ US Dividend Achievers Select Index，投資於連續 10 年以上增加股息的公司",
        "tracking_index_name": "NASDAQ US Dividend Achievers Select Index",
    },
    {
        "symbol": "VYM",
        "name": "Vanguard High Dividend Yield ETF",
        "name_zh": "先鋒高股息收益 ETF",
        "issuer": "Vanguard",
        "asset_class": "Equity",
        "asset_subclass": "US Large Cap",
        "factor_type": "High Dividend",
        "region": "US",
        "expense_ratio": 0.0006,
        "inception_date": date(2006, 11, 10),
        "exchange": "NYSE",
        "currency": "USD",
        "is_active": True,
        "is_recommended": True,
        "min_data_year": 2006,
        "risk_level": 3,
        "tags": "high-dividend,large-cap,us-equity,income,value",
        "description": "追蹤 FTSE High Dividend Yield Index，投資於高股息收益率的美國大型股",
        "tracking_index_name": "FTSE High Dividend Yield Index",
    },
    {
        "symbol": "DGRO",
        "name": "iShares Core Dividend Growth ETF",
        "name_zh": "iShares 核心股息成長 ETF",
        "issuer": "BlackRock",
        "asset_class": "Equity",
        "asset_subclass": "US Large Cap",
        "factor_type": "Dividend Growth",
        "region": "US",
        "expense_ratio": 0.0008,
        "inception_date": date(2014, 6, 10),
        "exchange": "NYSE",
        "currency": "USD",
        "is_active": True,
        "is_recommended": True,
        "min_data_year": 2014,
        "risk_level": 3,
        "tags": "dividend-growth,large-cap,us-equity,income,core",
        "description": "追蹤 Morningstar US Dividend Growth Index，投資於持續增加股息的美國公司",
        "tracking_index_name": "Morningstar US Dividend Growth Index",
    },
    {
        "symbol": "HDV",
        "name": "iShares Core High Dividend ETF",
        "name_zh": "iShares 核心高股息 ETF",
        "issuer": "BlackRock",
        "asset_class": "Equity",
        "asset_subclass": "US Large Cap",
        "factor_type": "High Dividend",
        "region": "US",
        "expense_ratio": 0.0008,
        "inception_date": date(2011, 3, 29),
        "exchange": "NYSE",
        "currency": "USD",
        "is_active": True,
        "is_recommended": True,
        "min_data_year": 2011,
        "risk_level": 3,
        "tags": "high-dividend,large-cap,us-equity,income,core",
        "description": "追蹤 Morningstar Dividend Yield Focus Index，投資於財務健全的高股息公司",
        "tracking_index_name": "Morningstar Dividend Yield Focus Index",
    },
]


def import_phase2_etfs(db: Session):
    """
    匯入 Phase 2 ETF
    
    Args:
        db: 資料庫 Session
    """
    print("=" * 60)
    print("Phase 2 ETF Import Tool")
    print("=" * 60)
    
    added_count = 0
    skipped_count = 0
    
    for etf_data in PHASE2_ETFS:
        symbol = etf_data["symbol"]
        
        # 檢查是否已存在
        existing = db.query(ETF).filter(ETF.symbol == symbol).first()
        if existing:
            print(f"SKIP {symbol}: already exists")
            skipped_count += 1
            continue
        
        # 建立新 ETF
        etf = ETF(**etf_data)
        db.add(etf)
        added_count += 1
        
        print(f"ADD  {symbol}: {etf_data['name']} ({etf_data['factor_type']}) - ER {etf_data['expense_ratio']*100:.2f}%")
    
    # 提交變更
    db.commit()
    
    print("\n" + "=" * 60)
    print(f"Import Complete: Added {added_count}, Skipped {skipped_count}")
    print("=" * 60)
    
    # 顯示統計
    print("\nPhase 2 ETF List:")
    print("-" * 60)
    
    # 按類別分組
    value_growth = [e for e in PHASE2_ETFS if e["factor_type"] in ["Value", "Growth"]]
    dividend = [e for e in PHASE2_ETFS if "Dividend" in e["factor_type"]]
    
    print("\n[Value/Growth Factors]")
    for etf in value_growth:
        print(f"  - {etf['symbol']}: {etf['name_zh']} ({etf['factor_type']})")
    
    print("\n[Dividend Strategies]")
    for etf in dividend:
        print(f"  - {etf['symbol']}: {etf['name_zh']} ({etf['factor_type']})")
    
    print("\n" + "=" * 60)
    print("Next: Import historical price data")
    print("Use: python -m app.db.import_prices --symbol <SYMBOL>")
    print("=" * 60)


def main():
    """主函數"""
    db = SessionLocal()
    try:
        import_phase2_etfs(db)
    except Exception as e:
        print(f"\nERROR: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
