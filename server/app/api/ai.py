"""AI 路由 —— 对话（SSE 流式）+ 专用端点（摘要/引用/润色）。

对齐前端 dto.ts 的 AiChatRequest / GenerateSummaryRequest /
GenerateCitationRequest / PaperPolishRequest。
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps import SessionDep
from app.core.errors import NotFoundError
from app.db.session import AsyncSessionLocal
from app.models._generated.models import AiChatRequest
from app.services.ai import service as ai_service
from app.services.literature_service import get_literature
from app.services.skills.executor import execute_skill
from app.services.skills.registry import registry
from app.utils.streaming import sse_stream

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatMessageInput(BaseModel):
    """前端 ChatMessage 输入（宽松校验）。"""

    id: str = ""
    role: str = "user"
    content: str = ""
    timestamp: str = ""


class ChatInput(BaseModel):
    """对话请求输入 —— 对齐 AiChatRequest 但宽松化（context 是联合类型）。"""

    messages: list[ChatMessageInput]
    context: dict
    modelId: str | None = None


@router.post("/chat")
async def chat(req: ChatInput):
    """流式 AI 对话（SSE）。

    由于流的生命周期长于请求，这里用独立的 DB session 做持久化。
    """
    # 构造 AiChatRequest（Pydantic 校验 context 联合类型）
    ai_req = AiChatRequest(
        messages=[m.model_dump() for m in req.messages],
        context=req.context,
        modelId=req.modelId,
    )

    async def event_source():
        full_response = ""
        model_used = ""
        tokens_used = 0

        # 流式调用使用独立 session（避免请求 session 在响应后关闭）
        async with AsyncSessionLocal() as stream_session:
            async for event in ai_service.chat_stream(stream_session, ai_req):
                if event["type"] == "chunk":
                    full_response += event["content"]
                elif event["type"] == "done":
                    model_used = event["modelUsed"]
                    tokens_used = event["tokensUsed"]
                yield event

        # 流结束后持久化（用新 session）
        ctx = ai_req.context
        ctx_type = getattr(ctx, "type", None) or ctx.get("type", "literature")
        ctx_id = _extract_context_id(ctx, ctx_type)

        async with AsyncSessionLocal() as persist_session:
            # 持久化用户最后一条消息 + 助手回复（简化：仅存助手回复）
            await ai_service.persist_message(
                persist_session,
                context_type=ctx_type,
                context_id=ctx_id,
                role="assistant",
                content=full_response,
                model_used=model_used,
                tokens_used=tokens_used,
            )

    return sse_stream(event_source())


def _extract_context_id(ctx, ctx_type: str) -> str:
    """从 AiContext 提取关联实体 ID。"""
    # Pydantic 模型或 dict
    def get(key):
        return getattr(ctx, key, None) if not isinstance(ctx, dict) else ctx.get(key)

    id_map = {
        "literature": "literatureId",
        "reader": "literatureId",
        "essay": "essayId",
        "paper": "projectId",
    }
    field = id_map.get(ctx_type, "literatureId")
    return str(get(field) or "unknown")


# ============ AI 专用端点（基于 Skill 引擎） ============


class SummaryInput(BaseModel):
    literatureId: int
    modelId: str | None = None


@router.post("/summary")
async def generate_summary(session: SessionDep, req: SummaryInput) -> dict:
    """生成文献 AI 摘要（调用 smart-summary skill）。"""
    lit = await get_literature(session, req.literatureId)
    if lit is None:
        raise NotFoundError(f"文献 {req.literatureId} 不存在")

    result = await execute_skill(
        session,
        "smart-summary",
        {
            "title": lit.title,
            "authors": lit.authors,
            "abstract": lit.abstract or "(无原始摘要)",
        },
        module="literature",
        model_id=req.modelId,
    )
    # 持久化摘要到文献记录
    from app.db.repositories import literature_repo

    await literature_repo.update_literature(session, req.literatureId, {"ai_summary": result})
    return {
        "summary": result,
        "modelUsed": "skill:smart-summary",
        "tokensUsed": len(result) // 3,
    }


class CitationInput(BaseModel):
    literatureId: int
    format: str = "apa"  # apa | mla | gbt7714


@router.post("/citation")
async def generate_citation(session: SessionDep, req: CitationInput) -> dict:
    """生成引用（调用 citation-formatter skill）。"""
    lit = await get_literature(session, req.literatureId)
    if lit is None:
        raise NotFoundError(f"文献 {req.literatureId} 不存在")

    result = await execute_skill(
        session,
        "citation-formatter",
        {
            "title": lit.title,
            "authors": lit.authors,
            "journal": lit.journal,
            "year": str(lit.year or ""),
            "doi": lit.doi,
            "format": req.format,
        },
        module="literature",
    )
    return {"text": result, "format": req.format}


class PolishInput(BaseModel):
    selectedText: str
    mode: str = "academic"  # academic | concise | expand | keepOriginal
    modelId: str | None = None


@router.post("/polish")
async def polish_text(session: SessionDep, req: PolishInput) -> dict:
    """论文润色（调用 academic-polish skill）。"""
    result = await execute_skill(
        session,
        "academic-polish",
        {"selected_text": req.selectedText, "mode": req.mode},
        module="paper",
        model_id=req.modelId,
    )
    return {
        "originalText": req.selectedText,
        "polishedText": result,
        "mode": req.mode,
    }
