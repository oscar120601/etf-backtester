"""
SQLite 数据库连接（无 Docker 方案）
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from app.config_sqlite import settings

# 创建 SQLite 引擎
# check_same_thread=False 允许多线程访问（开发用）
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=settings.DEBUG
)

# 创建 Session 工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI 依赖注入用：获取数据库 Session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
