"""聊天历史 ORM 表。

对应前端 entities.ts 的 ChatMessage，按 AiContext（literature/essay/paper/reader）关联。
"""
from __future__ import annotations

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ChatMessage(Base):
    """聊天消息。按上下文类型 + 实体 ID 关联。"""

    __tablename__ = "chat_message"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    # literature | essay | paper | reader（对齐 AiContext.type）
    context_type: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    # 关联实体 ID（literature 为数字字符串，其余为 UUID）
    context_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    # reader 上下文额外存页码
    context_page: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # user | assistant
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, default="")
    model_used: Mapped[str] = mapped_column(String(200), default="")
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[str] = mapped_column(String(40), default="")
