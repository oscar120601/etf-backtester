"""
投資組合優化 API 端點
"""

import time
import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.portfolio_optimizer import PortfolioOptimizer
from app.schemas.optimizer import (
    OptimizationRequest,
    OptimizationResponse,
    OptimizedPortfolio,
    EfficientFrontierPoint,
    IndividualAsset,
    OptimizationMetadata,
    EfficientFrontierRequest,
    EfficientFrontierResponse,
)

router = APIRouter()


@router.post("/mpt", response_model=OptimizationResponse)
async def optimize_portfolio(
    request: OptimizationRequest,
    db: Session = Depends(get_db),
):
    """
    投資組合優化 (MPT)
    
    基於現代投資組合理論，計算最佳投資組合配置。
    
    ## 優化目標
    - **max_sharpe**: 最大夏普比率（推薦）
    - **min_volatility**: 最小波動率
    - **target_return**: 給定目標報酬率下的最小風險
    
    ## 範例請求
    ```json
    {
        "symbols": ["VTI", "VOO", "BND", "VXUS"],
        "objective": "max_sharpe",
        "risk_free_rate": 0.045,
        "weight_constraints": {"min": 0.05, "max": 0.50},
        "lookback_years": 5
    }
    ```
    """
    start_time = time.time()
    
    try:
        # 驗證參數
        if len(request.symbols) < 2:
            raise HTTPException(status_code=400, detail="至少需要 2 檔 ETF 進行優化")
        
        if len(request.symbols) > 10:
            raise HTTPException(status_code=400, detail="最多支援 10 檔 ETF")
        
        # 檢查權重限制
        if request.weight_constraints.min >= request.weight_constraints.max:
            raise HTTPException(status_code=400, detail="最小權重必須小於最大權重")
        
        # 檢查目標報酬
        if request.objective == "target_return" and request.target_return is None:
            raise HTTPException(status_code=400, detail="target_return 模式下必須提供 target_return 參數")
        
        # 建立優化器
        optimizer = PortfolioOptimizer(db)
        optimizer.risk_free_rate = request.risk_free_rate
        
        # 載入歷史資料
        optimizer.load_historical_data(
            symbols=request.symbols,
            lookback_years=request.lookback_years
        )
        
        # 執行優化
        weight_constraints = {
            "min": request.weight_constraints.min,
            "max": request.weight_constraints.max
        }
        
        if request.objective == "max_sharpe":
            result = optimizer.optimize_max_sharpe(weight_constraints)
        elif request.objective == "min_volatility":
            result = optimizer.optimize_min_volatility(
                weight_constraints=weight_constraints
            )
        elif request.objective == "target_return":
            result = optimizer.optimize_min_volatility(
                target_return=request.target_return,
                weight_constraints=weight_constraints
            )
        else:
            raise HTTPException(status_code=400, detail=f"不支援的優化目標: {request.objective}")
        
        # 計算效率前緣
        frontier = optimizer.calculate_efficient_frontier(
            num_portfolios=50,
            weight_constraints=weight_constraints
        )
        
        # 準備推薦組合
        recommended_portfolios = {}
        
        # 1. 最大夏普比率組合
        max_sharpe = optimizer.optimize_max_sharpe(weight_constraints)
        recommended_portfolios["max_sharpe"] = OptimizedPortfolio(
            name="最大夏普比率組合",
            description="風險調整後報酬最高的組合，推薦給大多數投資者",
            objective="max_sharpe",
            weights=max_sharpe.weights,
            expected_return=max_sharpe.expected_return,
            volatility=max_sharpe.volatility,
            sharpe_ratio=max_sharpe.sharpe_ratio
        )
        
        # 2. 最小風險組合
        min_vol = optimizer.optimize_min_volatility(weight_constraints=weight_constraints)
        recommended_portfolios["min_volatility"] = OptimizedPortfolio(
            name="最小風險組合",
            description="波動率最低的組合，適合保守型投資者",
            objective="min_volatility",
            weights=min_vol.weights,
            expected_return=min_vol.expected_return,
            volatility=min_vol.volatility,
            sharpe_ratio=min_vol.sharpe_ratio
        )
        
        # 3. 用戶請求的優化目標（如果不是上面兩種）
        if request.objective not in ["max_sharpe", "min_volatility"]:
            recommended_portfolios["custom"] = OptimizedPortfolio(
                name=f"目標報酬 {request.target_return*100:.1f}% 組合",
                description=f"在目標報酬率 {request.target_return*100:.1f}% 下的最小風險組合",
                objective=request.objective,
                weights=result.weights,
                expected_return=result.expected_return,
                volatility=result.volatility,
                sharpe_ratio=result.sharpe_ratio
            )
        
        # 準備效率前緣數據
        frontier_points = [
            EfficientFrontierPoint(
                volatility=p.volatility,
                expected_return=p.expected_return,
                sharpe_ratio=p.sharpe_ratio
            )
            for p in frontier
        ]
        
        # 準備單一資產資訊
        individual_assets = []
        for symbol in request.symbols:
            ret = optimizer.mean_returns[symbol]
            vol = optimizer.cov_matrix.loc[symbol, symbol] ** 0.5
            sharpe = (ret - request.risk_free_rate) / vol if vol > 0 else 0
            
            individual_assets.append(IndividualAsset(
                symbol=symbol,
                expected_return=round(ret, 4),
                volatility=round(vol, 4),
                sharpe_ratio=round(sharpe, 4)
            ))
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return OptimizationResponse(
            optimization_id=str(uuid.uuid4()),
            recommended_portfolios=recommended_portfolios,
            efficient_frontier=frontier_points,
            individual_assets=individual_assets,
            metadata=OptimizationMetadata(
                risk_free_rate=request.risk_free_rate,
                symbols=request.symbols,
                lookback_period=f"{request.lookback_years} years",
                optimization_method="SLSQP"
            ),
            generated_at=datetime.utcnow().isoformat(),
            execution_time_ms=execution_time
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"優化失敗: {str(e)}")


@router.post("/efficient-frontier", response_model=EfficientFrontierResponse)
async def calculate_efficient_frontier(
    request: EfficientFrontierRequest,
    db: Session = Depends(get_db),
):
    """
    計算效率前緣
    
    生成效率前緣曲線，用於視覺化展示風險-報酬權衡。
    """
    start_time = time.time()
    
    try:
        if len(request.symbols) < 2:
            raise HTTPException(status_code=400, detail="至少需要 2 檔 ETF")
        
        # 建立優化器
        optimizer = PortfolioOptimizer(db)
        optimizer.risk_free_rate = request.risk_free_rate
        
        # 載入歷史資料
        optimizer.load_historical_data(
            symbols=request.symbols,
            lookback_years=request.lookback_years
        )
        
        # 計算效率前緣
        weight_constraints = {
            "min": request.weight_constraints.min,
            "max": request.weight_constraints.max
        }
        
        frontier = optimizer.calculate_efficient_frontier(
            num_portfolios=request.num_points,
            weight_constraints=weight_constraints
        )
        
        # 找出特殊點
        max_sharpe_point = max(frontier, key=lambda x: x.sharpe_ratio)
        min_vol_point = min(frontier, key=lambda x: x.volatility)
        
        # 準備響應
        points = [
            EfficientFrontierPoint(
                volatility=p.volatility,
                expected_return=p.expected_return,
                sharpe_ratio=p.sharpe_ratio
            )
            for p in frontier
        ]
        
        # 單一資產位置
        individual_assets = []
        for symbol in request.symbols:
            ret = optimizer.mean_returns[symbol]
            vol = optimizer.cov_matrix.loc[symbol, symbol] ** 0.5
            sharpe = (ret - request.risk_free_rate) / vol if vol > 0 else 0
            
            individual_assets.append(IndividualAsset(
                symbol=symbol,
                expected_return=round(ret, 4),
                volatility=round(vol, 4),
                sharpe_ratio=round(sharpe, 4)
            ))
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return EfficientFrontierResponse(
            frontier_id=str(uuid.uuid4()),
            points=points,
            max_sharpe_point=EfficientFrontierPoint(
                volatility=max_sharpe_point.volatility,
                expected_return=max_sharpe_point.expected_return,
                sharpe_ratio=max_sharpe_point.sharpe_ratio
            ),
            min_volatility_point=EfficientFrontierPoint(
                volatility=min_vol_point.volatility,
                expected_return=min_vol_point.expected_return,
                sharpe_ratio=min_vol_point.sharpe_ratio
            ),
            individual_assets=individual_assets,
            generated_at=datetime.utcnow().isoformat()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"效率前緣計算失敗: {str(e)}")


@router.get("/objectives")
async def get_optimization_objectives():
    """
    取得支援的優化目標列表
    
    返回所有可用的投資組合優化目標及其說明。
    """
    return {
        "objectives": [
            {
                "id": "max_sharpe",
                "name": "最大夏普比率",
                "description": "在給定風險水平下最大化報酬，或在給定報酬水平下最小化風險。這是推薦的預設選項。",
                "recommended_for": "大多數投資者",
                "risk_profile": "平衡"
            },
            {
                "id": "min_volatility",
                "name": "最小波動率",
                "description": "找出波動率（風險）最低的投資組合配置。",
                "recommended_for": "保守型投資者、退休規劃",
                "risk_profile": "保守"
            },
            {
                "id": "target_return",
                "name": "目標報酬率",
                "description": "在達到指定目標報酬率的前提下，最小化投資組合風險。",
                "recommended_for": "有明確報酬目標的投資者",
                "risk_profile": "依目標而定"
            }
        ],
        "risk_free_rate_note": "預設無風險利率為 4.5%（基於近期美國 10 年期公債收益率）",
        "weight_constraints_note": "建議設定最小權重（如 5%）以避免過度集中於單一資產"
    }
