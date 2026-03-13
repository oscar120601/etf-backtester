"""
投資分析 API 端點

提供滾動報酬分析和相關性矩陣計算。
"""

import time
import uuid
from datetime import datetime, date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.rolling_returns import RollingReturnsCalculator
from app.core.correlation_matrix import CorrelationMatrixCalculator

router = APIRouter()


@router.post("/rolling-returns")
async def calculate_rolling_returns(
    request: dict,
    db: Session = Depends(get_db),
):
    """
    計算滾動報酬分析
    
    計算投資組合在不同持有期間（1年/3年/5年/10年）的報酬率分布。
    
    ## 範例請求
    ```json
    {
        "portfolio": {"VTI": 0.6, "BND": 0.4},
        "start_date": "2010-01-01",
        "end_date": "2024-12-31",
        "window_years": [1, 3, 5, 10]
    }
    ```
    """
    start_time = time.time()
    
    try:
        portfolio = request.get("portfolio", {})
        start_date = request.get("start_date")
        end_date = request.get("end_date")
        window_years = request.get("window_years", [1, 3, 5, 10])
        
        if not portfolio:
            raise HTTPException(status_code=400, detail="請提供投資組合")
        
        # 轉換日期
        if start_date:
            start_date = date.fromisoformat(start_date)
        if end_date:
            end_date = date.fromisoformat(end_date)
        
        # 計算滾動報酬
        calculator = RollingReturnsCalculator(db)
        results = calculator.calculate(
            portfolio=portfolio,
            start_date=start_date,
            end_date=end_date,
            window_years=window_years
        )
        
        # 取得摘要
        summary = calculator.get_summary(results)
        
        # 轉換結果為響應格式
        periods_data = {}
        for window, result in results.items():
            periods_data[str(window)] = {
                "window_years": result.window_years,
                "dates": [d.isoformat() for d in result.dates],
                "returns": [round(r * 100, 2) for r in result.returns],  # 轉為百分比
                "stats": {
                    "mean": round(result.stats.mean * 100, 2),
                    "median": round(result.stats.median * 100, 2),
                    "std": round(result.stats.std * 100, 2),
                    "min": round(result.stats.min * 100, 2),
                    "max": round(result.stats.max * 100, 2),
                    "percentile_5": round(result.stats.percentile_5 * 100, 2),
                    "percentile_25": round(result.stats.percentile_25 * 100, 2),
                    "percentile_75": round(result.stats.percentile_75 * 100, 2),
                    "percentile_95": round(result.stats.percentile_95 * 100, 2),
                    "positive_ratio": round(result.stats.positive_ratio * 100, 2),
                }
            }
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return {
            "analysis_id": str(uuid.uuid4()),
            "portfolio": portfolio,
            "periods": periods_data,
            "summary": summary,
            "generated_at": datetime.utcnow().isoformat(),
            "execution_time_ms": execution_time
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"滾動報酬計算失敗: {str(e)}")


@router.get("/correlation-matrix")
async def get_correlation_matrix(
    symbols: str = Query(..., description="ETF 代碼，以逗號分隔（如 VTI,VOO,BND）"),
    lookback_years: int = Query(3, ge=1, le=10, description="回溯年數"),
    method: str = Query("pearson", description="相關性計算方法 (pearson/spearman/kendall)"),
    db: Session = Depends(get_db),
):
    """
    計算相關性矩陣
    
    計算多個 ETF 之間的價格相關係數，並返回熱力圖數據。
    
    ## 範例
    ```
    GET /api/v1/analysis/correlation-matrix?symbols=VTI,VOO,BND,VXUS&lookback_years=3
    ```
    """
    start_time = time.time()
    
    try:
        symbol_list = [s.strip() for s in symbols.split(",")]
        
        if len(symbol_list) < 2:
            raise HTTPException(status_code=400, detail="至少需要 2 檔 ETF")
        
        if len(symbol_list) > 10:
            raise HTTPException(status_code=400, detail="最多支援 10 檔 ETF")
        
        # 計算相關性
        calculator = CorrelationMatrixCalculator(db)
        result = calculator.calculate(
            symbols=symbol_list,
            lookback_years=lookback_years,
            method=method
        )
        
        # 取得熱力圖數據
        heatmap_data = calculator.get_heatmap_data(result)
        
        # 取得摘要
        summary = calculator.get_summary(result)
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return {
            "analysis_id": str(uuid.uuid4()),
            "symbols": symbol_list,
            "lookback_years": lookback_years,
            "method": method,
            "heatmap": heatmap_data,
            "summary": summary,
            "generated_at": datetime.utcnow().isoformat(),
            "execution_time_ms": execution_time
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"相關性計算失敗: {str(e)}")


@router.post("/correlation-matrix")
async def calculate_correlation_matrix(
    request: dict,
    db: Session = Depends(get_db),
):
    """
    計算相關性矩陣 (POST 版本)
    
    與 GET 版本功能相同，但支援更多 ETF 和複雜參數。
    """
    start_time = time.time()
    
    try:
        symbols = request.get("symbols", [])
        lookback_years = request.get("lookback_years", 3)
        method = request.get("method", "pearson")
        
        if len(symbols) < 2:
            raise HTTPException(status_code=400, detail="至少需要 2 檔 ETF")
        
        if len(symbols) > 10:
            raise HTTPException(status_code=400, detail="最多支援 10 檔 ETF")
        
        # 計算相關性
        calculator = CorrelationMatrixCalculator(db)
        result = calculator.calculate(
            symbols=symbols,
            lookback_years=lookback_years,
            method=method
        )
        
        # 取得熱力圖數據
        heatmap_data = calculator.get_heatmap_data(result)
        
        # 取得摘要
        summary = calculator.get_summary(result)
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return {
            "analysis_id": str(uuid.uuid4()),
            "symbols": symbols,
            "lookback_years": lookback_years,
            "method": method,
            "heatmap": heatmap_data,
            "summary": summary,
            "generated_at": datetime.utcnow().isoformat(),
            "execution_time_ms": execution_time
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"相關性計算失敗: {str(e)}")


@router.get("/correlation-levels")
async def get_correlation_levels():
    """
    取得相關性等級說明
    
    返回相關性強度的分類和對應顏色。
    """
    return {
        "levels": [
            {
                "key": "very_strong_positive",
                "range": [0.8, 1.0],
                "description": "極強正相關",
                "color": "#d32f2f",
                "interpretation": "資產走勢高度一致，幾乎沒有分散化效果"
            },
            {
                "key": "strong_positive",
                "range": [0.5, 0.8],
                "description": "強正相關",
                "color": "#f44336",
                "interpretation": "資產走勢相似，分散化效果有限"
            },
            {
                "key": "weak_positive",
                "range": [0.2, 0.5],
                "description": "弱正相關",
                "color": "#ff7043",
                "interpretation": "資產有一定相關性，但仍有部分分散化效果"
            },
            {
                "key": "none",
                "range": [-0.2, 0.2],
                "description": "無相關",
                "color": "#ffffff",
                "interpretation": "資產走勢獨立，良好的分散化效果"
            },
            {
                "key": "weak_negative",
                "range": [-0.5, -0.2],
                "description": "弱負相關",
                "color": "#64b5f6",
                "interpretation": "資產走勢略有反向，提供一定對沖效果"
            },
            {
                "key": "strong_negative",
                "range": [-0.8, -0.5],
                "description": "強負相關",
                "color": "#1976d2",
                "interpretation": "資產走勢明顯反向，良好的對沖效果"
            },
            {
                "key": "very_strong_negative",
                "range": [-1.0, -0.8],
                "description": "極強負相關",
                "color": "#0d47a1",
                "interpretation": "資產走勢高度反向，極佳的對沖效果"
            }
        ],
        "interpretation_guide": {
            "diversification": "選擇相關性較低（<0.5）的資產組合，可以提升分散化效果",
            "hedging": "負相關資產可以在市場下跌時提供保護，但會限制上漲時的收益",
            "redundancy": "相關性過高（>0.8）的資產會造成配置重複，浪費分散化機會"
        }
    }
