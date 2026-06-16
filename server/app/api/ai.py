"""AI 路由 —— 对话（SSE 流式）。

对齐前端 dto.ts 的 AiChatRequest / AiChatResponse。
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps import SessionDep
from app.db.session import AsyncSessionLocal
from app.models._generated.models import AiChatRequest
from app.services.ai import service as ai_service
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
