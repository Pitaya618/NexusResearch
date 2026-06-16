"""Provider 管理路由。

对齐前端 dto.ts 的 ProviderTestRequest / FetchModelsRequest。
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps import SessionDep
from app.core.errors import NotFoundError
from app.services import provider_service

router = APIRouter(prefix="/providers", tags=["provider"])


class ProviderUpsertInput(BaseModel):
    """创建/更新 Provider 输入。"""

    name: str = ""
    icon: str = ""
    description: str = ""
    baseUrl: str = ""
    apiKey: str | None = None  # 明文，内部加密
    compatibilityType: str = "openai"
    isDefault: bool = False


class AssignmentInput(BaseModel):
    """模块模型分配输入。"""

    module: str
    modelId: str
    purpose: str = ""


@router.get("")
async def list_providers(session: SessionDep) -> list[dict]:
    return await provider_service.list_providers(session)


@router.get("/{provider_id}")
async def get_provider(provider_id: str, session: SessionDep) -> dict:
    dto = await provider_service.get_provider_dto(session, provider_id)
    if dto is None:
        raise NotFoundError(f"Provider {provider_id} 不存在")
    return dto


@router.put("/{provider_id}")
async def upsert_provider(
    provider_id: str, session: SessionDep, req: ProviderUpsertInput
) -> dict:
    return await provider_service.upsert_provider(
        session,
        provider_id,
        name=req.name,
        icon=req.icon,
        description=req.description,
        base_url=req.baseUrl,
        api_key=req.apiKey,
        compatibility_type=req.compatibilityType,
        is_default=req.isDefault,
    )


@router.delete("/{provider_id}")
async def delete_provider(provider_id: str, session: SessionDep) -> dict:
    ok = await provider_service.delete_provider(session, provider_id)
    if not ok:
        raise NotFoundError(f"Provider {provider_id} 不存在")
    return {"ok": True, "id": provider_id}


@router.post("/{provider_id}/test")
async def test_provider(provider_id: str, session: SessionDep) -> dict:
    """测试连通性。"""
    return await provider_service.test_connection(session, provider_id)


@router.get("/{provider_id}/models")
async def fetch_models(provider_id: str, session: SessionDep) -> dict:
    """拉取可用模型列表。"""
    models = await provider_service.fetch_models(session, provider_id)
    return {"models": models, "providerId": provider_id}


# ============ 模块模型分配 ============

@router.get("/assignments/all")
async def list_assignments(session: SessionDep) -> list[dict]:
    return await provider_service.list_assignments(session)


@router.put("/assignments/{module}")
async def set_assignment(module: str, session: SessionDep, req: AssignmentInput) -> dict:
    return await provider_service.set_assignment(session, module, req.modelId, req.purpose)
