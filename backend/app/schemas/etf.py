from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Any

from pydantic import BaseModel, ConfigDict, Field


class ETFBase(BaseModel):
    """ETF 基礎 Schema"""
    
    symbol: str = Field(..., description="ETF 代碼", examples=["VTI"])
    name: str = Field(..., description="ETF 名稱", examples=["Vanguard Total Stock Market ETF"])
    name_zh: Optional[str] = Field(None, description="中文名稱")
    issuer: str = Field(..., description="發行商", examples=["Vanguard"])
    
    asset_class: str = Field(..., description="資產類別", examples=["Equity"])
    asset_subclass: Optional[str] = Field(None, description="資產子類別")
    factor_type: Optional[str] = Field(None, description="因子類型")
    region: Optional[str] = Field(None, description="區域")
    sector: Optional[str] = Field(None, description="產業")
    
    expense_ratio: Decimal = Field(..., description="費用率", examples=[Decimal("0.0003")])
    inception_date: date = Field(..., description="成立日期")
    exchange: str = Field(..., description="交易所", examples=["NYSE"])
    currency: str = Field(default="USD", description="幣別")
    
    is_active: bool = Field(default=True, description="是否啟用")
    is_recommended: bool = Field(default=False, description="是否推薦")
    
    min_data_year: Optional[int] = Field(None, description="最早資料年份")
    liquidity_score: Optional[int] = Field(None, ge=1, le=5, description="流動性評分")
    risk_level: Optional[int] = Field(None, ge=1, le=5, description="風險等級")
    
    tags: Optional[List[str]] = Field(None, description="標籤")
    description: Optional[str] = Field(None, description="描述")
    
    tracking_index_name: Optional[str] = Field(None, description="追蹤指數名稱")
    tracking_index_symbol: Optional[str] = Field(None, description="追蹤指數代碼")
    
    model_config = ConfigDict(from_attributes=True)


class ETFResponse(ETFBase):
    """ETF 詳細回應 Schema"""
    
    id: int
    data_source: str = "yahoo"
    created_at: datetime
    updated_at: datetime
    
    # 動態計算欄位
    expense_ratio_percent: Optional[float] = Field(
        None, 
        description="費用率百分比",
        examples=[0.03]
    )
    
    class Config:
        from_attributes = True


class ETFListResponse(BaseModel):
    """ETF 清單回應 Schema"""
    
    items: List[ETFResponse]
    total: int
    page: int
    limit: int
    
    
class ETFFilterParams(BaseModel):
    """ETF 篩選參數"""
    
    asset_class: Optional[str] = Field(None, description="資產類別")
    region: Optional[str] = Field(None, description="區域")
    search: Optional[str] = Field(None, description="搜尋關鍵字")
    is_active: Optional[bool] = Field(True, description="只顯示啟用")
    page: int = Field(1, ge=1, description="頁碼")
    limit: int = Field(20, ge=1, le=100, description="每頁數量")


class ETFPriceResponse(BaseModel):
    """ETF 價格回應 Schema"""
    
    symbol: str
    date: date
    open_price: Optional[Decimal] = None
    high_price: Optional[Decimal] = None
    low_price: Optional[Decimal] = None
    close_price: Optional[Decimal] = None
    adjusted_close: Decimal
    volume: Optional[int] = None
    dividend: Decimal = Decimal("0")
    
    model_config = ConfigDict(from_attributes=True)


class ETFPriceHistoryResponse(BaseModel):
    """ETF 歷史價格回應 Schema"""
    
    symbol: str
    currency: str
    frequency: str
    start_date: date
    end_date: date
    prices: List[ETFPriceResponse]
