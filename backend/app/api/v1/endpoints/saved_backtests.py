"""
已儲存回測 API 端點
"""
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.saved_backtest import SavedBacktest
from app.schemas.saved_backtest import (
    SavedBacktestCreate,
    SavedBacktestUpdate,
    SavedBacktestDetail,
    SavedBacktestList,
)

router = APIRouter()


@router.post("", response_model=SavedBacktestDetail)
async def create_saved_backtest(
    request: SavedBacktestCreate,
    db: Session = Depends(get_db),
):
    """儲存新的回測結果"""
    
    # 從結果中提取績效指標
    result = request.result or {}
    metrics = result.get("metrics", {})
    summary = result.get("summary", {})
    
    # 創建資料庫記錄
    db_backtest = SavedBacktest(
        name=request.name,
        description=request.description,
        session_id=request.session_id or "anonymous",
        portfolio_config=json.dumps([h.model_dump() for h in request.portfolio]),
        parameters=json.dumps(request.parameters.model_dump()),
        total_return=metrics.get("total_return"),
        cagr=metrics.get("cagr"),
        max_drawdown=metrics.get("max_drawdown"),
        sharpe_ratio=metrics.get("sharpe_ratio"),
        volatility=metrics.get("volatility"),
        full_result=json.dumps(result) if result else None,
        start_date=request.parameters.start_date,
        end_date=request.parameters.end_date,
    )
    
    db.add(db_backtest)
    db.commit()
    db.refresh(db_backtest)
    
    return _convert_to_detail(db_backtest)


@router.get("", response_model=SavedBacktestList)
async def list_saved_backtests(
    session_id: Optional[str] = Query(None, description="Session ID to filter by"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """獲取已儲存的回測列表"""
    
    query = db.query(SavedBacktest)
    
    if session_id:
        query = query.filter(SavedBacktest.session_id == session_id)
    
    total = query.count()
    items = query.order_by(SavedBacktest.created_at.desc()).offset(skip).limit(limit).all()
    
    return SavedBacktestList(
        items=[_convert_to_summary(item) for item in items],
        total=total,
    )


@router.get("/{backtest_id}", response_model=SavedBacktestDetail)
async def get_saved_backtest(
    backtest_id: int,
    db: Session = Depends(get_db),
):
    """獲取單個已儲存回測的詳細資訊"""
    
    db_backtest = db.query(SavedBacktest).filter(SavedBacktest.id == backtest_id).first()
    
    if not db_backtest:
        raise HTTPException(status_code=404, detail="Saved backtest not found")
    
    return _convert_to_detail(db_backtest)


@router.put("/{backtest_id}", response_model=SavedBacktestDetail)
async def update_saved_backtest(
    backtest_id: int,
    request: SavedBacktestUpdate,
    db: Session = Depends(get_db),
):
    """更新已儲存回測的名稱或描述"""
    
    db_backtest = db.query(SavedBacktest).filter(SavedBacktest.id == backtest_id).first()
    
    if not db_backtest:
        raise HTTPException(status_code=404, detail="Saved backtest not found")
    
    if request.name is not None:
        db_backtest.name = request.name
    if request.description is not None:
        db_backtest.description = request.description
    
    db.commit()
    db.refresh(db_backtest)
    
    return _convert_to_detail(db_backtest)


@router.delete("/{backtest_id}")
async def delete_saved_backtest(
    backtest_id: int,
    db: Session = Depends(get_db),
):
    """刪除已儲存的回測"""
    
    db_backtest = db.query(SavedBacktest).filter(SavedBacktest.id == backtest_id).first()
    
    if not db_backtest:
        raise HTTPException(status_code=404, detail="Saved backtest not found")
    
    db.delete(db_backtest)
    db.commit()
    
    return {"message": "Deleted successfully"}


def _convert_to_summary(db_backtest: SavedBacktest):
    """轉換為摘要格式"""
    from app.schemas.saved_backtest import SavedBacktestSummary
    
    return SavedBacktestSummary(
        id=db_backtest.id,
        name=db_backtest.name,
        description=db_backtest.description,
        start_date=db_backtest.start_date,
        end_date=db_backtest.end_date,
        total_return=float(db_backtest.total_return) if db_backtest.total_return else None,
        cagr=float(db_backtest.cagr) if db_backtest.cagr else None,
        max_drawdown=float(db_backtest.max_drawdown) if db_backtest.max_drawdown else None,
        sharpe_ratio=float(db_backtest.sharpe_ratio) if db_backtest.sharpe_ratio else None,
        created_at=db_backtest.created_at,
    )


def _convert_to_detail(db_backtest: SavedBacktest):
    """轉換為詳細格式"""
    from app.schemas.saved_backtest import SavedBacktestDetail, PortfolioHolding, BacktestParameters
    
    # 解析 JSON 欄位
    portfolio = []
    if db_backtest.portfolio_config:
        portfolio_data = json.loads(db_backtest.portfolio_config)
        portfolio = [PortfolioHolding(**item) for item in portfolio_data]
    
    parameters = None
    if db_backtest.parameters:
        params_data = json.loads(db_backtest.parameters)
        parameters = BacktestParameters(**params_data)
    
    result = None
    if db_backtest.full_result:
        result = json.loads(db_backtest.full_result)
    
    return SavedBacktestDetail(
        id=db_backtest.id,
        name=db_backtest.name,
        description=db_backtest.description,
        start_date=db_backtest.start_date,
        end_date=db_backtest.end_date,
        total_return=float(db_backtest.total_return) if db_backtest.total_return else None,
        cagr=float(db_backtest.cagr) if db_backtest.cagr else None,
        max_drawdown=float(db_backtest.max_drawdown) if db_backtest.max_drawdown else None,
        sharpe_ratio=float(db_backtest.sharpe_ratio) if db_backtest.sharpe_ratio else None,
        created_at=db_backtest.created_at,
        portfolio=portfolio,
        parameters=parameters,
        result=result,
    )
