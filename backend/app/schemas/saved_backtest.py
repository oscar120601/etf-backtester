"""
SavedBacktest schemas
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class PortfolioHolding(BaseModel):
    """投資組合持倉"""
    symbol: str
    weight: float


class BacktestParameters(BaseModel):
    """回測參數"""
    start_date: str
    end_date: str
    initial_amount: float
    rebalance_frequency: str
    monthly_contribution: Optional[float] = None
    reinvest_dividends: bool = True


class SavedBacktestBase(BaseModel):
    """基礎已儲存回測模型"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None


class SavedBacktestCreate(SavedBacktestBase):
    """創建已儲存回測請求"""
    session_id: Optional[str] = None
    portfolio: List[PortfolioHolding]
    parameters: BacktestParameters
    result: Optional[Dict[str, Any]] = None


class SavedBacktestUpdate(BaseModel):
    """更新已儲存回測請求"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None


class SavedBacktestSummary(BaseModel):
    """已儲存回測摘要（列表顯示用）"""
    id: int
    name: str
    description: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    total_return: Optional[float]
    cagr: Optional[float]
    max_drawdown: Optional[float]
    sharpe_ratio: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True


class SavedBacktestDetail(SavedBacktestSummary):
    """已儲存回測詳情"""
    portfolio: List[PortfolioHolding]
    parameters: BacktestParameters
    result: Optional[Dict[str, Any]]
    
    class Config:
        from_attributes = True


class SavedBacktestList(BaseModel):
    """已儲存回測列表響應"""
    items: List[SavedBacktestSummary]
    total: int
