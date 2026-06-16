"""Provider 业务服务层。

处理 Provider CRUD、连通性测试、模型列表拉取、模块分配。
API Key 加密/解密在此层完成，绝不向路由层暴露明文。
"""
from __future__ import annotations

import time

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AIProviderError, NotFoundError
from app.db.repositories import provider_repo
from app.utils.crypto import decrypt, encrypt


def _to_dto(p, *, hide_key: bool = True) -> dict:
    """Provider ORM → DTO（默认隐藏 API Key 明文）。"""
    return {
        "id": p.id,
        "name": p.name,
        "icon": p.icon,
        "description": p.description,
        "baseUrl": p.base_url,
        # 不返回明文 key，仅返回是否已配置的标记
        "apiKey": ("•" * 8 + (p.api_key_encrypted[-4:] if p.api_key_encrypted else "")) if (hide_key and p.api_key_encrypted) else "",
        "apiKeyConfigured": bool(p.api_key_encrypted),
        "compatibilityType": p.compatibility_type,
        "connectionStatus": p.connection_status,
        "isDefault": p.is_default,
    }


async def list_providers(session: AsyncSession) -> list[dict]:
    items = await provider_repo.list_providers(session)
    return [_to_dto(p) for p in items]


async def get_provider_dto(session: AsyncSession, provider_id: str) -> dict | None:
    p = await provider_repo.get_provider(session, provider_id)
    return _to_dto(p) if p else None


async def upsert_provider(
    session: AsyncSession,
    provider_id: str,
    *,
    name: str = "",
    icon: str = "",
    description: str = "",
    base_url: str = "",
    api_key: str | None = None,
    compatibility_type: str = "openai",
    is_default: bool = False,
) -> dict:
    """创建或更新 Provider。api_key 为明文，内部加密。"""
    fields = {
        "id": provider_id,
        "name": name,
        "icon": icon,
        "description": description,
        "base_url": base_url,
        "compatibility_type": compatibility_type,
        "connection_status": "not-configured",
        "is_default": is_default,
    }
    # 仅当传入 api_key 时才更新（避免覆盖已有 key）
    if api_key is not None and api_key != "":
        fields["api_key_encrypted"] = encrypt(api_key)
        fields["connection_status"] = "connected"

    p = await provider_repo.upsert_provider(session, **fields)
    # 若设为默认，清除其他默认
    if is_default:
        others = await provider_repo.list_providers(session)
        for o in others:
            if o.id != provider_id and o.is_default:
                o.is_default = False
        await session.commit()
    return _to_dto(p)


async def delete_provider(session: AsyncSession, provider_id: str) -> bool:
    return await provider_repo.delete_provider(session, provider_id)


async def test_connection(session: AsyncSession, provider_id: str) -> dict:
    """测试 Provider 连通性，返回 success/latency/error。"""
    import httpx

    p = await provider_repo.get_provider(session, provider_id)
    if p is None:
        raise NotFoundError(f"Provider {provider_id} 不存在")

    api_key = decrypt(p.api_key_encrypted)
    if not api_key:
        return {"success": False, "latency": 0, "error": "API Key 未配置"}

    # OpenAI 兼容：GET /models 验证
    base = p.base_url.rstrip("/") if p.base_url else "https://api.openai.com"
    url = f"{base}/v1/models" if not base.endswith("/v1") else f"{base}/models"

    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, headers={"Authorization": f"Bearer {api_key}"})
        latency = int((time.monotonic() - start) * 1000)
        if resp.status_code == 200:
            # 更新连接状态
            p.connection_status = "connected"
            await session.commit()
            return {"success": True, "latency": latency, "error": None}
        return {
            "success": False,
            "latency": latency,
            "error": f"HTTP {resp.status_code}: {resp.text[:200]}",
        }
    except Exception as e:
        p.connection_status = "error"
        await session.commit()
        return {"success": False, "latency": 0, "error": str(e)}


async def fetch_models(session: AsyncSession, provider_id: str) -> list[dict]:
    """拉取 Provider 可用模型列表。"""
    import httpx

    p = await provider_repo.get_provider(session, provider_id)
    if p is None:
        raise NotFoundError(f"Provider {provider_id} 不存在")

    api_key = decrypt(p.api_key_encrypted)
    if not api_key:
        raise AIProviderError(f"Provider {provider_id} 的 API Key 未配置")

    base = p.base_url.rstrip("/") if p.base_url else "https://api.openai.com"
    url = f"{base}/v1/models" if not base.endswith("/v1") else f"{base}/models"

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, headers={"Authorization": f"Bearer {api_key}"})
    if resp.status_code != 200:
        raise AIProviderError(f"拉取模型失败: HTTP {resp.status_code}")

    data = resp.json()
    models = []
    for m in data.get("data", []):
        mid = m.get("id", "")
        models.append({
            "id": mid,
            "name": mid,
            "meta": m.get("owned_by", ""),
            "tags": [],
            "isHot": False,
        })
    return models


async def list_assignments(session: AsyncSession) -> list[dict]:
    items = await provider_repo.list_assignments(session)
    return [
        {"module": a.module, "modelId": a.model_id, "purpose": a.purpose} for a in items
    ]


async def set_assignment(session: AsyncSession, module: str, model_id: str, purpose: str = "") -> dict:
    a = await provider_repo.set_assignment(session, module, model_id, purpose)
    return {"module": a.module, "modelId": a.model_id, "purpose": a.purpose}
