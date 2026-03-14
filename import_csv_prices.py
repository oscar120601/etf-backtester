#!/usr/bin/env python3
"""
從 CSV 檔案匯入 ETF 價格資料

CSV 格式要求：
- Date,Open,High,Low,Close,Adj Close,Volume
- 或：date,open,high,low,close,adjusted_close,volume

使用方法：
    python import_csv_prices.py --symbol VUAA --csv ~/Downloads/VUAA.csv
"""

import argparse
import csv
import sys
from datetime import datetime
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, 'backend')

from app.db.session import SessionLocal
from app.models.etf import ETFPrice


def import_from_csv(symbol: str, csv_path: str) -> int:
    """從 CSV 匯入價格資料"""
    
    db = SessionLocal()
    imported_count = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            try:
                # 解析日期（支援多種格式）
                date_str = row.get('Date') or row.get('date')
                if not date_str:
                    continue
                    
                for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d']:
                    try:
                        price_date = datetime.strptime(date_str, fmt).date()
                        break
                    except ValueError:
                        continue
                else:
                    continue
                
                # 檢查是否已存在
                existing = db.query(ETFPrice).filter(
                    ETFPrice.symbol == symbol,
                    ETFPrice.date == price_date
                ).first()
                
                if existing:
                    continue
                
                # 解析價格欄位
                def get_value(row_dict, *keys):
                    for key in keys:
                        if key in row_dict and row_dict[key]:
                            return row_dict[key]
                    return '0'
                
                price = ETFPrice(
                    symbol=symbol,
                    date=price_date,
                    open_price=Decimal(str(round(float(get_value(row, 'Open', 'open')), 2))),
                    high_price=Decimal(str(round(float(get_value(row, 'High', 'high')), 2))),
                    low_price=Decimal(str(round(float(get_value(row, 'Low', 'low')), 2))),
                    close_price=Decimal(str(round(float(get_value(row, 'Close', 'close', 'Adj Close', 'adj_close')), 2))),
                    adjusted_close=Decimal(str(round(float(get_value(row, 'Adj Close', 'adj_close', 'adjusted_close', 'Close', 'close')), 2))),
                    volume=int(float(get_value(row, 'Volume', 'volume'))),
                    data_source='csv_import',
                    is_verified=True
                )
                
                db.add(price)
                imported_count += 1
                
                if imported_count % 100 == 0:
                    db.commit()
                    print(f"  已匯入 {imported_count} 筆...")
                    
            except Exception as e:
                print(f"  跳過行: {e}")
                continue
    
    db.commit()
    db.close()
    
    print(f"✅ {symbol}: 成功匯入 {imported_count} 筆資料")
    return imported_count


def main():
    parser = argparse.ArgumentParser(description='從 CSV 匯入 ETF 價格資料')
    parser.add_argument('--symbol', required=True, help='ETF 代碼 (如 VUAA)')
    parser.add_argument('--csv', required=True, help='CSV 檔案路徑')
    
    args = parser.parse_args()
    
    if not Path(args.csv).exists():
        print(f"❌ 檔案不存在: {args.csv}")
        return
    
    import_from_csv(args.symbol, args.csv)


if __name__ == '__main__':
    main()
