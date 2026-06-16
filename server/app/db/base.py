"""SQLAlchemy 声明式基类与公共列混入。"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """所有 ORM 表的基类。"""


class TimestampMixin:
    """公共时间戳列：created_at / updated_at（ISO 字符串存储）。"""

    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        server_default=func.current_timestamp(),
        nullable=False,
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )


def now_iso() -> str:
    """当前 UTC 时间的 ISO 8601 字符串（对齐前端 ISODateString）。"""
    return datetime.now(timezone.utc).isoformat()
