"""FastAPI 依赖注入。"""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session

# 可复用的 Session 依赖类型，路由层直接：session: SessionDep
SessionDep = Annotated[AsyncSession, Depends(get_session)]
