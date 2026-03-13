"""
Phase 2 ETF 價格資料生成腳本

為新增的 8 檔 ETF 生成歷史價格資料
"""

import sys
from datetime import date

sys.path.insert(0, '.')

from app.db.session import SessionLocal
from app.db.import_prices import generate_sample_data

# Phase 2 ETF 清單
PHASE2_ETFS = ['VTV', 'VUG', 'VBR', 'VBK', 'VIG', 'VYM', 'DGRO', 'HDV']

def main():
    db = SessionLocal()
    
    print("=" * 60)
    print("Phase 2 ETF Price Data Generation")
    print("=" * 60)
    
    start_date = "2004-01-01"  # 最早的 VTV/VUG/VBR/VBK 起始日
    end_date = date.today().strftime('%Y-%m-%d')
    
    total_records = 0
    
    for symbol in PHASE2_ETFS:
        print(f"\nGenerating {symbol}...")
        try:
            # 根據 ETF 起始日調整
            if symbol in ['DGRO']:
                symbol_start = "2014-06-10"
            elif symbol == 'HDV':
                symbol_start = "2011-03-29"
            elif symbol in ['VIG', 'VYM']:
                symbol_start = "2006-11-01"
            else:
                symbol_start = "2004-01-26"
            
            count = generate_sample_data(db, symbol, symbol_start, end_date)
            print(f"  Created {count} records ({symbol_start} to {end_date})")
            total_records += count
            
        except Exception as e:
            print(f"  ERROR: {e}")
            db.rollback()
    
    print("\n" + "=" * 60)
    print(f"Total records created: {total_records}")
    print("=" * 60)
    
    db.close()

if __name__ == "__main__":
    main()
