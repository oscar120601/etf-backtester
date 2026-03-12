"""
ETF Backtester API - FastAPI 應用入口
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1 import api_router
from app.db.base import Base
from app.db.session import engine
from app.models import ETF, ETFPrice, SavedBacktest  # 確保模型被註冊


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    應用程式生命週期管理
    
    - 啟動時：建立資料表
    - 關閉時：清理資源
    """
    # 啟動時執行
    Base.metadata.create_all(bind=engine)
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} started!")
    print(f"📚 API Documentation: http://localhost:8000/docs")
    
    yield
    
    # 關閉時執行
    print("👋 Shutting down...")


def create_application() -> FastAPI:
    """
    建立 FastAPI 應用實例
    
    Returns:
        FastAPI: 設定完成的 FastAPI 應用
    """
    application = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="ETF 投資組合回測工具 API",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan
    )
    
    # 設定 CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # 註冊 API 路由
    application.include_router(api_router, prefix=settings.API_V1_STR)
    
    return application


# 建立應用實例
app = create_application()


@app.get("/")
def root():
    """根路徑 - 服務狀態檢查"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs_url": "/docs"
    }


@app.get("/health")
def health_check():
    """健康檢查端點"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION
    }
