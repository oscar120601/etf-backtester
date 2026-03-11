"""
回測相關的 Pydantic 模型
"""

from datetime import date
from decimal import Decimal
from typing import Dict, List, Optional, Any

from pydantic import BaseModel, Field, ConfigDict


class PortfolioHoldingInput(BaseModel):
    """投資組合持倉輸入"""
    symbol: str = Field(..., description="ETF 代碼", examples=["VTI"])
    weight: float = Field(..., ge=0, le=1, description="權重 (0-1)", examples=[0.6])


class BacktestParameters(BaseModel):
    """回測參數"""
    start_date: date = Field(..., description="開始日期", examples=["2020-01-01"])
    end_date: date = Field(..., description="結束日期", examples=["2024-12-31"])
    initial_amount: float = Field(default=10000, ge=1000, description="初始金額", examples=[10000])
    rebalance_frequency: str = Field(
        default="annual",
        description="再平衡頻率 (none/monthly/quarterly/annual)",
        examples=["annual"]
    )
    monthly_contribution: Optional[float] = Field(
        default=None,
        description="每月定期投入金額",
        examples=[500]
    )
    reinvest_dividends: bool = Field(
        default=True,
        description="是否將配息再投資"
    )


class BacktestRequest(BaseModel):
    """回測請求"""
    portfolio: List[PortfolioHoldingInput] = Field(
        ...,
        description="投資組合配置",
        min_length=1,
        max_length=10
    )
    parameters: BacktestParameters
    benchmark: Optional[str] = Field(
        default=None,
        description="基準比較 ETF（如 SPY）",
        examples=["SPY"]
    )


class MetricsResponse(BaseModel):
    """績效指標響應"""
    # 報酬率
    total_return: float = Field(..., description="總報酬率")
    cagr: float = Field(..., description="年化報酬率 (CAGR)")
    
    # 風險
    volatility: float = Field(..., description="年化波動率（標準差）")
    max_drawdown: float = Field(..., description="最大回撤")
    max_drawdown_duration: int = Field(..., description="最大回撤持續天數")
    
    # 風險調整後報酬
    sharpe_ratio: float = Field(..., description="夏普比率")
    sortino_ratio: float = Field(..., description="索丁諾比率")
    calmar_ratio: float = Field(..., description="卡瑪比率")
    
    # 年度統計
    best_year: float = Field(..., description="最佳年度報酬")
    worst_year: float = Field(..., description="最差年度報酬")
    positive_years: int = Field(..., description="正報酬年數")
    negative_years: int = Field(..., description="負報酬年數")
    
    # 月份統計
    avg_up_month: float = Field(..., description="平均上漲月份報酬")
    avg_down_month: float = Field(..., description="平均下跌月份報酬")
    
    # 風險值
    var_95: float = Field(..., description="95% 風險值 (VaR)")
    cvar_95: float = Field(..., description="95% 條件風險值 (CVaR)")


class TimeSeriesPoint(BaseModel):
    """時間序列資料點"""
    date: date
    value: float


class BacktestResponse(BaseModel):
    """回測響應"""
    backtest_id: str = Field(..., description="回測 ID")
    
    # 投資組合資訊
    portfolio: List[Dict[str, Any]] = Field(..., description="投資組合快照")
    parameters: BacktestParameters = Field(..., description="回測參數")
    
    # 摘要
    summary: Dict[str, Any] = Field(..., description="結果摘要")
    
    # 績效指標
    metrics: MetricsResponse = Field(..., description="績效指標")
    
    # 時間序列資料
    time_series: Dict[str, List[TimeSeriesPoint]] = Field(
        ...,
        description="時間序列資料（組合價值、回撤等）"
    )
    
    # 基準比較（如果有）
    benchmark_comparison: Optional[Dict[str, Any]] = Field(
        None,
        description="基準比較結果"
    )
    
    # 元資料
    generated_at: str = Field(..., description="生成時間")
    execution_time_ms: int = Field(..., description="執行時間（毫秒）")


class MonteCarloRequest(BaseModel):
    """蒙特卡羅模擬請求"""
    portfolio: List[PortfolioHoldingInput]
    years: int = Field(default=30, ge=1, le=50, description="模擬年數")
    initial_amount: float = Field(default=10000, ge=0)
    monthly_contribution: float = Field(default=0, ge=0)
    simulations: int = Field(default=1000, ge=100, le=10000)
    confidence_levels: List[float] = Field(
        default=[0.5, 0.75, 0.9, 0.95],
        description="信心水準"
    )


class MonteCarloResponse(BaseModel):
    """蒙特卡羅模擬響應"""
    simulations: int
    years: int
    percentiles: Dict[str, Dict[str, float]]
    paths: List[Dict[str, Any]]
    success_probability: Dict[str, float]
