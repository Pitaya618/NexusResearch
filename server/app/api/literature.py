"""文献路由 —— 完整 CRUD + 批量操作 + 过滤分页 + 统计。

对齐前端 dto.ts 的 LiteratureListRequest / CreateLiteratureRequest /
UpdateLiteratureRequest / DeleteLiteratureRequest / BulkLiteratureAction。
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.api.deps import SessionDep
from app.core.errors import NotFoundError
from app.models._generated.models import (
    CreateLiteratureRequest,
    Literature as LiteratureDTO,
    UpdateLiteratureRequest,
)
from app.services import literature_service

router = APIRouter(prefix="/literature", tags=["literature"])


class LiteratureCreateInput(BaseModel):
    """创建文献的宽松输入 —— 仅 title 必填，其余可选并填充默认值。

    前端 TS 类型 CreateLiteratureRequest 声明所有字段必填，但实际创建场景
    （如 DOI 导入、手动录入）可能仅提供部分字段。后端在此补全默认值。
    """

    title: str
    authors: str = ""
    journal: str = ""
    year: int | None = None
    doi: str = ""
    abstract: str = ""
    tags: list[str] = []
    isFavorite: bool = False
    readStatus: str = "unread"
    pdfUrl: str | None = None
    filePath: str | None = None
    importSource: str | None = None


class LiteratureUpdateInput(BaseModel):
    """更新文献的宽松输入 —— 所有字段可选（id 来自 URL）。"""

    title: str | None = None
    authors: str | None = None
    journal: str | None = None
    year: int | None = None
    tags: list[str] | None = None
    isFavorite: bool | None = None
    readStatus: str | None = None


@router.get("")
async def list_literature(
    session: SessionDep,
    collectionId: str | None = Query(None),
    tagIds: str | None = Query(None, description="逗号分隔的标签 ID"),
    readStatus: str | None = Query(None),
    isFavorite: bool | None = Query(None),
    search: str | None = Query(None),
    sortField: str = Query("id"),
    sortDir: str = Query("desc"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
) -> dict:
    """文献列表（分页 + 多条件过滤）。"""
    return await literature_service.list_literature(
        session,
        collection_id=collectionId,
        tag_ids=tagIds.split(",") if tagIds else None,
        read_status=readStatus,
        is_favorite=isFavorite,
        search=search,
        sort_field=sortField,
        sort_dir=sortDir,
        page=page,
        page_size=pageSize,
    )


@router.get("/stats")
async def get_stats(session: SessionDep) -> dict:
    """文献概览统计。"""
    return await literature_service.get_stats(session)


@router.get("/{literature_id}", response_model=LiteratureDTO)
async def get_literature(literature_id: int, session: SessionDep) -> LiteratureDTO:
    item = await literature_service.get_literature(session, literature_id)
    if item is None:
        raise NotFoundError(f"文献 {literature_id} 不存在")
    return item


@router.post("", response_model=LiteratureDTO, status_code=201)
async def create_literature(
    session: SessionDep, req: LiteratureCreateInput
) -> LiteratureDTO:
    return await literature_service.create_literature(session, req)  # type: ignore[arg-type]


@router.patch("/{literature_id}", response_model=LiteratureDTO)
async def update_literature(
    literature_id: int, session: SessionDep, req: LiteratureUpdateInput
) -> LiteratureDTO:
    item = await literature_service.update_literature(session, literature_id, req)  # type: ignore[arg-type]
    if item is None:
        raise NotFoundError(f"文献 {literature_id} 不存在")
    return item


@router.delete("/{literature_id}")
async def delete_literature(literature_id: int, session: SessionDep) -> dict:
    ok = await literature_service.delete_literature(session, literature_id)
    if not ok:
        raise NotFoundError(f"文献 {literature_id} 不存在")
    return {"ok": True, "id": literature_id}


@router.post("/bulk")
async def bulk_action(session: SessionDep, body: dict) -> dict:
    """批量操作。

    body: { ids: number[], action: 'delete'|'markAsRead'|..., payload?: string }
    """
    ids = body.get("ids", [])
    action = body.get("action", "")
    payload = body.get("payload")
    affected = await literature_service.bulk_action(session, ids, action, payload)
    return {"ok": True, "affected": affected}
