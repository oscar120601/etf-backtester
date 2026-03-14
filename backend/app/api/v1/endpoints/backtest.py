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
        
        # 計算回撤時間序列
        drawdown_series = MetricsCalculator.calculate_drawdown_series(daily_values)
        
        # 準備時間序列資料
        time_series = {
            "portfolio_value": [
                TimeSeriesPoint(date=r.date, value=float(r.portfolio_value))
                for r in results
            ],
            "drawdown": [
                TimeSeriesPoint(date=d, value=dd)
                for d, dd in drawdown_series
            ],
        }
        
        # 如果有基準，計算基準資料
        benchmark_comparison = None
        if request.benchmark:
            try:
                # 執行基準回測（100% 持有基準 ETF）
                benchmark_results = engine.run_backtest(
                    holdings_config=[{"symbol": request.benchmark, "weight": 1.0}],
                    start_date=request.parameters.start_date,
                    end_date=request.parameters.end_date,
                    initial_amount=Decimal(str(request.parameters.initial_amount)),
                    rebalance_frequency="none",  # 基準不需要再平衡
                    monthly_contribution=Decimal(str(request.parameters.monthly_contribution)) if request.parameters.monthly_contribution else None,
                    reinvest_dividends=request.parameters.reinvest_dividends,
                )
                
                # 計算基準績效指標
                benchmark_daily_values = [(r.date, float(r.portfolio_value)) for r in benchmark_results]
                benchmark_metrics = MetricsCalculator.calculate_metrics(benchmark_daily_values)
                
                # 加入基準時間序列
                time_series["benchmark_value"] = [
                    TimeSeriesPoint(date=r.date, value=float(r.portfolio_value))
                    for r in benchmark_results
                ]
                
                # 基準比較資訊
                benchmark_comparison = {
                    "symbol": request.benchmark,
                    "total_return": benchmark_metrics.total_return,
                    "cagr": benchmark_metrics.cagr,
                    "volatility": benchmark_metrics.volatility,
                    "max_drawdown": benchmark_metrics.max_drawdown,
                    "sharpe_ratio": benchmark_metrics.sharpe_ratio,
                    "outperformance": metrics.total_return - benchmark_metrics.total_return,
                    "outperformance_cagr": metrics.cagr - benchmark_metrics.cagr,
                }
            except Exception as e:
                print(f"基準計算失敗: {e}")
                benchmark_comparison = None
        
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
    import numpy as np
    
    def convert_value(v):
        """轉換 numpy 類型為 Python 原生類型"""
        if isinstance(v, (np.integer, np.int64, np.int32)):
            return int(v)
        if isinstance(v, (np.floating, np.float64, np.float32)):
            return float(v)
        return v
    
    return {
        "total_return": convert_value(metrics.total_return),
        "cagr": convert_value(metrics.cagr),
        "volatility": convert_value(metrics.volatility),
        "max_drawdown": convert_value(metrics.max_drawdown),
        "max_drawdown_duration": convert_value(metrics.max_drawdown_duration),
        "sharpe_ratio": convert_value(metrics.sharpe_ratio),
        "sortino_ratio": convert_value(metrics.sortino_ratio),
        "calmar_ratio": convert_value(metrics.calmar_ratio),
        "best_year": convert_value(metrics.best_year),
        "worst_year": convert_value(metrics.worst_year),
        "positive_years": convert_value(metrics.positive_years),
        "negative_years": convert_value(metrics.negative_years),
        "avg_up_month": convert_value(metrics.avg_up_month),
        "avg_down_month": convert_value(metrics.avg_down_month),
        "var_95": convert_value(metrics.var_95),
        "cvar_95": convert_value(metrics.cvar_95),
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


@router.post("/compare")
async def compare_portfolios(
    request: dict,
    db: Session = Depends(get_db),
):
    """
    多組合比較
    
    同時回測多個投資組合並返回比較結果，支援最多 3 組組合。
    """
    from app.schemas.backtest import BacktestRequest
    
    start_time = time.time()
    
    try:
        portfolios = request.get("portfolios", [])
        parameters = request.get("parameters", {})
        
        if len(portfolios) < 2:
            raise HTTPException(status_code=400, detail="至少需要 2 組投資組合進行比較")
        
        if len(portfolios) > 3:
            raise HTTPException(status_code=400, detail="最多支援 3 組投資組合同時比較")
        
        results = []
        all_dates = set()
        
        # 執行每組回測
        for idx, portfolio_config in enumerate(portfolios):
            # 建立回測請求
            backtest_request = BacktestRequest(
                portfolio=portfolio_config["holdings"],
                parameters=parameters
            )
            
            # 驗證權重
            total_weight = sum(h["weight"] for h in portfolio_config["holdings"])
            if abs(total_weight - 1.0) > 0.001:
                raise HTTPException(
                    status_code=400,
                    detail=f"組合 '{portfolio_config.get('name', idx+1)}' 權重總和必須為 1.0，目前為 {total_weight:.4f}"
                )
            
            # 執行回測
            engine = BacktestEngine(db)
            
            backtest_results = engine.run_backtest(
                holdings_config=portfolio_config["holdings"],
                start_date=parameters.get("start_date", "2020-01-01"),
                end_date=parameters.get("end_date", "2025-01-01"),
                initial_amount=Decimal(str(parameters.get("initial_amount", 10000))),
                rebalance_frequency=parameters.get("rebalance_frequency", "yearly"),
                monthly_contribution=Decimal(str(parameters.get("monthly_contribution", 0))) if parameters.get("monthly_contribution") else None,
                reinvest_dividends=parameters.get("reinvest_dividends", True),
            )
            
            # 計算指標
            daily_values = [(r.date, float(r.portfolio_value)) for r in backtest_results]
            metrics = MetricsCalculator.calculate_metrics(daily_values)
            
            # 收集所有日期
            for r in backtest_results:
                all_dates.add(r.date)
            
            results.append({
                "id": portfolio_config.get("id", f"portfolio_{idx+1}"),
                "name": portfolio_config.get("name", f"組合 {idx+1}"),
                "holdings": portfolio_config["holdings"],
                "metrics": _metrics_to_dict(metrics),
                "time_series": [
                    {"date": r.date, "value": float(r.portfolio_value)}
                    for r in backtest_results
                ],
            })
        
        # 標準化時間序列（對齊日期）
        sorted_dates = sorted(all_dates)
        comparison_data = []
        
        for date in sorted_dates:
            point = {"date": date}
            for result in results:
                # 找到對應日期的值
                value = None
                for ts in result["time_series"]:
                    if ts["date"] == date:
                        value = ts["value"]
                        break
                point[result["id"]] = value
            comparison_data.append(point)
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return {
            "comparison_id": str(uuid.uuid4()),
            "portfolios": [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "holdings": r["holdings"],
                    "metrics": r["metrics"],
                }
                for r in results
            ],
            "comparison_table": _build_comparison_table(results),
            "time_series": comparison_data,
            "winner": _determine_winner(results),
            "generated_at": datetime.utcnow().isoformat(),
            "execution_time_ms": execution_time,
        }
    
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"比較執行失敗: {str(e)}")


def _build_comparison_table(results: list) -> dict:
    """建立比較表格"""
    metrics_to_compare = [
        ("total_return", "總報酬率", "%", lambda x: f"{x*100:.2f}"),
        ("cagr", "年化報酬率", "%", lambda x: f"{x*100:.2f}"),
        ("volatility", "波動率", "%", lambda x: f"{x*100:.2f}"),
        ("max_drawdown", "最大回撤", "%", lambda x: f"{x*100:.2f}"),
        ("sharpe_ratio", "夏普比率", "", lambda x: f"{x:.2f}"),
        ("sortino_ratio", "索丁諾比率", "", lambda x: f"{x:.2f}"),
        ("calmar_ratio", "卡瑪比率", "", lambda x: f"{x:.2f}"),
    ]
    
    table = {
        "headers": ["指標"] + [r["name"] for r in results],
        "rows": [],
    }
    
    for metric_key, metric_name, unit, formatter in metrics_to_compare:
        row = {"metric": metric_name, "unit": unit}
        values = []
        for result in results:
            value = result["metrics"].get(metric_key, 0)
            values.append(value)
            row[result["id"]] = formatter(value)
        
        # 標記最佳值
        if metric_key in ["max_drawdown", "volatility"]:
            # 越低越好
            best_idx = values.index(min(values))
        else:
            # 越高越好
            best_idx = values.index(max(values))
        
        row["best"] = results[best_idx]["id"]
        table["rows"].append(row)
    
    return table


def _determine_winner(results: list) -> dict:
    """決定勝出者（綜合評分）"""
    scores = {}
    
    for result in results:
        scores[result["id"]] = {
            "name": result["name"],
            "score": 0,
            "wins": [],
        }
    
    # 比較各項指標
    metrics_to_score = [
        ("cagr", "higher", "最高年化報酬"),
        ("sharpe_ratio", "higher", "最佳夏普比率"),
        ("sortino_ratio", "higher", "最佳索丁諾比率"),
        ("max_drawdown", "lower", "最小最大回撤"),
        ("calmar_ratio", "higher", "最佳卡瑪比率"),
    ]
    
    for metric_key, direction, description in metrics_to_score:
        values = [(r["id"], r["metrics"].get(metric_key, 0)) for r in results]
        
        if direction == "higher":
            winner = max(values, key=lambda x: x[1])
        else:
            winner = min(values, key=lambda x: x[1])
        
        scores[winner[0]]["score"] += 1
        scores[winner[0]]["wins"].append(description)
    
    # 找出總分最高者
    winner_id = max(scores, key=lambda x: scores[x]["score"])
    
    return {
        "id": winner_id,
        "name": scores[winner_id]["name"],
        "score": scores[winner_id]["score"],
        "total_metrics": len(metrics_to_score),
        "winning_categories": scores[winner_id]["wins"],
    }


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
