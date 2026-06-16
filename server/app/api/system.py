"""系统路由 —— 健康、信息、导入导出、存储、用量。

对齐前端 dto.ts 的 ImportDataResponse / ConnectionTestResponse / StorageInfo。
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from fastapi import APIRouter, UploadFile, File
from fastapi.responses import Response

from app.api.deps import SessionDep
from app.core.config import settings
from app.services import data_io, usage_service

router = APIRouter(tags=["system"])


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


# ============ 数据导入导出 ============


@router.get("/system/export")
async def export_data(session: SessionDep, format: str = "json") -> Response:
    """导出数据。format: json | nrz。"""
    if format == "nrz":
        content = await data_io.export_to_nrz(session)
        return Response(
            content=content,
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=nexusresearch-backup.nrz"},
        )
    # 默认 JSON
    data = await data_io.export_to_json(session)
    return Response(
        content=json.dumps(data, ensure_ascii=False, indent=2).encode(),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=nexusresearch-export.json"},
    )


@router.post("/system/import")
async def import_data(
    session: SessionDep,
    file: UploadFile = File(...),
    merge: bool = True,
) -> dict:
    """导入数据（.nrz 或 .json 文件上传）。"""
    content = await file.read()
    filename = file.filename or ""

    if filename.endswith(".nrz") or filename.endswith(".zip"):
        result = await data_io.import_from_nrz(session, content, merge=merge)
    else:
        data = json.loads(content.decode("utf-8"))
        result = await data_io.import_from_json(session, data, merge=merge)

    return result


# ============ 存储用量 ============


@router.get("/system/storage")
async def storage_info(session: SessionDep) -> dict:
    """本地存储用量明细。"""
    from sqlalchemy import func, select

    from app.db.tables import Essay, Literature

    data_dir = settings.data_dir
    breakdown = {
        "literature": _dir_size(data_dir / "pdfs"),
        "essays": 0,  # 随笔存 DB，不计文件系统
        "papers": _dir_size(data_dir / "papers"),
        "cache": _dir_size(data_dir / "cache"),
    }
    total = sum(breakdown.values()) + _file_size(data_dir / settings.db_filename)

    lit_count = (
        await session.execute(select(func.count(Literature.id)))
    ).scalar_one()
    essay_count = (
        await session.execute(select(func.count(Essay.id)))
    ).scalar_one()

    return {
        "used": _format_size(total),
        "available": _format_size(shutil.disk_usage(data_dir).free),
        "breakdown": {
            **{k: _format_size(v) for k, v in breakdown.items()},
            "unit": "MB",
            "literature_bytes": breakdown["literature"],
            "papers_bytes": breakdown["papers"],
            "cache_bytes": breakdown["cache"],
        },
        "dataPath": str(data_dir),
        "literatureCount": lit_count,
        "essayCount": essay_count,
        "paperCount": _count_subdirs(data_dir / "papers"),
    }


# ============ 用量统计 ============


@router.get("/system/usage/overview")
async def usage_overview(session: SessionDep) -> dict:
    return await usage_service.get_overview(session)


@router.get("/system/usage/by-model")
async def usage_by_model(session: SessionDep) -> list[dict]:
    return await usage_service.get_by_model(session)


@router.get("/system/usage/trend")
async def usage_trend(session: SessionDep, days: int = 7) -> list[dict]:
    return await usage_service.get_trend(session, days=days)


# ============ 辅助函数 ============


def _dir_size(path: Path) -> int:
    if not path.exists():
        return 0
    return sum(f.stat().st_size for f in path.rglob("*") if f.is_file())


def _file_size(path: Path) -> int:
    return path.stat().st_size if path.exists() else 0


def _count_subdirs(path: Path) -> int:
    if not path.exists():
        return 0
    return sum(1 for p in path.iterdir() if p.is_dir())


def _format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    if size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes / (1024 * 1024):.2f} MB"
