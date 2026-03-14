"""
績效指標計算模組

計算各種投資績效指標，包括：
- 報酬率指標（CAGR、總報酬）
- 風險指標（標準差、最大回撤）
- 風險調整後報酬（夏普比率、索丁諾比率）
"""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import List, Optional, Tuple

import numpy as np
import pandas as pd


@dataclass
class PerformanceMetrics:
    """績效指標數據類別"""
    # 報酬率指標
    total_return: float          # 總報酬率
    cagr: float                  # 年化報酬率 (Compound Annual Growth Rate)
    annualized_return: float     # 年化報酬率（另一種計算方式）
    
    # 風險指標
    volatility: float            # 年化標準差（波動率）
    max_drawdown: float          # 最大回撤
    max_drawdown_duration: int   # 最大回撤持續天數
    
    # 風險調整後報酬
    sharpe_ratio: float          # 夏普比率
    sortino_ratio: float         # 索丁諾比率
    calmar_ratio: float          # 卡瑪比率
    
    # 其他指標
    best_year: float             # 最佳年度報酬
    worst_year: float            # 最差年度報酬
    positive_years: int          # 正報酬年數
    negative_years: int          # 負報酬年數
    avg_up_month: float          # 平均上漲月份報酬
    avg_down_month: float        # 平均下跌月份報酬
    
    # 風險值
    var_95: float                # 95% 風險值 (Value at Risk)
    cvar_95: float               # 95% 條件風險值 (Conditional VaR)


class MetricsCalculator:
    """
    績效指標計算器
    
    從回測結果計算各種績效指標
    """
    
    # 無風險利率（假設 2%，可調整）
    RISK_FREE_RATE = 0.02
    
    @classmethod
    def calculate_metrics(
        cls,
        portfolio_values: List[Tuple[date, Decimal]],
        benchmark_values: Optional[List[Tuple[date, Decimal]]] = None
    ) -> PerformanceMetrics:
        """
        計算績效指標
        
        Args:
            portfolio_values: 組合價值列表 [(date, value), ...]
            benchmark_values: 基準價值列表（可選）
        
        Returns:
            PerformanceMetrics: 績效指標
        """
        # 轉換為 pandas Series
        dates = [d for d, _ in portfolio_values]
        values = [float(v) for _, v in portfolio_values]
        
        df = pd.DataFrame({
            'date': dates,
            'value': values
        })
        df.set_index('date', inplace=True)
        df.index = pd.to_datetime(df.index)  # 確保是 DatetimeIndex
        
        # 計算日報酬率
        df['daily_return'] = df['value'].pct_change()
        
        # 基本指標
        total_return = cls._calculate_total_return(df['value'])
        cagr = cls._calculate_cagr(df['value'], dates[0], dates[-1])
        volatility = cls._calculate_volatility(df['daily_return'])
        max_dd, max_dd_duration = cls._calculate_max_drawdown(df['value'])
        
        # 風險調整後報酬
        sharpe = cls._calculate_sharpe_ratio(df['daily_return'])
        sortino = cls._calculate_sortino_ratio(df['daily_return'])
        calmar = cls._calculate_calmar_ratio(cagr, max_dd)
        
        # 年度統計
        yearly_stats = cls._calculate_yearly_stats(df)
        monthly_stats = cls._calculate_monthly_stats(df)
        
        # 風險值
        var_95, cvar_95 = cls._calculate_var(df['daily_return'].dropna())
        
        return PerformanceMetrics(
            total_return=total_return,
            cagr=cagr,
            annualized_return=cagr,  # 這裡相同
            volatility=volatility,
            max_drawdown=max_dd,
            max_drawdown_duration=max_dd_duration,
            sharpe_ratio=sharpe,
            sortino_ratio=sortino,
            calmar_ratio=calmar,
            best_year=yearly_stats['best'],
            worst_year=yearly_stats['worst'],
            positive_years=yearly_stats['positive'],
            negative_years=yearly_stats['negative'],
            avg_up_month=monthly_stats['avg_up'],
            avg_down_month=monthly_stats['avg_down'],
            var_95=var_95,
            cvar_95=cvar_95
        )
    
    @staticmethod
    def _calculate_total_return(values: pd.Series) -> float:
        """計算總報酬率"""
        if len(values) < 2:
            return 0.0
        return (values.iloc[-1] / values.iloc[0]) - 1
    
    @staticmethod
    def _calculate_cagr(
        values: pd.Series,
        start_date: date,
        end_date: date
    ) -> float:
        """
        計算年化報酬率 (CAGR)
        
        公式: (期末價值/期初價值)^(1/年數) - 1
        """
        if len(values) < 2:
            return 0.0
        
        years = (end_date - start_date).days / 365.25
        if years <= 0:
            return 0.0
        
        total_return = values.iloc[-1] / values.iloc[0]
        cagr = (total_return ** (1 / years)) - 1
        return cagr
    
    @staticmethod
    def _calculate_volatility(daily_returns: pd.Series) -> float:
        """
        計算年化波動率（標準差）
        
        公式: 日報酬標準差 × √252
        """
        if len(daily_returns.dropna()) < 2:
            return 0.0
        
        daily_std = daily_returns.std()
        annualized_vol = daily_std * np.sqrt(252)
        return annualized_vol
    
    @staticmethod
    def _calculate_max_drawdown(values: pd.Series) -> Tuple[float, int]:
        """
        計算最大回撤
        
        公式: max(1 - 當前價值/歷史最高價值)
        
        Returns:
            Tuple[float, int]: (最大回撤百分比, 持續天數)
        """
        if len(values) < 2:
            return 0.0, 0
        
        # 計算歷史最高價值
        peak = values.expanding().max()
        
        # 計算回撤
        drawdown = (values - peak) / peak
        
        # 最大回撤
        max_dd = drawdown.min()
        
        # 計算回撤持續天數
        max_dd_idx = drawdown.idxmin()
        peak_before_dd = values[:max_dd_idx].idxmax()
        duration = (max_dd_idx - peak_before_dd).days
        
        return max_dd, duration
    
    @classmethod
    def _calculate_sharpe_ratio(cls, daily_returns: pd.Series) -> float:
        """
        計算夏普比率
        
        公式: (投組報酬率 - 無風險利率) / 標準差
        """
        if len(daily_returns.dropna()) < 2:
            return 0.0
        
        # 年化報酬率
        annual_return = daily_returns.mean() * 252
        
        # 年化標準差
        annual_std = daily_returns.std() * np.sqrt(252)
        
        if annual_std == 0:
            return 0.0
        
        sharpe = (annual_return - cls.RISK_FREE_RATE) / annual_std
        return sharpe
    
    @classmethod
    def _calculate_sortino_ratio(cls, daily_returns: pd.Series) -> float:
        """
        計算索丁諾比率
        
        公式: (投組報酬率 - 無風險利率) / 下行標準差
        
        只考慮下跌風險，更符合投資人感受
        """
        if len(daily_returns.dropna()) < 2:
            return 0.0
        
        # 年化報酬率
        annual_return = daily_returns.mean() * 252
        
        # 計算下行標準差（只取負報酬）
        downside_returns = daily_returns[daily_returns < 0]
        if len(downside_returns) == 0:
            return float('inf')  # 無下跌，比率無限大
        
        downside_std = downside_returns.std() * np.sqrt(252)
        
        if downside_std == 0:
            return 0.0
        
        sortino = (annual_return - cls.RISK_FREE_RATE) / downside_std
        return sortino
    
    @staticmethod
    def _calculate_calmar_ratio(cagr: float, max_drawdown: float) -> float:
        """
        計算卡瑪比率
        
        公式: 年化報酬率 / |最大回撤|
        """
        if max_drawdown == 0:
            return 0.0
        
        calmar = cagr / abs(max_drawdown)
        return calmar
    
    @staticmethod
    def _calculate_yearly_stats(df: pd.DataFrame) -> dict:
        """計算年度統計"""
        df['year'] = df.index.year
        yearly_returns = df.groupby('year')['value'].apply(
            lambda x: (x.iloc[-1] / x.iloc[0]) - 1
        )
        
        return {
            'best': yearly_returns.max(),
            'worst': yearly_returns.min(),
            'positive': (yearly_returns > 0).sum(),
            'negative': (yearly_returns < 0).sum()
        }
    
    @staticmethod
    def _calculate_monthly_stats(df: pd.DataFrame) -> dict:
        """計算月份統計"""
        df['year_month'] = df.index.to_period('M')
        monthly_returns = df.groupby('year_month')['value'].apply(
            lambda x: (x.iloc[-1] / x.iloc[0]) - 1
        )
        
        up_months = monthly_returns[monthly_returns > 0]
        down_months = monthly_returns[monthly_returns < 0]
        
        return {
            'avg_up': up_months.mean() if len(up_months) > 0 else 0,
            'avg_down': down_months.mean() if len(down_months) > 0 else 0
        }
    
    @staticmethod
    def calculate_drawdown_series(
        portfolio_values: List[Tuple[date, Decimal]]
    ) -> List[Tuple[date, float]]:
        """
        計算回撤時間序列
        
        Returns:
            List[Tuple[date, float]]: [(日期, 回撤百分比), ...]
        """
        if len(portfolio_values) < 2:
            return []
        
        dates = [d for d, _ in portfolio_values]
        values = [float(v) for _, v in portfolio_values]
        
        df = pd.DataFrame({'date': dates, 'value': values})
        df.set_index('date', inplace=True)
        
        # 計算歷史最高價值
        peak = df['value'].expanding().max()
        
        # 計算回撤百分比
        drawdown = (df['value'] - peak) / peak
        
        return [(d, float(dd)) for d, dd in zip(dates, drawdown.values)]
    
    @staticmethod
    def _calculate_var(daily_returns: pd.Series, confidence: float = 0.95) -> Tuple[float, float]:
        """
        計算風險值 (VaR) 和條件風險值 (CVaR)
        
        Args:
            daily_returns: 日報酬率序列
            confidence: 信心水準（預設 95%）
        
        Returns:
            Tuple[float, float]: (VaR, CVaR)
        """
        if len(daily_returns) == 0:
            return 0.0, 0.0
        
        # 歷史模擬法計算 VaR
        var = np.percentile(daily_returns, (1 - confidence) * 100)
        
        # CVaR = 超過 VaR 的平均損失
        cvar = daily_returns[daily_returns <= var].mean()
        
        # 年化
        var_annual = var * np.sqrt(252)
        cvar_annual = cvar * np.sqrt(252) if not np.isnan(cvar) else 0
        
        return var_annual, cvar_annual
