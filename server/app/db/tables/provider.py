"""AI 提供商与模块模型分配 ORM 表。

对应前端 entities.ts 的 Provider / ModuleModelAssignment。
API Key 经 AES 加密后存 api_key_encrypted（详见 utils/crypto.py）。
"""
from __future__ import annotations

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Provider(Base):
    """AI 服务商配置。"""

    __tablename__ = "provider"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), default="")
    icon: Mapped[str] = mapped_column(String(32), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    base_url: Mapped[str] = mapped_column(String(500), default="")
    # 加密存储，绝不返回明文
    api_key_encrypted: Mapped[str] = mapped_column(Text, default="")
    # openai | anthropic | custom
    compatibility_type: Mapped[str] = mapped_column(String(20), default="openai")
    # connected | not-configured | error
    connection_status: Mapped[str] = mapped_column(String(30), default="not-configured")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)


class ModuleModelAssignment(Base):
    """模块 → 模型映射（对齐前端 ModuleModelAssignment）。

    module: literature | reader | essay | paper
    model_id: 如 "anthropic:claude-3-5-sonnet"（providerId:modelName）
    """

    __tablename__ = "module_model_assignment"

    module: Mapped[str] = mapped_column(String(30), primary_key=True)
    model_id: Mapped[str] = mapped_column(String(200), default="")
    purpose: Mapped[str] = mapped_column(String(200), default="")
