"""AiContext 上下文加载器。

对齐前端 AiContext 可辨识联合类型（literature/essay/paper/reader）。
根据上下文类型加载相关领域数据，构造 system prompt 的一部分。
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories import essay_repo, literature_repo
from app.models._generated.models import AiContext


async def load_context(session: AsyncSession, ctx: AiContext) -> str:
    """根据 AiContext 加载相关上下文，返回注入 system prompt 的文本。

    ctx 的字段经 Pydantic 校验，包含 type + 对应 ID（camelCase）。
    """
    ctx_type = getattr(ctx, "type", None)

    if ctx_type == "literature":
        lit_id = getattr(ctx, "literatureId", None)
        if lit_id is None:
            return ""
        item = await literature_repo.get_literature(session, lit_id)
        if item is None:
            return f"（文献 {lit_id} 不存在）"
        return _format_literature(item, include_summary=True)

    if ctx_type == "essay":
        essay_id = getattr(ctx, "essayId", None)
        if essay_id is None:
            return ""
        item = await essay_repo.get_essay(session, essay_id)
        if item is None:
            return f"（随笔 {essay_id} 不存在）"
        return _format_essay(item)

    if ctx_type == "paper":
        project_id = getattr(ctx, "projectId", None)
        active_file = getattr(ctx, "activeFile", None)
        # Phase 2: paper 文件树尚未接入，返回占位
        file_hint = f"（活动文件：{active_file}）" if active_file else ""
        return f"论文项目 {project_id}{file_hint}。\n（论文文件内容加载将在后续 Phase 实现）"

    if ctx_type == "reader":
        lit_id = getattr(ctx, "literatureId", None)
        page = getattr(ctx, "currentPage", None)
        if lit_id is None:
            return ""
        item = await literature_repo.get_literature(session, lit_id)
        if item is None:
            return f"（文献 {lit_id} 不存在）"
        return _format_literature(item, include_summary=False, page=page)

    return ""


def _format_literature(item, *, include_summary: bool = True, page: int | None = None) -> str:
    parts = [
        f"当前文献：{item.title}",
        f"作者：{item.authors}",
    ]
    if item.journal:
        parts.append(f"期刊：{item.journal}（{item.year or ''}）")
    if item.abstract:
        parts.append(f"摘要：{item.abstract}")
    if include_summary and item.ai_summary:
        parts.append(f"AI 摘要：{item.ai_summary}")
    if page is not None:
        parts.append(f"用户正在阅读第 {page} 页")
    return "；\n".join(parts) + "。"


def _format_essay(item) -> str:
    return f"用户当前随笔《{item.title}》全文：\n\n{item.content}"


def build_system_prompt(context_text: str) -> str:
    """组装完整 system prompt。"""
    base = (
        "你是 NexusResearch AI 科研助手，专注于帮助用户进行学术研究、论文阅读与写作。"
        "回答应当专业、准确、简洁，使用中文。"
    )
    if context_text:
        return f"{base}\n\n【当前上下文】\n{context_text}"
    return base
