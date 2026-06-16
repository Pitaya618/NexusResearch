"""Skill 市场与执行路由。

对齐前端 dto.ts 的 SkillListRequest / InstallSkillRequest / UpdateSkillRequest。
"""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.api.deps import SessionDep
from app.core.errors import NotFoundError
from app.services.skills.executor import execute_skill, stream_skill
from app.services.skills.registry import registry
from app.utils.streaming import sse_stream

router = APIRouter(prefix="/skills", tags=["skill"])


class SkillExecuteInput(BaseModel):
    """Skill 执行输入。"""

    variables: dict[str, str] = {}
    module: str = "essay"
    modelId: str | None = None


@router.get("")
async def list_skills(
    category: str | None = Query(None),
    module: str | None = Query(None),
    status: str | None = Query(None),
    search: str | None = Query(None),
) -> dict:
    """技能列表（支持过滤）。"""
    registry.ensure_loaded()
    skills = registry.all_skills()

    items = []
    for m in skills:
        dto = m.to_dto(status="installed" if registry.is_installed(m.id) else "available")
        if category and category not in m.category:
            continue
        if module and module not in m.module:
            continue
        if status and dto["status"] != status:
            continue
        if search and search.lower() not in m.name.lower() and search.lower() not in m.description.lower():
            continue
        items.append(dto)

    return {
        "items": items,
        "total": len(items),
        "page": 1,
        "pageSize": 100,
        "totalPages": 1,
    }


@router.get("/{skill_id}")
async def get_skill(skill_id: str) -> dict:
    m = registry.get(skill_id)
    if m is None:
        raise NotFoundError(f"Skill {skill_id} 不存在")
    return m.to_dto(status="installed" if registry.is_installed(skill_id) else "available")


@router.post("/{skill_id}/install")
async def install_skill(skill_id: str) -> dict:
    ok = registry.install(skill_id)
    if not ok:
        raise NotFoundError(f"Skill {skill_id} 不存在，无法安装")
    return {"ok": True, "skillId": skill_id}


@router.delete("/{skill_id}")
async def uninstall_skill(skill_id: str) -> dict:
    ok = registry.uninstall(skill_id)
    if not ok:
        raise NotFoundError(f"Skill {skill_id} 未安装或不存在")
    return {"ok": True, "skillId": skill_id}


@router.post("/{skill_id}/execute")
async def execute_skill_route(
    skill_id: str, session: SessionDep, req: SkillExecuteInput
) -> dict:
    """同步执行 Skill（返回完整结果）。"""
    result = await execute_skill(
        session, skill_id, req.variables, module=req.module, model_id=req.modelId
    )
    return {"result": result, "skillId": skill_id}


@router.post("/{skill_id}/stream")
async def stream_skill_route(skill_id: str, session: SessionDep, req: SkillExecuteInput):
    """流式执行 Skill（SSE）。"""

    async def event_source():
        async with session:
            async for event in stream_skill(
                session, skill_id, req.variables, module=req.module, model_id=req.modelId
            ):
                yield event

    return sse_stream(event_source())
