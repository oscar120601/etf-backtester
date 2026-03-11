"""
SQLAlchemy 基礎模型
"""
from sqlalchemy import MetaData
from sqlalchemy.orm import declarative_base, declared_attr

# 命名約束規則
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=convention)
Base = declarative_base(metadata=metadata)


class BaseModel(Base):
    """基礎模型類別"""
    
    __abstract__ = True
    
    @declared_attr.directive
    def __tablename__(cls) -> str:
        """自動產生資料表名稱（複數小寫）"""
        return cls.__name__.lower() + "s"
