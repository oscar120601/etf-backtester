"""
回測 API 端點
"""

import time
import uuid
from datetime import datetime
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.metrics import MetricsCalculator, PerformanceMetrics
from app.schemas.backtest import (
    BacktestRequest,
    BacktestResponse,
    MetricsResponse,
    MonteCarloRequest,
    MonteCarloResponse,
    TimeSeriesPoint,
)
from app.core.backtest_engine import BacktestEngine, PortfolioHolding

router = APIRouter()


@router.post("/run", response_model=BacktestResponse)
async def run_backtest(
    request: BacktestRequest,
    db: Session = Depends(get_db),
):
    """
    執行投資組合回測
    
    根據提供的投資組合配置和回測參數，執行歷史回測並返回績效指標。
    """
    start_time = time.time()
    
    try:
        # 驗證權重總和
        total_weight = sum(h.weight for h in request.portfolio)
        if abs(total_weight - 1.0) > 0.001:
            raise HTTPException(
                status_code=400,
                detail=f"權重總和必須為 1.0，目前為 {total_weight:.4f}"
            )
        
        # 建立回測引擎
        engine = BacktestEngine(db)
        
        # 轉換投資組合配置
        holdings = [
            PortfolioHolding(symbol=h.symbol, weight=h.weight)
            for h in request.portfolio
        ]
        
        # 執行回測
        results = engine.run_backtest(
            holdings_config=[{"symbol": h.symbol, "weight": float(h.weight)} for h in request.portfolio],
            start_date=request.parameters.start_date,
            end_date=request.parameters.end_date,
            initial_amount=Decimal(str(request.parameters.initial_amount)),
            rebalance_frequency=request.parameters.rebalance_frequency,
            monthly_contribution=Decimal(str(request.parameters.monthly_contribution)) if request.parameters.monthly_contribution else None,
            reinvest_dividends=request.parameters.reinvest_dividends,
        )
        
        # 轉換回測結果為時間序列
        daily_values = [(r.date, float(r.portfolio_value)) for r in results]
        
        # 計算績效指標
        metrics = MetricsCalculator.calculate_metrics(daily_values)
        
        # 準備時間序列資料
        time_series = {
            "portfolio_value": [
                TimeSeriesPoint(date=r.date, value=float(r.portfolio_value))
                for r in results
            ],
            "drawdown": [],  # 暫時留空
        }
        
        # 如果有基準，加入基準資料
        benchmark_comparison = None
        benchmark_comparison = None  # 暫時禁用基準比較
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return BacktestResponse(
            backtest_id=str(uuid.uuid4()),
            portfolio=[
                {"symbol": h.symbol, "weight": h.weight}
                for h in request.portfolio
            ],
            parameters=request.parameters,
            summary={
                "initial_value": request.parameters.initial_amount,
                "final_value": float(results[-1].portfolio_value) if results else 0,
                "total_return": metrics.total_return,
                "cagr": metrics.cagr,
                "sharpe_ratio": metrics.sharpe_ratio,
            },
            metrics=_metrics_to_response(metrics),
            time_series=time_series,
            benchmark_comparison=benchmark_comparison,
            generated_at=datetime.utcnow().isoformat(),
            execution_time_ms=execution_time,
        )
    
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"回測執行失敗: {str(e)}")


@router.post("/monte-carlo", response_model=MonteCarloResponse)
async def run_monte_carlo(
    request: MonteCarloRequest,
    db: Session = Depends(get_db),
):
    """
    執行蒙地卡羅模擬
    
    根據歷史報酬和波動率，進行蒙地卡羅模擬預測未來可能走勢。
    """
    try:
        engine = BacktestEngine(db)
        
        holdings = [
            PortfolioHolding(symbol=h.symbol, weight=h.weight)
            for h in request.portfolio
        ]
        
        result = engine.run_monte_carlo(
            holdings=holdings,
            years=request.years,
            initial_amount=Decimal(str(request.initial_amount)),
            monthly_contribution=Decimal(str(request.monthly_contribution)),
            simulations=request.simulations,
            confidence_levels=request.confidence_levels,
        )
        
        return MonteCarloResponse(
            simulations=result['simulations'],
            years=result['years'],
            percentiles=result['percentiles'],
            paths=result['paths'],
            success_probability=result['success_probability'],
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"蒙地卡羅模擬失敗: {str(e)}")


@router.get("/supported-etfs")
async def get_supported_etfs(
    db: Session = Depends(get_db),
    asset_class: str = Query(None, description="資產類別篩選"),
):
    """
    取得支援回測的 ETF 列表
    
    返回系統中可用於回測的 ETF 列表及其基本資訊。
    """
    from app.models.etf import ETF
    
    query = db.query(ETF)
    if asset_class:
        query = query.filter(ETF.asset_class == asset_class)
    
    etfs = query.all()
    
    return {
        "etfs": [
            {
                "symbol": etf.symbol,
                "name": etf.name,
                "asset_class": etf.asset_class,
                "expense_ratio": float(etf.expense_ratio) if etf.expense_ratio else None,
                "description": etf.description,
            }
            for etf in etfs
        ],
        "total": len(etfs),
        "asset_classes": list(set(etf.asset_class for etf in etfs if etf.asset_class)),
    }


def _metrics_to_dict(metrics: PerformanceMetrics) -> dict:
    """將績效指標轉換為字典"""
    return {
        "total_return": metrics.total_return,
        "cagr": metrics.cagr,
        "volatility": metrics.volatility,
        "max_drawdown": metrics.max_drawdown,
        "max_drawdown_duration": metrics.max_drawdown_duration,
        "sharpe_ratio": metrics.sharpe_ratio,
        "sortino_ratio": metrics.sortino_ratio,
        "calmar_ratio": metrics.calmar_ratio,
        "best_year": metrics.best_year,
        "worst_year": metrics.worst_year,
        "positive_years": metrics.positive_years,
        "negative_years": metrics.negative_years,
        "avg_up_month": metrics.avg_up_month,
        "avg_down_month": metrics.avg_down_month,
        "var_95": metrics.var_95,
        "cvar_95": metrics.cvar_95,
    }


def _metrics_to_response(metrics: PerformanceMetrics) -> MetricsResponse:
    """將績效指標轉換為響應模型"""
    return MetricsResponse(
        total_return=metrics.total_return,
        cagr=metrics.cagr,
        volatility=metrics.volatility,
        max_drawdown=metrics.max_drawdown,
        max_drawdown_duration=metrics.max_drawdown_duration,
        sharpe_ratio=metrics.sharpe_ratio,
        sortino_ratio=metrics.sortino_ratio,
        calmar_ratio=metrics.calmar_ratio,
        best_year=metrics.best_year,
        worst_year=metrics.worst_year,
        positive_years=metrics.positive_years,
        negative_years=metrics.negative_years,
        avg_up_month=metrics.avg_up_month,
        avg_down_month=metrics.avg_down_month,
        var_95=metrics.var_95,
        cvar_95=metrics.cvar_95,
    )


def _calculate_tracking_error(
    portfolio_values: list,
    benchmark_values: list
) -> float:
    """計算追蹤誤差"""
    # 對齊日期
    portfolio_dict = dict(portfolio_values)
    benchmark_dict = dict(benchmark_values)
    
    common_dates = sorted(set(portfolio_dict.keys()) & set(benchmark_dict.keys()))
    
    if len(common_dates) < 2:
        return 0.0
    
    # 計算日報酬差異
    diffs = []
    for i in range(1, len(common_dates)):
        p_return = portfolio_dict[common_dates[i]] / portfolio_dict[common_dates[i-1]] - 1
        b_return = benchmark_dict[common_dates[i]] / benchmark_dict[common_dates[i-1]] - 1
        diffs.append(p_return - b_return)
    
    import numpy as np
    return float(np.std(diffs) * (252 ** 0.5))
