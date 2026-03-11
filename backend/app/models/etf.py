from datetime import datetime, date
from typing import List, Optional

from sqlalchemy import (
    Column, Integer, String, Date, DateTime, Numeric, Boolean, 
    Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship

from app.db.base import BaseModel


class ETF(BaseModel):
    """ETF 基本資料模型"""
    
    __tablename__ = "etf_master"
    
    # 主鍵
    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), unique=True, nullable=False, index=True)
    
    # 基本資訊
    name = Column(String(200), nullable=False)
    name_zh = Column(String(200))
    issuer = Column(String(100))
    
    # 分類資訊
    asset_class = Column(String(50), index=True)
    asset_subclass = Column(String(50))
    factor_type = Column(String(50))
    region = Column(String(50), index=True)
    sector = Column(String(100))
    
    # 費用與日期
    expense_ratio = Column(Numeric(6, 5))
    inception_date = Column(Date)
    
    # 交易所資訊
    exchange = Column(String(20))
    currency = Column(String(3), default="USD")
    
    # 狀態與管理
    is_active = Column(Boolean, default=True, index=True)
    is_recommended = Column(Boolean, default=False)
    data_source = Column(String(50), default="yahoo")
    
    # 資料品質
    min_data_year = Column(Integer)
    liquidity_score = Column(Integer)
    risk_level = Column(Integer)
    
    # 彈性標籤（SQLite 不支援 ARRAY，改用字串）
    tags = Column(String(500))
    description = Column(Text)
    
    # 追蹤指數
    tracking_index_name = Column(String(200))
    tracking_index_symbol = Column(String(50))
    
    # 時間戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer)
    last_verified_at = Column(DateTime)
    
    # 關聯
    prices = relationship("ETFPrice", back_populates="etf", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<ETF(symbol='{self.symbol}', name='{self.name}')>"
    
    @property
    def expense_ratio_percent(self) -> float:
        """以百分比顯示費用率"""
        return float(self.expense_ratio) * 100 if self.expense_ratio else 0


class ETFPrice(BaseModel):
    """ETF 歷史價格模型"""
    
    __tablename__ = "etf_prices"
    
    # 主鍵
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # 外鍵
    symbol = Column(String(20), ForeignKey("etf_master.symbol"), nullable=False, index=True)
    
    # 日期
    date = Column(Date, nullable=False, index=True)
    
    # 價格資料（允許 null 以便匯入時更靈活）
    open_price = Column(Numeric(12, 4))
    high_price = Column(Numeric(12, 4))
    low_price = Column(Numeric(12, 4))
    close_price = Column(Numeric(12, 4))
    adjusted_close = Column(Numeric(12, 4), nullable=False)
    volume = Column(Integer)
    
    # 配息
    dividend = Column(Numeric(10, 4), default=0)
    
    # 資料來源與品質
    data_source = Column(String(50), default="yahoo")
    is_verified = Column(Boolean, default=False)
    
    # 時間戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 關聯
    etf = relationship("ETF", back_populates="prices")
    
    # 唯一約束
    __table_args__ = (
        Index('idx_prices_symbol_date_unique', 'symbol', 'date', unique=True),
    )
    
    def __repr__(self):
        return f"<ETFPrice(symbol='{self.symbol}', date='{self.date}', close={self.close_price})>"
