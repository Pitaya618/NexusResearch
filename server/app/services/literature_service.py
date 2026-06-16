"""文献业务服务层。

协调 repository 与 DTO 序列化，处理业务逻辑（如默认值、校验）。
路由层调用本模块，不直接访问 repository。
"""
from __future__ import annotations

import json

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories import literature_repo
from app.db.tables import Literature
from app.models._generated.models import (
    CreateLiteratureRequest,
    Literature as LiteratureDTO,
    LiteratureListItem as LiteratureListItemDTO,
    UpdateLiteratureRequest,
)

# DTO 字段名（camelCase）→ ORM 列名（snake_case）映射
_FIELD_MAP = {
    "aiSummary": "ai_summary",
    "isFavorite": "is_favorite",
    "readStatus": "read_status",
    "pdfUrl": "pdf_path",
    "filePath": "file_path",
}


def _to_orm_fields(dto_fields: dict) -> dict:
    """将 DTO 字段名转换为 ORM 列名。tags 单独处理（list → JSON）。"""
    orm_fields = {}
    for key, value in dto_fields.items():
        orm_key = _FIELD_MAP.get(key, key)
        orm_fields[orm_key] = value
    return orm_fields


def to_dto(item: Literature) -> LiteratureDTO:
    """ORM 行 → 完整 DTO（含 abstract/aiSummary）。"""
    return LiteratureDTO(
        id=item.id,
        title=item.title,
        authors=item.authors,
        journal=item.journal,
        year=item.year,
        doi=item.doi,
        abstract=item.abstract,
        aiSummary=item.ai_summary,
        tags=json.loads(item.tags) if item.tags else [],
        isFavorite=item.is_favorite,
        readStatus=item.read_status,
        pdfUrl=item.pdf_path,
        filePath=item.file_path,
    )


def to_list_item(item: Literature) -> LiteratureListItemDTO:
    """ORM 行 → 列表项 DTO（不含完整 abstract，仅 preview）。"""
    abstract = item.abstract or ""
    return LiteratureListItemDTO(
        id=item.id,
        title=item.title,
        authors=item.authors,
        journal=item.journal,
        year=item.year,
        tags=json.loads(item.tags) if item.tags else [],
        readStatus=item.read_status,
        isFavorite=item.is_favorite,
        abstractPreview=abstract[:200] + ("…" if len(abstract) > 200 else ""),
    )


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
) -> dict:
    items, total = await literature_repo.list_literature(
        session,
        collection_id=collection_id,
        tag_ids=tag_ids,
        read_status=read_status,
        is_favorite=is_favorite,
        search=search,
        sort_field=sort_field,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )
    return {
        "items": [to_list_item(i).model_dump() for i in items],
        "total": total,
        "page": page,
        "pageSize": page_size,
        "totalPages": (total + page_size - 1) // page_size if page_size > 0 else 1,
    }


async def get_literature(session: AsyncSession, literature_id: int) -> LiteratureDTO | None:
    item = await literature_repo.get_literature(session, literature_id)
    return to_dto(item) if item else None


async def create_literature(
    session: AsyncSession, req: CreateLiteratureRequest
) -> LiteratureDTO:
    fields = _to_orm_fields(req.model_dump(exclude_none=True, exclude={"importSource"}))
    item = await literature_repo.create_literature(session, **fields)
    return to_dto(item)


async def update_literature(
    session: AsyncSession, literature_id: int, req: UpdateLiteratureRequest
) -> LiteratureDTO | None:
    fields = _to_orm_fields(req.model_dump(exclude_none=True, exclude={"id"}))
    item = await literature_repo.update_literature(session, literature_id, fields)
    return to_dto(item) if item else None


async def delete_literature(session: AsyncSession, literature_id: int) -> bool:
    return await literature_repo.delete_literature(session, literature_id)


async def bulk_action(
    session: AsyncSession, ids: list[int], action: str, payload: str | None = None
) -> int:
    return await literature_repo.bulk_action(session, ids, action, payload)


async def get_stats(session: AsyncSession) -> dict:
    return await literature_repo.get_stats(session)
