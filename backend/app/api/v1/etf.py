from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.etf import ETF
from app.schemas.etf import ETFResponse, ETFListResponse, ETFFilterParams, ETFPriceHistoryResponse

router = APIRouter()


@router.get("", response_model=ETFListResponse)
def list_etfs(
    asset_class: Optional[str] = Query(None, description="資產類別篩選"),
    region: Optional[str] = Query(None, description="區域篩選"),
    search: Optional[str] = Query(None, description="關鍵字搜尋"),
    is_active: bool = Query(True, description="只顯示啟用的 ETF"),
    page: int = Query(1, ge=1, description="頁碼"),
    limit: int = Query(20, ge=1, le=100, description="每頁數量"),
    db: Session = Depends(get_db)
):
    """
    取得 ETF 清單
    
    支援分頁、篩選和搜尋功能
    """
    query = db.query(ETF)
    
    # 套用篩選條件
    if is_active:
        query = query.filter(ETF.is_active == True)
    
    if asset_class:
        query = query.filter(ETF.asset_class == asset_class)
    
    if region:
        query = query.filter(ETF.region == region)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (ETF.symbol.ilike(search_filter)) |
            (ETF.name.ilike(search_filter)) |
            (ETF.name_zh.ilike(search_filter))
        )
    
    # 計算總數
    total = query.count()
    
    # 分頁
    offset = (page - 1) * limit
    etfs = query.offset(offset).limit(limit).all()
    
    return ETFListResponse(
        items=etfs,
        total=total,
        page=page,
        limit=limit
    )


@router.get("/{symbol}", response_model=ETFResponse)
def get_etf(
    symbol: str,
    db: Session = Depends(get_db)
):
    """
    取得單一 ETF 詳情
    
    - **symbol**: ETF 代碼（例：VTI）
    """
    etf = db.query(ETF).filter(ETF.symbol == symbol.upper()).first()
    
    if not etf:
        raise HTTPException(
            status_code=404,
            detail=f"ETF with symbol '{symbol}' not found"
        )
    
    return etf


@router.get("/{symbol}/prices", response_model=ETFPriceHistoryResponse)
def get_etf_prices(
    symbol: str,
    start_date: Optional[str] = Query(None, description="開始日期 (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="結束日期 (YYYY-MM-DD)"),
    frequency: str = Query("daily", description="資料頻率 (daily/weekly/monthly)"),
    db: Session = Depends(get_db)
):
    """
    取得 ETF 歷史價格
    
    - **symbol**: ETF 代碼
    - **start_date**: 開始日期
    - **end_date**: 結束日期（預設為今日）
    - **frequency**: 資料頻率
    """
    from datetime import datetime, date
    from app.models.etf import ETFPrice
    
    # 檢查 ETF 是否存在
    etf = db.query(ETF).filter(ETF.symbol == symbol.upper()).first()
    if not etf:
        raise HTTPException(
            status_code=404,
            detail=f"ETF with symbol '{symbol}' not found"
        )
    
    # 建立查詢
    query = db.query(ETFPrice).filter(ETFPrice.symbol == symbol.upper())
    
    if start_date:
        query = query.filter(ETFPrice.date >= start_date)
    
    if end_date:
        query = query.filter(ETFPrice.date <= end_date)
    
    # 取得價格資料
    prices = query.order_by(ETFPrice.date).all()
    
    if not prices:
        raise HTTPException(
            status_code=404,
            detail=f"No price data found for ETF '{symbol}' in the specified date range"
        )
    
    return ETFPriceHistoryResponse(
        symbol=symbol.upper(),
        currency=etf.currency,
        frequency=frequency,
        start_date=prices[0].date,
        end_date=prices[-1].date,
        prices=prices
    )


@router.get("/filters/options")
def get_filter_options(db: Session = Depends(get_db)):
    """
    取得篩選選項
    
    返回可用的資產類別和區域清單
    """
    asset_classes = db.query(ETF.asset_class).distinct().all()
    regions = db.query(ETF.region).distinct().all()
    
    return {
        "asset_classes": [ac[0] for ac in asset_classes if ac[0]],
        "regions": [r[0] for r in regions if r[0]]
    }
