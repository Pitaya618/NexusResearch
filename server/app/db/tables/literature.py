"""文献实体 ORM 表。

对应前端 entities.ts 的 Literature / LiteratureListItem。
注意：tags 存 JSON 字符串（SQLite 无原生数组），由 repository 层序列化。
"""
from __future__ import annotations

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Literature(Base, TimestampMixin):
    """文献记录。id 为自增整数（对齐前端 Literature.id: number）。"""

    __tablename__ = "literature"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    authors: Mapped[str] = mapped_column(Text, default="")
    journal: Mapped[str] = mapped_column(String(500), default="")
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    doi: Mapped[str] = mapped_column(String(255), default="")
    abstract: Mapped[str] = mapped_column(Text, default="")
    ai_summary: Mapped[str] = mapped_column(Text, default="")
    # JSON 数组序列化为字符串：["tag1","tag2"]
    tags: Mapped[str] = mapped_column(Text, default="[]")
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    read_status: Mapped[str] = mapped_column(String(20), default="unread")  # read|unread
    # 文件系统引用（二进制存文件系统，DB 只存路径）
    pdf_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_path: Mapped[str | None] = mapped_column(Text, nullable=True)
