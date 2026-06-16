"""Provider 与模块分配数据访问层。"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.tables import ModuleModelAssignment, Provider


async def get_provider(session: AsyncSession, provider_id: str) -> Provider | None:
    return (
        await session.execute(select(Provider).where(Provider.id == provider_id))
    ).scalar_one_or_none()


async def list_providers(session: AsyncSession) -> list[Provider]:
    return list(
        (await session.execute(select(Provider).order_by(Provider.name))).scalars().all()
    )


async def upsert_provider(session: AsyncSession, **fields) -> Provider:
    """创建或更新 Provider（按 id）。"""
    provider_id = fields.get("id")
    existing = await get_provider(session, provider_id) if provider_id else None
    if existing:
        for k, v in fields.items():
            setattr(existing, k, v)
        await session.commit()
        await session.refresh(existing)
        return existing
    provider = Provider(**fields)
    session.add(provider)
    await session.commit()
    await session.refresh(provider)
    return provider


async def delete_provider(session: AsyncSession, provider_id: str) -> bool:
    provider = await get_provider(session, provider_id)
    if provider is None:
        return False
    await session.delete(provider)
    await session.commit()
    return True


async def get_assignment(
    session: AsyncSession, module: str
) -> ModuleModelAssignment | None:
    return (
        await session.execute(
            select(ModuleModelAssignment).where(ModuleModelAssignment.module == module)
        )
    ).scalar_one_or_none()


async def list_assignments(session: AsyncSession) -> list[ModuleModelAssignment]:
    return list((await session.execute(select(ModuleModelAssignment))).scalars().all())


async def set_assignment(
    session: AsyncSession, module: str, model_id: str, purpose: str = ""
) -> ModuleModelAssignment:
    existing = await get_assignment(session, module)
    if existing:
        existing.model_id = model_id
        existing.purpose = purpose
    else:
        existing = ModuleModelAssignment(module=module, model_id=model_id, purpose=purpose)
        session.add(existing)
    await session.commit()
    await session.refresh(existing)
    return existing
