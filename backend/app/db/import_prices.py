"""
ETF 歷史價格資料匯入腳本

使用方式:
    python -m app.db.import_prices --csv data/etf_prices_sample.csv
    
或從 Yahoo Finance 下載:
    python -m app.db.import_prices --download --symbol VTI
"""

import argparse
import csv
import os
import sys
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

# 確保能找到 app 模組
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.etf import ETFPrice


def import_from_csv(db: Session, csv_path: str) -> int:
    """
    從 CSV 檔案匯入價格資料
    
    CSV 格式: symbol,date,open,high,low,close,adjusted_close,volume,dividend
    """
    imported_count = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            try:
                # 檢查是否已存在
                existing = db.query(ETFPrice).filter(
                    ETFPrice.symbol == row['symbol'],
                    ETFPrice.date == datetime.strptime(row['date'], '%Y-%m-%d').date()
                ).first()
                
                if existing:
                    print(f"跳過已存在: {row['symbol']} {row['date']}")
                    continue
                
                # 建立價格記錄
                price = ETFPrice(
                    symbol=row['symbol'],
                    date=datetime.strptime(row['date'], '%Y-%m-%d').date(),
                    open=Decimal(row['open']),
                    high=Decimal(row['high']),
                    low=Decimal(row['low']),
                    close=Decimal(row['close']),
                    adjusted_close=Decimal(row['adjusted_close']),
                    volume=int(row['volume']),
                    dividend=Decimal(row['dividend']) if row.get('dividend') else None
                )
                
                db.add(price)
                imported_count += 1
                
                # 每 100 筆提交一次
                if imported_count % 100 == 0:
                    db.commit()
                    print(f"已匯入 {imported_count} 筆...")
                    
            except Exception as e:
                print(f"錯誤: {row} - {e}")
                continue
    
    db.commit()
    return imported_count


def generate_sample_data(db: Session, symbol: str, start_date: str, end_date: str) -> int:
    """
    產生模擬價格資料（用於測試）
    """
    import random
    import numpy as np
    from datetime import timedelta
    
    start = datetime.strptime(start_date, '%Y-%m-%d').date()
    end = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    # 初始價格
    base_price = 100.0
    if symbol == 'VTI':
        base_price = 135.0
    elif symbol == 'VOO':
        base_price = 285.0
    elif symbol == 'QQQ':
        base_price = 214.0
    elif symbol == 'BND':
        base_price = 79.0
    elif symbol == 'VT':
        base_price = 70.0
    
    # 設定年報酬率和波動率
    annual_return = 0.08  # 8% 年化報酬
    annual_vol = 0.16     # 16% 年化波動率
    
    # 日報酬率參數
    daily_return = annual_return / 252
    daily_vol = annual_vol / (252 ** 0.5)
    
    current_date = start
    current_price = base_price
    imported_count = 0
    
    random.seed(42)  # 固定隨機種子以便重現
    
    while current_date <= end:
        # 跳過週末
        if current_date.weekday() >= 5:
            current_date += timedelta(days=1)
            continue
        
        # 產生隨機日報酬
        daily_change = np.random.normal(daily_return, daily_vol)
        
        # 2020 年 3 月 COVID 下跌
        if current_date.year == 2020 and current_date.month == 3:
            daily_change -= 0.03
        
        # 2022 年熊市
        if current_date.year == 2022:
            daily_change -= 0.001
        
        # 計算新價格
        current_price *= (1 + daily_change)
        
        # 產生當日價格範圍
        intraday_vol = 0.01
        high = current_price * (1 + abs(np.random.normal(0, intraday_vol)))
        low = current_price * (1 - abs(np.random.normal(0, intraday_vol)))
        open_price = low + (high - low) * random.random()
        close = current_price
        
        # 每季配息（只在特定日期）
        dividend = 0
        if symbol != 'QQQ' and current_date.day <= 7 and current_date.month in [3, 6, 9, 12]:
            dividend = current_price * 0.005  # 約 2% 年配息
        
        try:
            price = ETFPrice(
                symbol=symbol,
                date=current_date,
                open_price=Decimal(str(round(open_price, 2))),
                high_price=Decimal(str(round(high, 2))),
                low_price=Decimal(str(round(low, 2))),
                close_price=Decimal(str(round(close, 2))),
                adjusted_close=Decimal(str(round(close, 2))),
                volume=random.randint(1000000, 5000000),
                dividend=Decimal(str(round(dividend, 3))) if dividend > 0 else None
            )
            
            db.add(price)
            imported_count += 1
            
        except Exception as e:
            print(f"錯誤: {current_date} - {e}")
        
        current_date += timedelta(days=1)
    
    db.commit()
    return imported_count


def main():
    parser = argparse.ArgumentParser(description='匯入 ETF 歷史價格資料')
    parser.add_argument('--csv', type=str, help='CSV 檔案路徑')
    parser.add_argument('--generate', action='store_true', help='產生模擬資料')
    parser.add_argument('--symbol', type=str, help='ETF 代碼（用於產生資料）')
    parser.add_argument('--start-date', type=str, default='2020-01-01', help='開始日期')
    parser.add_argument('--end-date', type=str, default='2025-03-10', help='結束日期')
    
    args = parser.parse_args()
    
    db = SessionLocal()
    
    try:
        if args.csv:
            print(f"從 CSV 匯入: {args.csv}")
            count = import_from_csv(db, args.csv)
            print(f"✅ 成功匯入 {count} 筆資料")
            
        elif args.generate and args.symbol:
            print(f"產生 {args.symbol} 的模擬資料 ({args.start_date} ~ {args.end_date})")
            count = generate_sample_data(db, args.symbol, args.start_date, args.end_date)
            print(f"✅ 成功產生 {count} 筆資料")
            
        else:
            print("請指定 --csv 或 --generate --symbol")
            
    except Exception as e:
        print(f"❌ 錯誤: {e}")
        db.rollback()
        
    finally:
        db.close()


if __name__ == '__main__':
    main()
