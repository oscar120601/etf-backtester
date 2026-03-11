"""
数据库连接 - 使用 SQLite 版本
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# 使用 SQLite 配置
from app.config_sqlite import DATABASE_URL, DEBUG

# 创建引擎 - SQLite
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=DEBUG
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
