#!/usr/bin/env python3
"""
生成高品質示範資料（反映真實市場特性）
包含：2020 COVID 崩盤、2021 反彈、2022 熊市、2023-24 AI 熱潮
"""

import sys
sys.path.insert(0, 'backend')

from datetime import datetime, date, timedelta
from decimal import Decimal
import random
import numpy as np

from app.db.session import SessionLocal
from app.models.etf import ETFPrice

# 設定隨機種子確保可重現
np.random.seed(42)
random.seed(42)

# ETF 基礎設定（基於真實歷史特性）
ETF_CONFIG = {
    # 美股大盤
    'VUAA': {'base_price': 24.0, 'annual_return': 0.12, 'volatility': 0.18, 'dividend_yield': 0.015},
    'VTI': {'base_price': 135.0, 'annual_return': 0.11, 'volatility': 0.18, 'dividend_yield': 0.015},
    'VOO': {'base_price': 285.0, 'annual_return': 0.11, 'volatility': 0.17, 'dividend_yield': 0.016},
    'QQQ': {'base_price': 214.0, 'annual_return': 0.15, 'volatility': 0.22, 'dividend_yield': 0.006},
    
    # 因子投資
    'VTV': {'base_price': 95.0, 'annual_return': 0.09, 'volatility': 0.16, 'dividend_yield': 0.025},
    'VUG': {'base_price': 145.0, 'annual_return': 0.13, 'volatility': 0.20, 'dividend_yield': 0.008},
    'VBR': {'base_price': 88.0, 'annual_return': 0.10, 'volatility': 0.20, 'dividend_yield': 0.022},
    'VBK': {'base_price': 135.0, 'annual_return': 0.11, 'volatility': 0.22, 'dividend_yield': 0.008},
    'AVUV': {'base_price': 55.0, 'annual_return': 0.10, 'volatility': 0.21, 'dividend_yield': 0.018},
    
    # 股息
    'VIG': {'base_price': 92.0, 'annual_return': 0.10, 'volatility': 0.15, 'dividend_yield': 0.020},
    'VYM': {'base_price': 75.0, 'annual_return': 0.09, 'volatility': 0.16, 'dividend_yield': 0.030},
    'SCHD': {'base_price': 42.0, 'annual_return': 0.10, 'volatility': 0.15, 'dividend_yield': 0.035},
    
    # 債券
    'BND': {'base_price': 79.0, 'annual_return': 0.02, 'volatility': 0.06, 'dividend_yield': 0.028},
    
    # 國際
    'VT': {'base_price': 70.0, 'annual_return': 0.10, 'volatility': 0.17, 'dividend_yield': 0.018},
    'VXUS': {'base_price': 50.0, 'annual_return': 0.08, 'volatility': 0.19, 'dividend_yield': 0.025},
    'AVWS': {'base_price': 35.0, 'annual_return': 0.08, 'volatility': 0.20, 'dividend_yield': 0.022},
}

# 真實市場事件影響（根據歷史）
MARKET_EVENTS = {
    # 2020 COVID 崩盤
    ('2020-02-20', '2020-03-23'): {'impact': -0.35, 'description': 'COVID Crash'},
    ('2020-03-24', '2020-08-31'): {'impact': 0.45, 'description': 'COVID Recovery'},
    
    # 2022 熊市
    ('2022-01-01', '2022-06-30'): {'impact': -0.20, 'description': '2022 Bear Market'},
    ('2022-07-01', '2022-10-14'): {'impact': -0.08, 'description': '2022 H2 Decline'},
    
    # 2023 AI 熱潮
    ('2023-01-01', '2023-12-31'): {'impact': 0.24, 'description': '2023 AI Rally'},
    
    # 2024 繼續上漲
    ('2024-01-01', '2024-12-31'): {'impact': 0.20, 'description': '2024 Rally'},
}


def get_market_adjustment(current_date: date) -> float:
    """根據歷史市場事件調整報酬"""
    adjustment = 0.0
    for (start, end), event in MARKET_EVENTS.items():
        start_date = datetime.strptime(start, '%Y-%m-%d').date()
        end_date = datetime.strptime(end, '%Y-%m-%d').date()
        if start_date <= current_date <= end_date:
            # 將總影響分散到每天
            days = (end_date - start_date).days
            daily_impact = event['impact'] / days
            adjustment += daily_impact
    return adjustment


def generate_etf_prices(symbol: str, start_date: str, end_date: str) -> int:
    """生成 ETF 價格資料"""
    
    if symbol not in ETF_CONFIG:
        print(f"⚠️  {symbol}: 無設定，跳過")
        return 0
    
    config = ETF_CONFIG[symbol]
    db = SessionLocal()
    
    # 檢查是否已有資料
    existing = db.query(ETFPrice).filter(ETFPrice.symbol == symbol).count()
    if existing > 0:
        print(f"⏭️  {symbol}: 已存在 {existing} 筆資料，跳過")
        db.close()
        return 0
    
    start = datetime.strptime(start_date, '%Y-%m-%d').date()
    end = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    # 日報酬參數
    daily_return = config['annual_return'] / 252
    daily_vol = config['volatility'] / (252 ** 0.5)
    
    current_date = start
    current_price = config['base_price']
    imported_count = 0
    
    # 記錄季度配息
    last_quarter = 0
    
    while current_date <= end:
        # 跳過週末
        if current_date.weekday() >= 5:
            current_date += timedelta(days=1)
            continue
        
        # 計算市場調整
        market_adj = get_market_adjustment(current_date)
        
        # 產生日報酬
        daily_change = np.random.normal(daily_return + market_adj, daily_vol)
        
        # 計算新價格
        current_price *= (1 + daily_change)
        
        # 產生當日價格範圍
        intraday_vol = daily_vol * 0.5
        high = current_price * (1 + abs(np.random.normal(0, intraday_vol)))
        low = current_price * (1 - abs(np.random.normal(0, intraday_vol)))
        open_price = low + (high - low) * random.random()
        close = current_price
        
        # 季度配息
        dividend = 0
        current_quarter = (current_date.month - 1) // 3
        if current_date.day <= 5 and current_quarter != last_quarter:
            if config['dividend_yield'] > 0:
                dividend = close * (config['dividend_yield'] / 4)  # 季度配息
                last_quarter = current_quarter
        
        try:
            price = ETFPrice(
                symbol=symbol,
                date=current_date,
                open_price=Decimal(str(round(open_price, 2))),
                high_price=Decimal(str(round(high, 2))),
                low_price=Decimal(str(round(low, 2))),
                close_price=Decimal(str(round(close, 2))),
                adjusted_close=Decimal(str(round(close, 2))),
                volume=random.randint(1000000, 15000000),
                dividend=Decimal(str(round(dividend, 3))) if dividend > 0 else None,
                data_source='demo_data',
                is_verified=False
            )
            
            db.add(price)
            imported_count += 1
            
            if imported_count % 500 == 0:
                db.commit()
                
        except Exception as e:
            print(f"  錯誤: {current_date} - {e}")
        
        current_date += timedelta(days=1)
    
    db.commit()
    db.close()
    
    print(f"✅ {symbol}: 成功生成 {imported_count} 筆示範資料")
    return imported_count


def main():
    """生成所有 ETF 的示範資料"""
    
    print("=" * 60)
    print("生成高品質示範資料（基於真實市場特性）")
    print("=" * 60)
    print()
    print("⚠️  注意：這是示範資料，用於測試系統功能")
    print("   如需真實資料，請從 Yahoo Finance 下載 CSV 匯入")
    print()
    
    start_date = '2020-01-01'
    end_date = '2024-12-31'
    
    total = 0
    for symbol in ETF_CONFIG.keys():
        count = generate_etf_prices(symbol, start_date, end_date)
        total += count
    
    print()
    print("=" * 60)
    print(f"總共生成 {total} 筆示範資料")
    print("=" * 60)


if __name__ == '__main__':
    main()
