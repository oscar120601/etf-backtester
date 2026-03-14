"""
回測引擎核心模組

負責執行投資組合的歷史回測計算，包括：
- 投資組合價值追蹤
- 再平衡處理
- 配息再投資
- 績效指標計算
"""

from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.models.etf import ETF, ETFPrice


class RebalanceFrequency(str, Enum):
    """再平衡頻率"""
    NONE = "none"           # 不進行再平衡
    MONTHLY = "monthly"     # 每月
    QUARTERLY = "quarterly" # 每季
    ANNUAL = "annual"       # 每年
    YEARLY = "yearly"       # 每年（別名）


@dataclass
class PortfolioHolding:
    """投資組合持倉"""
    symbol: str
    weight: Decimal  # 目標權重
    shares: Decimal = Decimal("0")  # 持有股數
    value: Decimal = Decimal("0")   # 當前價值


@dataclass
class BacktestConfig:
    """回測配置"""
    start_date: date
    end_date: date
    initial_amount: Decimal = Decimal("10000")
    rebalance_frequency: str = "annual"
    monthly_contribution: Optional[Decimal] = None
    reinvest_dividends: bool = True


@dataclass
class BacktestResult:
    """單日回測結果"""
    date: date
    portfolio_value: Decimal
    holdings: Dict[str, PortfolioHolding]
    cash: Decimal
    dividend: Decimal = Decimal("0")


class BacktestEngine:
    """
    回測引擎
    
    執行投資組合的歷史回測，支援：
    - 定期再平衡
    - 配息處理
    - 現金流（定期定額）
    """
    
    def __init__(self, db: Session):
        """
        初始化回測引擎
        
        Args:
            db: 資料庫 Session
        """
        self.db = db
    
    def run_backtest(
        self,
        holdings_config: List[Dict[str, any]],  # [{"symbol": "VTI", "weight": 0.6}, ...]
        start_date: date,
        end_date: date,
        initial_amount: Decimal = Decimal("10000"),
        rebalance_frequency: RebalanceFrequency = RebalanceFrequency.ANNUAL,
        monthly_contribution: Optional[Decimal] = None,
        reinvest_dividends: bool = True
    ) -> List[BacktestResult]:
        """
        執行回測
        
        Args:
            holdings_config: 投資組合配置 [{symbol, weight}, ...]
            start_date: 開始日期
            end_date: 結束日期
            initial_amount: 初始金額
            rebalance_frequency: 再平衡頻率
            monthly_contribution: 每月定期投入金額（可選）
            reinvest_dividends: 是否將配息再投資
        
        Returns:
            List[BacktestResult]: 每日回測結果
        """
        # 驗證權重總和
        total_weight = sum(h["weight"] for h in holdings_config)
        if abs(total_weight - 1.0) > 0.001:
            raise ValueError(f"權重總和必須為 100%，目前為 {total_weight * 100:.2f}%")
        
        # 獲取歷史價格資料
        symbols = [h["symbol"] for h in holdings_config]
        prices_df = self._fetch_historical_prices(symbols, start_date, end_date)
        
        if prices_df.empty:
            raise ValueError("無法獲取價格資料，請確認日期範圍和 ETF 代碼是否正確")
        
        # 初始化投資組合
        results = []
        portfolio_value = initial_amount
        cash = Decimal("0")
        
        # 初始化持倉
        holdings = {}
        for config in holdings_config:
            symbol = config["symbol"]
            weight = Decimal(str(config["weight"]))
            initial_investment = portfolio_value * weight
            
            # 取得第一天的價格
            first_price = prices_df[symbol].iloc[0]
            shares = initial_investment / Decimal(str(first_price))
            
            holdings[symbol] = PortfolioHolding(
                symbol=symbol,
                weight=weight,
                shares=shares,
                value=initial_investment
            )
        
        # 逐日回測
        for current_date in pd.date_range(start=start_date, end=end_date, freq='D'):
            current_date = current_date.date()
            
            # 檢查是否有價格資料
            if current_date not in prices_df.index:
                continue
            
            daily_prices = prices_df.loc[current_date]
            
            # 計算當日組合價值
            portfolio_value = Decimal("0")
            total_dividend = Decimal("0")
            
            for symbol, holding in holdings.items():
                if symbol in daily_prices and pd.notna(daily_prices[symbol]):
                    price = Decimal(str(daily_prices[symbol]))
                    holding.value = holding.shares * price
                    portfolio_value += holding.value
                    
                    # 檢查是否有配息
                    dividend = self._get_dividend(symbol, current_date)
                    if dividend > 0:
                        dividend_amount = holding.shares * dividend
                        total_dividend += dividend_amount
                        
                        if reinvest_dividends:
                            # 配息再投資
                            new_shares = dividend_amount / price
                            holding.shares += new_shares
                        else:
                            # 配息入現金
                            cash += dividend_amount
            
            portfolio_value += cash
            
            # 處理定期定額（每月第一天）
            if monthly_contribution and current_date.day == 1:
                cash += monthly_contribution
                portfolio_value += monthly_contribution
            
            # 檢查是否需要再平衡
            if self._should_rebalance(current_date, rebalance_frequency):
                holdings, cash = self._rebalance(
                    holdings, portfolio_value, daily_prices, cash
                )
            
            # 記錄結果
            results.append(BacktestResult(
                date=current_date,
                portfolio_value=portfolio_value,
                holdings={symbol: PortfolioHolding(
                    symbol=h.symbol,
                    weight=h.weight,
                    shares=h.shares,
                    value=h.value
                ) for symbol, h in holdings.items()},
                cash=cash,
                dividend=total_dividend
            ))
        
        return results
    
    def _fetch_historical_prices(
        self,
        symbols: List[str],
        start_date: date,
        end_date: date
    ) -> pd.DataFrame:
        """
        從資料庫獲取歷史價格資料
        
        Args:
            symbols: ETF 代碼列表
            start_date: 開始日期
            end_date: 結束日期
        
        Returns:
            pd.DataFrame: 價格資料，欄位為各 ETF symbol，索引為日期
        """
        # 查詢資料庫
        prices = self.db.query(ETFPrice).filter(
            ETFPrice.symbol.in_(symbols),
            ETFPrice.date >= start_date,
            ETFPrice.date <= end_date
        ).all()
        
        if not prices:
            # 如果沒有資料，返回空的 DataFrame
            # 實際使用時應該從外部 API 獲取
            return pd.DataFrame()
        
        # 轉換為 DataFrame
        data = []
        for price in prices:
            data.append({
                "date": price.date,
                "symbol": price.symbol,
                "price": float(price.adjusted_close)
            })
        
        df = pd.DataFrame(data)
        df = df.pivot(index="date", columns="symbol", values="price")
        df = df.sort_index()
        
        return df
    
    def _get_dividend(self, symbol: str, date: date) -> Decimal:
        """
        獲取指定日期的配息
        
        Args:
            symbol: ETF 代碼
            date: 日期
        
        Returns:
            Decimal: 配息金額（無配息則返回 0）
        """
        # 查詢資料庫中的配息記錄
        # 這裡簡化處理，實際應該查詢 etf_dividends 表
        return Decimal("0")
    
    def _should_rebalance(
        self,
        current_date: date,
        frequency: RebalanceFrequency
    ) -> bool:
        """
        檢查是否需要再平衡
        
        Args:
            current_date: 當前日期
            frequency: 再平衡頻率
        
        Returns:
            bool: 是否需要再平衡
        """
        if frequency == RebalanceFrequency.NONE:
            return False
        
        if frequency == RebalanceFrequency.MONTHLY:
            return current_date.day == 1
        
        if frequency == RebalanceFrequency.QUARTERLY:
            return current_date.day == 1 and current_date.month in [1, 4, 7, 10]
        
        if frequency == RebalanceFrequency.ANNUAL:
            return current_date.day == 1 and current_date.month == 1
        
        return False
    
    def _rebalance(
        self,
        holdings: Dict[str, PortfolioHolding],
        portfolio_value: Decimal,
        prices: pd.Series,
        cash: Decimal
    ) -> Tuple[Dict[str, PortfolioHolding], Decimal]:
        """
        執行再平衡
        
        Args:
            holdings: 當前持倉
            portfolio_value: 組合總價值
            prices: 當日價格
            cash: 現金
        
        Returns:
            Tuple[Dict[str, PortfolioHolding], Decimal]: 新的持倉和現金
        """
        total_value = portfolio_value
        
        for symbol, holding in holdings.items():
            if symbol in prices and pd.notna(prices[symbol]):
                target_value = total_value * holding.weight
                price = Decimal(str(prices[symbol]))
                
                # 計算目標股數
                target_shares = target_value / price
                
                # 調整股數
                holding.shares = target_shares
                holding.value = target_shares * price
        
        return holdings, cash
    
    def run_monte_carlo(
        self,
        holdings: List[PortfolioHolding],
        years: int,
        initial_amount: Decimal,
        monthly_contribution: Decimal,
        simulations: int,
        confidence_levels: List[float] = None
    ) -> Dict:
        """
        執行蒙地卡羅模擬
        
        Args:
            holdings: 投資組合持倉列表
            years: 模擬年數
            initial_amount: 初始金額
            monthly_contribution: 每月定期投入金額
            simulations: 模擬次數
            confidence_levels: 信心水準列表
        
        Returns:
            Dict: 模擬結果，包含 percentiles, paths, success_probability
        """
        if confidence_levels is None:
            confidence_levels = [0.5, 0.75, 0.9, 0.95]
        
        # 獲取歷史資料計算報酬率和波動率
        symbols = [h.symbol for h in holdings]
        weights = [float(h.weight) for h in holdings]
        
        # 獲取歷史價格（使用過去5年）
        end_date = date.today()
        start_date = end_date - timedelta(days=365 * 5)
        prices_df = self._fetch_historical_prices(symbols, start_date, end_date)
        
        if prices_df.empty:
            raise ValueError("無法獲取歷史價格資料")
        
        # 計算日報酬率
        returns_df = prices_df.pct_change().dropna()
        
        # 計算年化報酬率和共變異數矩陣
        annual_returns = returns_df.mean() * 252
        annual_cov = returns_df.cov() * 252
        
        # 確保共變異數矩陣是有效的（對角線為正值）
        if np.any(np.diag(annual_cov) <= 0):
            annual_cov = np.diag(np.diag(annual_cov))
            annual_cov[annual_cov <= 0] = 0.0001
        
        # 確保權重總和為 1
        weights = np.array(weights)
        weights = weights / weights.sum()
        
        # 模擬參數
        trading_days_per_year = 252
        total_days = years * trading_days_per_year
        
        # 儲存每年的所有模擬結果（用於計算百分位數）
        yearly_values = {year: [] for year in range(years + 1)}
        
        # 執行模擬
        for _ in range(simulations):
            # 使用幾何布朗運動進行模擬
            daily_returns = np.random.multivariate_normal(
                annual_returns / trading_days_per_year,
                annual_cov / trading_days_per_year,
                total_days
            )
            
            # 計算組合日報酬（加權平均）
            portfolio_daily_returns = np.dot(daily_returns, weights)
            
            # 計算累積價值
            portfolio_value = float(initial_amount)
            yearly_values[0].append(portfolio_value)  # 第0年 = 初始金額
            
            for day in range(total_days):
                # 價值增長（限制單日漲跌幅度）
                daily_return = max(-0.2, min(0.2, portfolio_daily_returns[day]))
                portfolio_value *= (1 + daily_return)
                
                # 每月投入（假設每月21個交易日）
                if day > 0 and day % 21 == 0:
                    portfolio_value += float(monthly_contribution)
                
                # 每年記錄一次
                if (day + 1) % trading_days_per_year == 0:
                    year = (day + 1) // trading_days_per_year
                    if year <= years:
                        yearly_values[year].append(portfolio_value)
        
        # 計算每年的百分位數
        percentiles = {}
        percentile_keys = ['5', '25', '50', '75', '95']
        
        for p_key in percentile_keys:
            p_value = int(p_key)
            percentiles[p_key] = {}
            for year in range(years + 1):
                if yearly_values[year]:
                    percentiles[p_key][str(year)] = float(np.percentile(yearly_values[year], p_value))
                else:
                    percentiles[p_key][str(year)] = 0.0
        
        # 建立 paths（每個百分位數一條路徑）
        paths = []
        for p_key in percentile_keys:
            path_values = []
            for year in range(years + 1):
                path_values.append(percentiles[p_key][str(year)])
            paths.append({
                'percentile': p_key,
                'values': path_values
            })
        
        # 計算成功率（達成目標金額的機率）
        target_value = float(initial_amount) * 2  # 預設目標是翻倍
        final_values = yearly_values[years]
        success_rate = (np.array(final_values) >= target_value).mean() if final_values else 0.0
        
        return {
            'simulations': simulations,
            'years': years,
            'percentiles': percentiles,
            'paths': paths,
            'success_probability': {
                'doubling': float(success_rate),
                'target_amount': target_value
            }
        }


# 向後兼容的別名
BacktestService = BacktestEngine
