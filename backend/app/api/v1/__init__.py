from fastapi import APIRouter

from app.api.v1 import etf

api_router = APIRouter()
api_router.include_router(etf.router, prefix="/etfs", tags=["etfs"])
