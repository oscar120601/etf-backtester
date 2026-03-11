from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """應用程式設定"""
    
    # 基本設定
    APP_NAME: str = "ETF Backtester API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
    # 資料庫
    DATABASE_URL: str = "postgresql://etf_user:etf_password@localhost:5432/etf_backtest"
    DATABASE_POOL_SIZE: int = 20
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 3600
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # API
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # 外部 API
    YAHOO_FINANCE_API_KEY: Optional[str] = None
    ALPHA_VANTAGE_API_KEY: Optional[str] = None
    
    # 速率限制
    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_BACKTEST: str = "10/minute"
    
    # 回測設定
    BACKTEST_CACHE_TTL: int = 3600  # 1小時
    MAX_ETF_PER_PORTFOLIO: int = 10
    MAX_PORTFOLIO_COMPARISON: int = 3
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """取得設定實例（快取）"""
    return Settings()


settings = get_settings()
