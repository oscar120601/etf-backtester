"""
SQLite 配置（簡化版）
"""
import os

# 資料庫設定
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./etf_backtester.db")

# API 設定
API_V1_STR = "/api/v1"
PROJECT_NAME = "ETF Backtester API"
VERSION = "1.0.0"
DESCRIPTION = "ETF 投資組合回測 API"

# CORS 設定
BACKEND_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# 其他設定
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 8  # 8 days

# 資料庫連線池設定（SQLite 不適用，但保留相容性）
DATABASE_POOL_SIZE = 5
DATABASE_MAX_OVERFLOW = 10
