"""
SQLite 配置（无 Docker 方案）
"""
from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    """应用设置 - SQLite 版本"""
    
    # 基本设置
    APP_NAME: str = "ETF Backtester API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # 数据库 - SQLite
    DATABASE_URL: str = "sqlite:///./etf_backtest.db"
    
    # Redis - 如果不安装 Redis，可以使用内存缓存
    USE_REDIS: bool = False
    REDIS_URL: str = ""
    
    # Celery - 如果不使用 Redis，使用同步模式
    USE_CELERY: bool = False
    CELERY_BROKER_URL: str = ""
    CELERY_RESULT_BACKEND: str = ""
    
    # API
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173"
    ]
    
    # 外部 API
    YAHOO_FINANCE_API_KEY: Optional[str] = None
    ALPHA_VANTAGE_API_KEY: Optional[str] = None
    
    # 速率限制
    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_BACKTEST: str = "10/minute"
    
    # 回测设置
    BACKTEST_CACHE_TTL: int = 3600
    MAX_ETF_PER_PORTFOLIO: int = 10
    MAX_PORTFOLIO_COMPARISON: int = 3
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """获取设置实例（缓存）"""
    return Settings()


settings = get_settings()
