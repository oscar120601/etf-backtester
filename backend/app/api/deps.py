"""
API 依賴注入
"""
from typing import Generator

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db as get_db_session


# 直接使用 db 模組的 get_db
get_db = get_db_session
