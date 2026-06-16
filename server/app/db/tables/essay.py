"""随笔与 AI 编辑建议 ORM 表。

对应前端 entities.ts 的 Essay / AiEditSuggestion / DiffSegment。
"""
from __future__ import annotations

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Essay(Base, TimestampMixin):
    """随笔。id 为字符串（对齐前端 Essay.id: string）。"""

    __tablename__ = "essay"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(Text, default="")
    content: Mapped[str] = mapped_column(Text, default="")
    # 灵感 | 文献笔记 | 实验草稿 | 综述
    tag: Mapped[str] = mapped_column(String(50), default="灵感")
    word_count: Mapped[int] = mapped_column(Integer, default=0)


class AiEditSuggestion(Base):
    """AI 编辑建议（diff 片段）。segments 存 JSON 数组。"""

    __tablename__ = "ai_edit_suggestion"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    essay_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    # JSON: [{type: addition|deletion|unchanged, text: ...}]
    segments: Mapped[str] = mapped_column(Text, default="[]")
    accepted: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[str] = mapped_column(Text, default="")
