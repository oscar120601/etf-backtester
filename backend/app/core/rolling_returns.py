"""
滾動報酬分析模組

計算投資組合在不同滾動期間的報酬率分布，用於評估
投資組合在各種持有期間的表現穩定性。
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from datetime import date
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.models.etf import ETFPrice


@dataclass
class RollingReturnsStats:
    """滾動報酬統計"""
    window_years: int
    mean: float
    median: float
    std: float
    min: float
    max: float
    percentile_5: float
    percentile_25: float
    percentile_75: float
    percentile_95: float
    positive_ratio: float  # 正報酬期間比例


@dataclass
class RollingReturnsResult:
    """滾動報酬結果"""
    window_years: int
    dates: List[date]
    returns: List[float]  # 滾動報酬率列表
    stats: RollingReturnsStats


class RollingReturnsCalculator:
    """
    滾動報酬計算器
    
    計算投資組合在 1年/3年/5年/10年 等不同持有期間的報酬率分布。
    """
    
    # 預設滾動期間（年）
    DEFAULT_WINDOWS = [1, 3, 5, 10]
    
    def __init__(self, db: Session):
        """
        初始化計算器
        
        Args:
            db: 資料庫 Session
        """
        self.db = db
    
    def calculate(
        self,
        portfolio: Dict[str, float],  # {symbol: weight}
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        window_years: List[int] = None
    ) -> Tuple[Dict[int, RollingReturnsResult], List[Dict]]:
        """
        計算滾動報酬
        
        Args:
            portfolio: 投資組合 {symbol: weight}
            start_date: 開始日期
            end_date: 結束日期
            window_years: 滾動期間列表（年），預設 [1, 3, 5, 10]
            
        Returns:
            Tuple[Dict[int, RollingReturnsResult], List[Dict]]: 
                - 各期間的滾動報酬結果
                - 被跳過的期間及原因
        """
        if window_years is None:
            window_years = self.DEFAULT_WINDOWS
        
        # 獲取價格資料
        prices_df = self._fetch_portfolio_prices(portfolio, start_date, end_date)
        
        if prices_df.empty:
            raise ValueError("無法獲取價格資料")
        
        # 檢查個別 ETF 的資料長度，以便告知用戶是哪檔 ETF 導致數據不足
        etf_durations = {}
        for symbol in portfolio.keys():
            if symbol in prices_df.columns:
                valid_prices = prices_df[symbol].dropna()
                if not valid_prices.empty:
                    days = len(valid_prices)
                    years = days / 252
                    etf_durations[symbol] = years
        
        # 計算組合日報酬率
        portfolio_returns = self._calculate_portfolio_returns(prices_df, portfolio)
        
        results = {}
        skipped_windows = []
        
        for window in window_years:
            # 檢查資料是否足夠
            min_days = window * 252  # 約略交易日數
            if len(portfolio_returns) < min_days:
                # 找出哪些 ETF 限制了這個 window
                limiting_etfs = [s for s, y in etf_durations.items() if y < window]
                skipped_windows.append({
                    "window": window,
                    "reason": "insufficient_data",
                    "limiting_etfs": limiting_etfs,
                    "available_years": round(len(portfolio_returns) / 252, 1)
                })
                continue
            
            # 計算滾動報酬
            rolling_result = self._calculate_rolling_returns(
                portfolio_returns, window
            )
            results[window] = rolling_result
        
        return results, skipped_windows
    
    def _fetch_portfolio_prices(
        self,
        portfolio: Dict[str, float],
        start_date: Optional[date],
        end_date: Optional[date]
    ) -> pd.DataFrame:
        """
        獲取投資組合的歷史價格
        
        Args:
            portfolio: 投資組合
            start_date: 開始日期
            end_date: 結束日期
            
        Returns:
            pd.DataFrame: 價格資料
        """
        symbols = list(portfolio.keys())
        
        # 為了計算滾動報酬，需要額外的歷史資料
        # 如果要計算 10 年滾動報酬，需要至少 10+ 年的資料
        if start_date:
            # 往前多抓一些資料
            start_date = start_date.replace(year=start_date.year - 12)
        
        query = self.db.query(ETFPrice).filter(
            ETFPrice.symbol.in_(symbols)
        )
        
        if start_date:
            query = query.filter(ETFPrice.date >= start_date)
        if end_date:
            query = query.filter(ETFPrice.date <= end_date)
        
        prices = query.all()
        
        if not prices:
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
    
    def _calculate_portfolio_returns(
        self,
        prices_df: pd.DataFrame,
        portfolio: Dict[str, float]
    ) -> pd.Series:
        """
        計算投資組合的日報酬率
        
        Args:
            prices_df: 價格資料
            portfolio: 投資組合權重
            
        Returns:
            pd.Series: 組合日報酬率
        """
        # 計算各資產日報酬率
        returns_df = prices_df.pct_change().dropna()
        
        # 加權計算組合報酬率
        weights = pd.Series(portfolio)
        portfolio_returns = (returns_df * weights).sum(axis=1)
        
        return portfolio_returns
    
    def _calculate_rolling_returns(
        self,
        daily_returns: pd.Series,
        window_years: int
    ) -> RollingReturnsResult:
        """
        計算指定期間的滾動報酬
        
        Args:
            daily_returns: 日報酬率序列
            window_years: 滾動期間（年）
            
        Returns:
            RollingReturnsResult: 滾動報酬結果
        """
        # 交易日數
        trading_days = window_years * 252
        
        # 計算滾動累積報酬
        # 方法：將日報酬轉換為累積因子，計算 rolling 乘積
        daily_factors = 1 + daily_returns
        
        # 使用對數報酬計算更穩定
        log_returns = np.log(daily_factors)
        rolling_log_returns = log_returns.rolling(window=trading_days).sum()
        
        # 轉回簡單報酬率
        rolling_returns = np.exp(rolling_log_returns) - 1
        
        # 移除 NaN
        rolling_returns = rolling_returns.dropna()
        
        # 計算統計量
        returns_array = rolling_returns.values
        
        stats = RollingReturnsStats(
            window_years=window_years,
            mean=float(np.mean(returns_array)),
            median=float(np.median(returns_array)),
            std=float(np.std(returns_array)),
            min=float(np.min(returns_array)),
            max=float(np.max(returns_array)),
            percentile_5=float(np.percentile(returns_array, 5)),
            percentile_25=float(np.percentile(returns_array, 25)),
            percentile_75=float(np.percentile(returns_array, 75)),
            percentile_95=float(np.percentile(returns_array, 95)),
            positive_ratio=float(np.mean(returns_array > 0))
        )
        
        return RollingReturnsResult(
            window_years=window_years,
            dates=rolling_returns.index.tolist(),
            returns=rolling_returns.tolist(),
            stats=stats
        )
    
    def get_summary(
        self,
        results: Dict[int, RollingReturnsResult]
    ) -> Dict:
        """
        取得滾動報酬摘要
        
        Args:
            results: 滾動報酬結果
            
        Returns:
            Dict: 摘要資訊
        """
        summary = {
            "periods": {},
            "best_period": None,
            "worst_period": None,
            "most_consistent": None,
        }
        
        best_sharpe = -float('inf')
        worst_return = float('inf')
        lowest_std = float('inf')
        
        for window, result in results.items():
            stats = result.stats
            
            # 計算夏普-like 比率 (mean / std)
            sharpe_like = stats.mean / stats.std if stats.std > 0 else 0
            
            summary["periods"][window] = {
                "window_years": window,
                "mean_return": round(stats.mean * 100, 2),
                "median_return": round(stats.median * 100, 2),
                "std": round(stats.std * 100, 2),
                "min": round(stats.min * 100, 2),
                "max": round(stats.max * 100, 2),
                "percentile_5": round(stats.percentile_5 * 100, 2),
                "percentile_95": round(stats.percentile_95 * 100, 2),
                "positive_ratio": round(stats.positive_ratio * 100, 2),
                "sharpe_like": round(sharpe_like, 2),
                "num_observations": len(result.returns)
            }
            
            # 最佳期間（最高夏普-like）
            if sharpe_like > best_sharpe:
                best_sharpe = sharpe_like
                summary["best_period"] = window
            
            # 最差期間（最低平均報酬）
            if stats.mean < worst_return:
                worst_return = stats.mean
                summary["worst_period"] = window
            
            # 最穩定期間（最低標準差）
            if stats.std < lowest_std:
                lowest_std = stats.std
                summary["most_consistent"] = window
        
        return summary
