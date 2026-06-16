"""文献路由 —— Phase 1 最小实现（list + detail），验证端到端连通。

完整 CRUD / 批量操作 / 过滤分页将在 Phase 2 实现。
响应模型使用 codegen 生成的 Pydantic 模型（与前端 TS 类型对齐）。
"""
from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.api.deps import SessionDep
from app.db.tables import Literature
from app.models._generated.models import Literature as LiteratureDTO

router = APIRouter(prefix="/literature", tags=["literature"])


@router.get("")
async def list_literature(session: SessionDep) -> dict[str, object]:
    """文献列表（MVP 简版，未分页）。"""
    result = await session.execute(select(Literature).order_by(Literature.id.desc()))
    items = result.scalars().all()
    return {
        "items": [_to_dto(item).model_dump() for item in items],
        "total": len(items),
    }


@router.get("/{literature_id}", response_model=LiteratureDTO)
async def get_literature(literature_id: int, session: SessionDep) -> LiteratureDTO:
    result = await session.execute(select(Literature).where(Literature.id == literature_id))
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="Literature not found")
    return _to_dto(item)


def _to_dto(item: Literature) -> LiteratureDTO:
    """ORM 行 → Pydantic DTO（字段名 camelCase 对齐前端）。"""
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
