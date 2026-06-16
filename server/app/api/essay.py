"""随笔路由 —— 完整 CRUD。

对齐前端 dto.ts 的 EssayListRequest / CreateEssayRequest / UpdateEssayRequest。
"""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.api.deps import SessionDep
from app.core.errors import NotFoundError
from app.models._generated.models import (
    CreateEssayRequest,
    Essay as EssayDTO,
    UpdateEssayRequest,
)
from app.services import essay_service

router = APIRouter(prefix="/essays", tags=["essay"])


class EssayUpdateInput(BaseModel):
    """更新随笔的宽松输入 —— 所有字段可选（id 来自 URL）。"""

    title: str | None = None
    content: str | None = None
    tag: str | None = None


@router.get("")
async def list_essays(
    session: SessionDep,
    tag: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
) -> dict:
    return await essay_service.list_essays(
        session, tag=tag, search=search, page=page, page_size=pageSize
    )


@router.get("/{essay_id}", response_model=EssayDTO)
async def get_essay(essay_id: str, session: SessionDep) -> EssayDTO:
    item = await essay_service.get_essay(session, essay_id)
    if item is None:
        raise NotFoundError(f"随笔 {essay_id} 不存在")
    return item


@router.post("", response_model=EssayDTO, status_code=201)
async def create_essay(session: SessionDep, req: CreateEssayRequest) -> EssayDTO:
    return await essay_service.create_essay(session, req)


@router.patch("/{essay_id}", response_model=EssayDTO)
async def update_essay(
    essay_id: str, session: SessionDep, req: EssayUpdateInput
) -> EssayDTO:
    item = await essay_service.update_essay(session, essay_id, req)  # type: ignore[arg-type]
    if item is None:
        raise NotFoundError(f"随笔 {essay_id} 不存在")
    return item


@router.delete("/{essay_id}")
async def delete_essay(essay_id: str, session: SessionDep) -> dict:
    ok = await essay_service.delete_essay(session, essay_id)
    if not ok:
        raise NotFoundError(f"随笔 {essay_id} 不存在")
    return {"ok": True, "id": essay_id}
