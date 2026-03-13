"""
壓力測試 API 端點
"""

import time
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.stress_test import StressTestEngine, CrisisScenario
from app.core.inflation_adjusted import InflationAdjustedCalculator

router = APIRouter()


@router.post("/run")
async def run_stress_test(
    request: dict,
    db: Session = Depends(get_db),
):
    """
    執行壓力測試
    
    模擬投資組合在歷史危機期間的表現。
    
    ## 範例請求
    ```json
    {
        "portfolio": {"VTI": 0.6, "BND": 0.4},
        "scenario_id": "2008_financial_crisis"
    }
    ```
    
    ## 情境列表
    - `2008_financial_crisis`: 2008 金融危機
    - `2020_covid_crash`: 2020 疫情崩盤
    - `2022_inflation_crunch`: 2022 通膨緊縮
    - `2022_bond_bear`: 2022 債券熊市
    - `2018_trade_war`: 2018 貿易戰
    - `2021_meme_stock`: 2021 散戶狂潮
    """
    start_time = time.time()
    
    try:
        portfolio = request.get("portfolio", {})
        scenario_id = request.get("scenario_id")
        
        if not portfolio:
            raise HTTPException(status_code=400, detail="請提供投資組合")
        
        if not scenario_id:
            raise HTTPException(status_code=400, detail="請提供情境 ID")
        
        engine = StressTestEngine(db)
        result = engine.run_stress_test(portfolio, scenario_id)
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return {
            "test_id": str(uuid.uuid4()),
            "scenario": {
                "id": result.scenario.id,
                "name": result.scenario.name,
                "description": result.scenario.description,
                "start_date": result.scenario.start_date.isoformat(),
                "end_date": result.scenario.end_date.isoformat(),
                "benchmark": result.scenario.benchmark_symbol,
            },
            "portfolio_return": round(result.portfolio_return * 100, 2),
            "benchmark_return": round(result.benchmark_return * 100, 2),
            "excess_return": round(result.excess_return * 100, 2),
            "max_drawdown": round(result.max_drawdown * 100, 2),
            "recovery_days": result.recovery_days,
            "daily_returns": result.daily_returns[:30],  # 只返回前30天避免數據過大
            "generated_at": datetime.utcnow().isoformat(),
            "execution_time_ms": execution_time,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"壓力測試失敗: {str(e)}")


@router.post("/run-all")
async def run_all_stress_tests(
    request: dict,
    db: Session = Depends(get_db),
):
    """
    執行所有預設情境的壓力測試
    
    一次測試投資組合在所有歷史危機情境的表現。
    """
    start_time = time.time()
    
    try:
        portfolio = request.get("portfolio", {})
        
        if not portfolio:
            raise HTTPException(status_code=400, detail="請提供投資組合")
        
        engine = StressTestEngine(db)
        results = engine.run_all_scenarios(portfolio)
        
        # 取得摘要
        summary = engine.get_summary(results)
        
        # 轉換結果
        scenarios_results = []
        for result in results:
            scenarios_results.append({
                "scenario_id": result.scenario.id,
                "scenario_name": result.scenario.name,
                "portfolio_return": round(result.portfolio_return * 100, 2),
                "benchmark_return": round(result.benchmark_return * 100, 2),
                "excess_return": round(result.excess_return * 100, 2),
                "max_drawdown": round(result.max_drawdown * 100, 2),
                "recovery_days": result.recovery_days,
            })
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return {
            "test_id": str(uuid.uuid4()),
            "portfolio": portfolio,
            "scenarios_tested": len(results),
            "results": scenarios_results,
            "summary": summary,
            "generated_at": datetime.utcnow().isoformat(),
            "execution_time_ms": execution_time,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"壓力測試失敗: {str(e)}")


@router.get("/scenarios")
async def get_scenarios():
    """
    取得所有可用的危機情境
    
    返回預設的歷史危機情境列表。
    """
    engine = StressTestEngine(None)
    scenarios = engine.get_scenarios()
    
    return {
        "scenarios": [
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "start_date": s.start_date.isoformat(),
                "end_date": s.end_date.isoformat(),
                "benchmark": s.benchmark_symbol,
            }
            for s in scenarios
        ]
    }


@router.post("/inflation-adjusted")
async def calculate_inflation_adjusted(
    request: dict,
):
    """
    計算通膨調整後的報酬
    
    將名目報酬轉換為實質報酬（購買力調整後）。
    
    ## 範例請求
    ```json
    {
        "nominal_values": [
            {"date": "2020-01-01", "value": 10000},
            {"date": "2024-12-31", "value": 15000}
        ]
    }
    ```
    """
    try:
        nominal_values_data = request.get("nominal_values", [])
        
        if not nominal_values_data:
            raise HTTPException(status_code=400, detail="請提供名目價值數據")
        
        # 轉換數據格式
        from datetime import date
        nominal_values = [
            (date.fromisoformat(d["date"]), d["value"])
            for d in nominal_values_data
        ]
        
        calculator = InflationAdjustedCalculator()
        result = calculator.calculate(nominal_values)
        
        # 取得通膨摘要
        inflation_summary = calculator.get_inflation_summary(
            nominal_values[0][0],
            nominal_values[-1][0]
        )
        
        return {
            "analysis_id": str(uuid.uuid4()),
            "nominal_return": round(result.nominal_return * 100, 2),
            "real_return": round(result.real_return * 100, 2),
            "inflation_rate": round(result.inflation_rate * 100, 2),
            "purchasing_power_change": round(result.purchasing_power_change * 100, 2),
            "nominal_cagr": round(result.nominal_cagr * 100, 2),
            "real_cagr": round(result.real_cagr * 100, 2),
            "inflation_summary": inflation_summary,
            "nominal_values": result.nominal_values,
            "real_values": result.real_values,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"通膨調整計算失敗: {str(e)}")


@router.post("/purchasing-power")
async def calculate_purchasing_power(
    request: dict,
):
    """
    計算購買力預測
    
    預測未來購買力隨通膨的變化。
    
    ## 範例請求
    ```json
    {
        "initial_amount": 1000000,
        "years": 30,
        "inflation_rate": 0.025
    }
    ```
    """
    try:
        initial_amount = request.get("initial_amount", 1000000)
        years = request.get("years", 30)
        inflation_rate = request.get("inflation_rate")
        
        calculator = InflationAdjustedCalculator()
        result = calculator.calculate_purchasing_power(
            initial_amount,
            years,
            inflation_rate
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"購買力計算失敗: {str(e)}")


@router.get("/inflation-data")
async def get_inflation_data(
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
):
    """
    取得 CPI/通膨歷史數據
    
    返回美國 CPI 和通膨率歷史數據。
    """
    calculator = InflationAdjustedCalculator()
    
    data = []
    years = sorted(calculator.HISTORICAL_CPI.keys())
    
    if start_year:
        years = [y for y in years if y >= start_year]
    if end_year:
        years = [y for y in years if y <= end_year]
    
    for year in years:
        cpi = calculator.HISTORICAL_CPI[year]
        
        # 計算年度通膨率
        inflation_rate = None
        if year - 1 in calculator.HISTORICAL_CPI:
            prev_cpi = calculator.HISTORICAL_CPI[year - 1]
            inflation_rate = round(((cpi / prev_cpi) - 1) * 100, 2)
        
        data.append({
            "year": year,
            "cpi": cpi,
            "inflation_rate": inflation_rate,
        })
    
    return {
        "data": data,
        "data_source": "U.S. Bureau of Labor Statistics (CPI-U)",
        "note": "CPI-U: Consumer Price Index for All Urban Consumers",
    }
