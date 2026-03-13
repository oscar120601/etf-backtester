"""
投資組合優化相關的 Pydantic 模型
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class WeightConstraints(BaseModel):
    """權重限制"""
    min: float = Field(default=0.0, ge=0.0, le=1.0, description="最小權重")
    max: float = Field(default=1.0, ge=0.0, le=1.0, description="最大權重")


class OptimizationRequest(BaseModel):
    """投資組合優化請求"""
    symbols: List[str] = Field(
        ...,
        description="ETF 代碼列表",
        min_length=2,
        max_length=10,
        examples=[["VTI", "BND", "VXUS"]]
    )
    objective: str = Field(
        default="max_sharpe",
        description="優化目標: max_sharpe(最大夏普)/min_volatility(最小風險)/target_return(目標報酬)",
        examples=["max_sharpe"]
    )
    target_return: Optional[float] = Field(
        default=None,
        description="目標年化報酬率（當 objective=target_return 時使用）",
        examples=[0.08]
    )
    risk_free_rate: float = Field(
        default=0.045,
        ge=0.0,
        le=0.2,
        description="無風險利率",
        examples=[0.045]
    )
    weight_constraints: WeightConstraints = Field(
        default_factory=WeightConstraints,
        description="權重限制"
    )
    lookback_years: int = Field(
        default=5,
        ge=1,
        le=20,
        description="回溯年數（用於計算歷史報酬和波動率）"
    )


class OptimizedPortfolio(BaseModel):
    """優化後的投資組合"""
    name: str = Field(..., description="組合名稱")
    description: str = Field(..., description="組合說明")
    objective: str = Field(..., description="優化目標")
    weights: Dict[str, float] = Field(..., description="權重配置")
    expected_return: float = Field(..., description="預期年化報酬率")
    volatility: float = Field(..., description="預期年化波動率")
    sharpe_ratio: float = Field(..., description="夏普比率")


class EfficientFrontierPoint(BaseModel):
    """效率前緣上的點"""
    volatility: float = Field(..., description="波動率 (x軸)")
    expected_return: float = Field(..., description="預期報酬 (y軸)")
    sharpe_ratio: float = Field(..., description="夏普比率")


class IndividualAsset(BaseModel):
    """單一資產資訊"""
    symbol: str = Field(..., description="ETF 代碼")
    expected_return: float = Field(..., description="預期年化報酬率")
    volatility: float = Field(..., description="預期年化波動率")
    sharpe_ratio: float = Field(..., description="夏普比率")


class OptimizationMetadata(BaseModel):
    """優化元數據"""
    risk_free_rate: float = Field(..., description="無風險利率")
    symbols: List[str] = Field(..., description="ETF 列表")
    lookback_period: str = Field(..., description="回溯期間")
    optimization_method: str = Field(..., description="優化方法")


class OptimizationResponse(BaseModel):
    """投資組合優化響應"""
    optimization_id: str = Field(..., description="優化 ID")
    
    # 推薦組合
    recommended_portfolios: Dict[str, OptimizedPortfolio] = Field(
        ...,
        description="推薦的投資組合配置"
    )
    
    # 效率前緣
    efficient_frontier: List[EfficientFrontierPoint] = Field(
        ...,
        description="效率前緣曲線數據"
    )
    
    # 單一資產參考
    individual_assets: List[IndividualAsset] = Field(
        ...,
        description="單一資產資訊（作為參考）"
    )
    
    # 元數據
    metadata: OptimizationMetadata = Field(..., description="優化參數資訊")
    
    # 執行資訊
    generated_at: str = Field(..., description="生成時間")
    execution_time_ms: int = Field(..., description="執行時間（毫秒）")


class EfficientFrontierRequest(BaseModel):
    """效率前緣計算請求"""
    symbols: List[str] = Field(
        ...,
        description="ETF 代碼列表",
        min_length=2,
        max_length=10
    )
    num_points: int = Field(
        default=50,
        ge=10,
        le=100,
        description="效率前緣上的點數量"
    )
    risk_free_rate: float = Field(default=0.045, ge=0.0, le=0.2)
    weight_constraints: WeightConstraints = Field(default_factory=WeightConstraints)
    lookback_years: int = Field(default=5, ge=1, le=20)


class EfficientFrontierResponse(BaseModel):
    """效率前緣響應"""
    frontier_id: str = Field(..., description="效率前緣 ID")
    points: List[EfficientFrontierPoint] = Field(..., description="效率前緣點")
    max_sharpe_point: EfficientFrontierPoint = Field(..., description="最大夏普比率點")
    min_volatility_point: EfficientFrontierPoint = Field(..., description="最小波動率點")
    individual_assets: List[IndividualAsset] = Field(..., description="單一資產位置")
    generated_at: str = Field(..., description="生成時間")
