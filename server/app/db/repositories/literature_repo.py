"""文献数据访问层。

封装所有 Literature 表的查询与变更，供 service 层调用。
返回 ORM 对象，由 service 层负责序列化为 DTO。
"""
from __future__ import annotations

import json

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.tables import Literature


async def list_literature(
    session: AsyncSession,
    *,
    collection_id: str | None = None,
    tag_ids: list[str] | None = None,
    read_status: str | None = None,
    is_favorite: bool | None = None,
    search: str | None = None,
    sort_field: str = "id",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[Literature], int]:
    """分页查询文献，支持多条件过滤与排序。

    返回 (items, total)。
    """
    stmt = select(Literature)

    # 系统收藏夹过滤（all/important/read/unread）
    if collection_id == "important":
        stmt = stmt.where(Literature.is_favorite.is_(True))
    elif collection_id == "read":
        stmt = stmt.where(Literature.read_status == "read")
    elif collection_id == "unread":
        stmt = stmt.where(Literature.read_status == "unread")
    # 'all' 或自定义收藏夹暂不过滤（自定义收藏夹需关联表，Phase 后期实现）

    if read_status:
        stmt = stmt.where(Literature.read_status == read_status)
    if is_favorite is not None:
        stmt = stmt.where(Literature.is_favorite.is_(is_favorite))

    # 标签过滤：tags 是 JSON 数组字符串，用 LIKE 近似匹配（SQLite 无 JSON 查询）
    if tag_ids:
        for t in tag_ids:
            stmt = stmt.where(Literature.tags.like(f'%"{t}"%'))

    # 搜索（标题/作者/期刊）
    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            (Literature.title.like(like))
            | (Literature.authors.like(like))
            | (Literature.journal.like(like))
        )

    # 总数
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    # 排序
    sort_col = getattr(Literature, sort_field, Literature.id)
    stmt = stmt.order_by(sort_col.desc() if sort_dir == "desc" else sort_col.asc())

    # 分页
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    items = (await session.execute(stmt)).scalars().all()
    return list(items), total


async def get_literature(session: AsyncSession, literature_id: int) -> Literature | None:
    return (
        await session.execute(select(Literature).where(Literature.id == literature_id))
    ).scalar_one_or_none()


async def create_literature(session: AsyncSession, **fields) -> Literature:
    """创建文献。tags 接收 list[str]，内部序列化为 JSON。"""
    tags = fields.pop("tags", None)
    if tags is not None and not isinstance(tags, str):
        fields["tags"] = json.dumps(tags, ensure_ascii=False)
    literature = Literature(**fields)
    session.add(literature)
    await session.commit()
    await session.refresh(literature)
    return literature


async def update_literature(
    session: AsyncSession, literature_id: int, fields: dict
) -> Literature | None:
    literature = await get_literature(session, literature_id)
    if literature is None:
        return None
    tags = fields.pop("tags", None)
    if tags is not None and not isinstance(tags, str):
        fields["tags"] = json.dumps(tags, ensure_ascii=False)
    for key, value in fields.items():
        setattr(literature, key, value)
    await session.commit()
    await session.refresh(literature)
    return literature


async def delete_literature(session: AsyncSession, literature_id: int) -> bool:
    literature = await get_literature(session, literature_id)
    if literature is None:
        return False
    await session.delete(literature)
    await session.commit()
    return True


async def bulk_action(
    session: AsyncSession, ids: list[int], action: str, payload: str | None = None
) -> int:
    """批量操作，返回受影响行数。"""
    if not ids:
        return 0
    items = (
        await session.execute(select(Literature).where(Literature.id.in_(ids)))
    ).scalars().all()

    affected = 0
    for item in items:
        if action == "delete":
            await session.delete(item)
        elif action == "markAsRead":
            item.read_status = "read"
        elif action == "markAsUnread":
            item.read_status = "unread"
        elif action == "addFavorite":
            item.is_favorite = True
        elif action == "removeFavorite":
            item.is_favorite = False
        elif action == "addTag":
            tags = json.loads(item.tags) if item.tags else []
            if payload and payload not in tags:
                tags.append(payload)
                item.tags = json.dumps(tags, ensure_ascii=False)
        elif action == "removeTag":
            tags = json.loads(item.tags) if item.tags else []
            if payload in tags:
                tags.remove(payload)
                item.tags = json.dumps(tags, ensure_ascii=False)
        affected += 1

    await session.commit()
    return affected


async def get_stats(session: AsyncSession) -> dict:
    """文献概览统计。"""
    total = (
        await session.execute(select(func.count(Literature.id)))
    ).scalar_one()

    favorite_count = (
        await session.execute(
            select(func.count(Literature.id)).where(Literature.is_favorite.is_(True))
        )
    ).scalar_one()

    read_count = (
        await session.execute(
            select(func.count(Literature.id)).where(Literature.read_status == "read")
        )
    ).scalar_one()

    unread_count = (
        await session.execute(
            select(func.count(Literature.id)).where(Literature.read_status == "unread")
        )
    ).scalar_one()

    with_ai_summary = (
        await session.execute(
            select(func.count(Literature.id)).where(Literature.ai_summary != "")
        )
    ).scalar_one()

    return {
        "total": total,
        "favoriteCount": favorite_count,
        "readCount": read_count,
        "unreadCount": unread_count,
        "withAiSummary": with_ai_summary,
    }
