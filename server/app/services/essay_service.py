"""随笔业务服务层。"""
from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories import essay_repo
from app.db.tables import Essay
from app.models._generated.models import (
    CreateEssayRequest,
    Essay as EssayDTO,
    UpdateEssayRequest,
)

# DTO 字段名（camelCase）→ ORM 列名（snake_case）
_FIELD_MAP = {
    "wordCount": "word_count",
}


def _to_orm_fields(dto_fields: dict) -> dict:
    """将 DTO 字段名转换为 ORM 列名。"""
    return {_FIELD_MAP.get(k, k): v for k, v in dto_fields.items()}


def to_dto(item: Essay) -> EssayDTO:
    dto = EssayDTO(
        id=item.id,
        title=item.title,
        content=item.content,
        tag=item.tag,
        wordCount=int(item.word_count or 0),
        createdAt=item.created_at.isoformat() if hasattr(item.created_at, "isoformat") else str(item.created_at),
        updatedAt=item.updated_at.isoformat() if hasattr(item.updated_at, "isoformat") else str(item.updated_at),
    )
    return dto


def _count_words(text: str) -> int:
    """粗略字数统计（中英混合：英文按词，中文按字）。"""
    if not text:
        return 0
    import re

    # 去掉 markdown 标记后统计
    clean = re.sub(r"[#*`\[\]()>_~-]", "", text)
    chinese = len(re.findall(r"[\u4e00-\u9fff]", clean))
    english = len(re.findall(r"[a-zA-Z]+", clean))
    return chinese + english


async def list_essays(
    session: AsyncSession,
    *,
    tag: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> dict:
    items, total = await essay_repo.list_essays(
        session, tag=tag, search=search, page=page, page_size=page_size
    )
    return {
        "items": [to_dto(i).model_dump() for i in items],
        "total": total,
        "page": page,
        "pageSize": page_size,
        "totalPages": (total + page_size - 1) // page_size if page_size > 0 else 1,
    }


async def get_essay(session: AsyncSession, essay_id: str) -> EssayDTO | None:
    item = await essay_repo.get_essay(session, essay_id)
    return to_dto(item) if item else None


async def create_essay(session: AsyncSession, req: CreateEssayRequest) -> EssayDTO:
    fields = _to_orm_fields(req.model_dump(exclude_none=True))
    fields["id"] = f"essay-{uuid.uuid4().hex[:8]}"
    fields["word_count"] = _count_words(fields.get("content", ""))
    item = await essay_repo.create_essay(session, **fields)
    return to_dto(item)


async def update_essay(
    session: AsyncSession, essay_id: str, req: UpdateEssayRequest
) -> EssayDTO | None:
    fields = req.model_dump(exclude_none=True, exclude={"id"})
    if "content" in fields:
        fields["word_count"] = _count_words(fields["content"])
    item = await essay_repo.update_essay(session, essay_id, fields)
    return to_dto(item) if item else None


async def delete_essay(session: AsyncSession, essay_id: str) -> bool:
    return await essay_repo.delete_essay(session, essay_id)
