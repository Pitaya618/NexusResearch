"""数据导入/导出服务。

导出：将数据库 + PDF/论文工程打包为 .nrz（ZIP）。
导入：解压 .nrz，合并数据到当前数据库。
也支持 JSON 格式的结构化导出（便于迁移到其他后端）。
"""
from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.db.tables import (
    AiEditSuggestion,
    ChatMessage,
    Essay,
    Literature,
    ModuleModelAssignment,
    Provider,
)

logger = get_logger(__name__)


async def export_to_json(session: AsyncSession) -> dict:
    """导出全部结构化数据为 JSON 字典（不含二进制文件）。"""
    data: dict[str, list] = {}

    # 文献
    lits = (await session.execute(select(Literature))).scalars().all()
    data["literature"] = [_lit_to_dict(l) for l in lits]

    # 随笔
    essays = (await session.execute(select(Essay))).scalars().all()
    data["essays"] = [
        {
            "id": e.id,
            "title": e.title,
            "content": e.content,
            "tag": e.tag,
            "wordCount": e.word_count,
            "createdAt": str(e.created_at),
            "updatedAt": str(e.updated_at),
        }
        for e in essays
    ]

    # 聊天记录
    msgs = (await session.execute(select(ChatMessage))).scalars().all()
    data["chatMessages"] = [
        {
            "id": m.id,
            "contextType": m.context_type,
            "contextId": m.context_id,
            "role": m.role,
            "content": m.content,
            "modelUsed": m.model_used,
            "tokensUsed": m.tokens_used,
        }
        for m in msgs
    ]

    # Provider 配置（不含 API Key 明文，仅保留 base_url/兼容性）
    providers = (await session.execute(select(Provider))).scalars().all()
    data["providers"] = [
        {
            "id": p.id,
            "name": p.name,
            "baseUrl": p.base_url,
            "compatibilityType": p.compatibility_type,
            "isDefault": p.is_default,
            # 注意：api_key_encrypted 不导出（安全考虑）
        }
        for p in providers
    ]

    # 模块分配
    assignments = (await session.execute(select(ModuleModelAssignment))).scalars().all()
    data["moduleAssignments"] = [
        {"module": a.module, "modelId": a.model_id, "purpose": a.purpose}
        for a in assignments
    ]

    logger.info(
        "data_exported",
        literature=len(data["literature"]),
        essays=len(data["essays"]),
        messages=len(data["chatMessages"]),
    )
    return data


async def export_to_nrz(session: AsyncSession) -> bytes:
    """导出为 .nrz（ZIP）格式：含 JSON 数据 + 二进制文件。

    返回 ZIP 字节流。
    """
    buf = io.BytesIO()
    data = await export_to_json(session)

    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("data.json", json.dumps(data, ensure_ascii=False, indent=2))

        # 打包 PDF 文件（按 literature.id 命名）
        for lit_data in data["literature"]:
            pdf_rel = lit_data.get("pdfUrl")
            if pdf_rel:
                pdf_path = Path(pdf_rel)
                if not pdf_path.is_absolute():
                    pdf_path = settings.data_dir / pdf_path
                if pdf_path.exists():
                    arcname = f"pdfs/{lit_data['id']}.pdf"
                    zf.write(pdf_path, arcname)

        # 打包论文工程目录
        papers_dir = settings.data_dir / "papers"
        if papers_dir.exists():
            for project_dir in papers_dir.iterdir():
                if project_dir.is_dir():
                    for f in project_dir.rglob("*"):
                        if f.is_file():
                            arcname = f"papers/{project_dir.name}/{f.relative_to(project_dir)}"
                            zf.write(f, arcname)

    logger.info("nrz_exported", size=len(buf.getvalue()))
    return buf.getvalue()


async def import_from_json(session: AsyncSession, data: dict, *, merge: bool = True) -> dict:
    """从 JSON 字典导入数据。

    merge=True 时跳过已存在的记录（按 id）；False 时覆盖。
    返回导入统计。
    """
    imported = {"literature": 0, "essays": 0, "papers": 0, "settings": False}
    skipped = 0
    errors: list[str] = []

    # 文献
    for lit_data in data.get("literature", []):
        try:
            existing_id = lit_data.get("id")
            if merge and existing_id:
                existing = await session.get(Literature, existing_id)
                if existing:
                    skipped += 1
                    continue
            lit = Literature(
                id=existing_id,
                title=lit_data.get("title", ""),
                authors=lit_data.get("authors", ""),
                journal=lit_data.get("journal", ""),
                year=lit_data.get("year"),
                doi=lit_data.get("doi", ""),
                abstract=lit_data.get("abstract", ""),
                ai_summary=lit_data.get("aiSummary", ""),
                tags=json.dumps(lit_data.get("tags", []), ensure_ascii=False),
                is_favorite=lit_data.get("isFavorite", False),
                read_status=lit_data.get("readStatus", "unread"),
            )
            session.add(lit)
            imported["literature"] += 1
        except Exception as e:  # noqa: BLE001
            errors.append(f"文献 {lit_data.get('id')}: {e}")

    # 随笔
    for essay_data in data.get("essays", []):
        try:
            existing_id = essay_data.get("id")
            if merge and existing_id:
                existing = await session.get(Essay, existing_id)
                if existing:
                    skipped += 1
                    continue
            essay = Essay(
                id=existing_id,
                title=essay_data.get("title", ""),
                content=essay_data.get("content", ""),
                tag=essay_data.get("tag", "灵感"),
                word_count=essay_data.get("wordCount", 0),
            )
            session.add(essay)
            imported["essays"] += 1
        except Exception as e:  # noqa: BLE001
            errors.append(f"随笔 {essay_data.get('id')}: {e}")

    await session.commit()

    logger.info(
        "data_imported",
        literature=imported["literature"],
        essays=imported["essays"],
        skipped=skipped,
        errors=len(errors),
    )
    return {"imported": imported, "skipped": skipped, "errors": errors}


async def import_from_nrz(session: AsyncSession, nrz_bytes: bytes, *, merge: bool = True) -> dict:
    """从 .nrz（ZIP）导入。"""
    buf = io.BytesIO(nrz_bytes)
    with zipfile.ZipFile(buf, "r") as zf:
        # 读取 data.json
        if "data.json" in zf.namelist():
            data = json.loads(zf.read("data.json"))
            result = await import_from_json(session, data, merge=merge)

            # 解压 PDF
            for name in zf.namelist():
                if name.startswith("pdfs/") and name.endswith(".pdf"):
                    target = settings.data_dir / name
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(zf.read(name))

            return result
    return {"imported": {"literature": 0, "essays": 0, "papers": 0, "settings": False}, "skipped": 0, "errors": ["无效的 .nrz 文件"]}


def _lit_to_dict(l: Literature) -> dict:
    import json as _json

    return {
        "id": l.id,
        "title": l.title,
        "authors": l.authors,
        "journal": l.journal,
        "year": l.year,
        "doi": l.doi,
        "abstract": l.abstract,
        "aiSummary": l.ai_summary,
        "tags": _json.loads(l.tags) if l.tags else [],
        "isFavorite": l.is_favorite,
        "readStatus": l.read_status,
        "pdfUrl": l.pdf_path,
    }
