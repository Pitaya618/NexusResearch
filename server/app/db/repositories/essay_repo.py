"""随笔数据访问层。"""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.tables import Essay


async def list_essays(
    session: AsyncSession,
    *,
    tag: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[Essay], int]:
    stmt = select(Essay)
    if tag:
        stmt = stmt.where(Essay.tag == tag)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(Essay.title.like(like) | Essay.content.like(like))

    total = (await session.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    stmt = stmt.order_by(Essay.updated_at.desc()).offset((page - 1) * page_size).limit(page_size)
    items = (await session.execute(stmt)).scalars().all()
    return list(items), total


async def get_essay(session: AsyncSession, essay_id: str) -> Essay | None:
    return (
        await session.execute(select(Essay).where(Essay.id == essay_id))
    ).scalar_one_or_none()


async def create_essay(session: AsyncSession, **fields) -> Essay:
    fields.setdefault("id", None)
    essay = Essay(**fields)
    session.add(essay)
    await session.commit()
    await session.refresh(essay)
    return essay


async def update_essay(session: AsyncSession, essay_id: str, fields: dict) -> Essay | None:
    essay = await get_essay(session, essay_id)
    if essay is None:
        return None
    for key, value in fields.items():
        setattr(essay, key, value)
    await session.commit()
    await session.refresh(essay)
    return essay


async def delete_essay(session: AsyncSession, essay_id: str) -> bool:
    essay = await get_essay(session, essay_id)
    if essay is None:
        return False
    await session.delete(essay)
    await session.commit()
    return True
