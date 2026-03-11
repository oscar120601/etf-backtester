from fastapi import APIRouter

from app.api.v1 import etf
from app.api.v1.endpoints import backtest

api_router = APIRouter()
api_router.include_router(etf.router, prefix="/etfs", tags=["etfs"])
api_router.include_router(backtest.router, prefix="/backtest", tags=["backtest"])
