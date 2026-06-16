"""系统与健康检查路由。

/health —— Electron main 进程轮询以确认 sidecar 就绪。
/system  —— 版本、存储等基础信息。
"""
from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings
from app.core.logging import get_logger

router = APIRouter(tags=["system"])
logger = get_logger(__name__)


@router.get("/health")
async def health() -> dict[str, str]:
    """健康检查端点（供 sidecar 生命周期探测）。"""
    return {"status": "ok"}


@router.get("/system/info")
async def system_info() -> dict[str, object]:
    """系统基本信息。"""
    return {
        "app": settings.app_name,
        "version": settings.version,
        "env": settings.env,
        "dataDir": str(settings.data_dir),
    }
