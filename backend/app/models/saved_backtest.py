"""
已儲存回測模型
"""
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy import (
    Column, Integer, String, DateTime, Text, Numeric
)
from sqlalchemy.sql import func

from app.db.base import BaseModel


class SavedBacktest(BaseModel):
    """已儲存的回測結果"""
    
    __tablename__ = "saved_backtests"
    
    # 主鍵
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # 存檔資訊
    name = Column(String(200), nullable=False)
    description = Column(Text)
    
    # 用於區分不同用戶（簡易方案，後續可改為 user_id）
    session_id = Column(String(100), index=True)
    
    # 回測參數（JSON 格式儲存）
    portfolio_config = Column(Text, nullable=False)  # holdings JSON
    parameters = Column(Text, nullable=False)  # backtest parameters JSON
    
    # 回測結果摘要（方便快速顯示，無需解析完整結果）
    total_return = Column(Numeric(10, 4))
    cagr = Column(Numeric(10, 4))
    max_drawdown = Column(Numeric(10, 4))
    sharpe_ratio = Column(Numeric(10, 4))
    volatility = Column(Numeric(10, 4))
    
    # 完整回測結果（JSON 格式）
    full_result = Column(Text)
    
    # 時間範圍（方便顯示）
    start_date = Column(String(10))
    end_date = Column(String(10))
    
    # 時間戳
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<SavedBacktest(id={self.id}, name='{self.name}')>"
