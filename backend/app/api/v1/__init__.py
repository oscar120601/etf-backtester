from fastapi import APIRouter

from app.api.v1 import etf
from app.api.v1.endpoints import backtest, saved_backtests, data_sync

api_router = APIRouter()
api_router.include_router(etf.router, prefix="/etfs", tags=["etfs"])
api_router.include_router(backtest.router, prefix="/backtest", tags=["backtest"])
api_router.include_router(saved_backtests.router, prefix="/saved-backtests", tags=["saved-backtests"])
api_router.include_router(data_sync.router, prefix="/data-sync", tags=["data-sync"])
