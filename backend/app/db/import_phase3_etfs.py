"""
Phase 3 ETF 匯入腳本

新增 2 檔全球/新興市場 ETF：
- EIMI: iShares Core MSCI EM IMI UCITS ETF (Acc)
- VDEV: Vanguard FTSE Developed World UCITS ETF (Acc)

使用方法:
    cd backend
    python -m app.db.import_phase3_etfs
"""

import sys
from datetime import date
from sqlalchemy.orm import Session

# 加入專案路徑
sys.path.insert(0, '.')

from app.db.session import SessionLocal
from app.models.etf import ETF


# Phase 3 ETF 資料
PHASE3_ETFS = [
    {
        "symbol": "EIMI",
        "name": "iShares Core MSCI EM IMI UCITS ETF (Acc)",
        "name_zh": "iShares 核心 MSCI 新興市場 IMI UCITS ETF",
        "issuer": "BlackRock",
        "asset_class": "Equity",
        "asset_subclass": "Emerging Markets",
        "factor_type": "Global",
        "region": "Emerging Markets",
        "expense_ratio": 0.0018,
        "inception_date": date(2014, 5, 30),
        "exchange": "LSE",
        "currency": "USD",
        "is_active": True,
        "is_recommended": True,
        "min_data_year": 2014,
        "risk_level": 5,
        "tags": "emerging-markets,equity,global,core",
        "description": "追蹤 MSCI Emerging Markets IMI Index，投資於新興市場大中小型股",
        "tracking_index_name": "MSCI Emerging Markets IMI Index",
    },
    {
        "symbol": "VDEV",
        "name": "Vanguard FTSE Developed World UCITS ETF (Acc)",
        "name_zh": "先鋒 FTSE 開發外國市場 UCITS ETF",
        "issuer": "Vanguard",
        "asset_class": "Equity",
        "asset_subclass": "Developed Markets",
        "factor_type": "Global",
        "region": "Developed Markets",
        "expense_ratio": 0.0012,
        "inception_date": date(2014, 9, 30),
        "exchange": "LSE",
        "currency": "USD",
        "is_active": True,
        "is_recommended": True,
        "min_data_year": 2014,
        "risk_level": 4,
        "tags": "developed-markets,equity,global,core",
        "description": "追蹤 FTSE Developed Index，投資於全球開發中市場大型與中型股",
        "tracking_index_name": "FTSE Developed Index",
    },
]


def import_phase3_etfs(db: Session):
    """
    匯入 Phase 3 ETF
    
    Args:
        db: 資料庫 Session
    """
    print("=" * 60)
    print("Phase 3 ETF Import Tool")
    print("=" * 60)
    
    added_count = 0
    skipped_count = 0
    
    for etf_data in PHASE3_ETFS:
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
        
        print(f"ADD  {symbol}: {etf_data['name']} - ER {etf_data['expense_ratio']*100:.2f}%")
    
    # 提交變更
    db.commit()
    
    print("\n" + "=" * 60)
    print(f"Import Complete: Added {added_count}, Skipped {skipped_count}")
    print("=" * 60)


def main():
    """主函數"""
    db = SessionLocal()
    try:
        import_phase3_etfs(db)
    except Exception as e:
        print(f"\nERROR: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
