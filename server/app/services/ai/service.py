"""AI 对话业务服务。

编排：上下文加载 → 模型解析 → 流式调用。
路由层调用本模块提供 SSE 流。
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories import literature_repo  # noqa: F401 — 触发模块可用
from app.models._generated.models import AiChatRequest
from app.services.ai import context as ctx_loader
from app.services.ai.gateway import (
    build_chat_model,
    resolve_model,
    stream_chat,
    to_lc_messages,
)


def _module_from_context(req: AiChatRequest) -> str:
    """从 AiContext 推断业务模块（用于模型路由）。"""
    ctx_type = getattr(req.context, "type", "literature")
    # reader 也归到 literature 模块（共用模型分配）
    return "literature" if ctx_type in ("literature", "reader") else ctx_type


async def chat_stream(
    session: AsyncSession, req: AiChatRequest
) -> AsyncIterator[dict]:
    """流式 AI 对话，yield SSE 事件 dict。

    事件类型：
      {"type": "chunk", "content": "..."}
      {"type": "done", "modelUsed": "...", "tokensUsed": N}
    """
    # 1. 加载上下文
    context_text = await ctx_loader.load_context(session, req.context)
    system_prompt = ctx_loader.build_system_prompt(context_text)

    # 2. 解析模型（按模块路由或显式 override）
    module = _module_from_context(req)
    resolved = await resolve_model(session, module=module, override_model_id=req.modelId)

    # 3. 构造 LangChain 消息
    messages_raw = [m.model_dump() if hasattr(m, "model_dump") else m for m in req.messages]
    lc_messages = to_lc_messages(messages_raw, system_prompt=system_prompt)

    # 4. 构造模型并流式调用
    model = build_chat_model(resolved)
    model_label = f"{resolved.provider_id}:{resolved.model_name}"

    final_tokens = 0
    async for text, tokens in stream_chat(model, lc_messages):
        final_tokens = tokens
        yield {"type": "chunk", "content": text}

    yield {"type": "done", "modelUsed": model_label, "tokensUsed": final_tokens}


async def persist_message(
    session: AsyncSession,
    *,
    context_type: str,
    context_id: str,
    role: str,
    content: str,
    model_used: str,
    tokens_used: int,
) -> None:
    """持久化一条聊天消息到 DB（供历史回放）。"""
    from app.db.tables import ChatMessage

    msg = ChatMessage(
        id=str(uuid.uuid4()),
        context_type=context_type,
        context_id=str(context_id),
        role=role,
        content=content,
        model_used=model_used,
        tokens_used=tokens_used,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    session.add(msg)
    await session.commit()
