"""Skill 执行器。

执行 = 渲染 Prompt 模板 + 经模型网关调用 LLM。
"""
from __future__ import annotations

from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError, ValidationError
from app.services.ai.gateway import build_chat_model, resolve_model, stream_chat, to_lc_messages
from app.services.skills.registry import registry
from langchain_core.messages import HumanMessage


async def execute_skill(
    session: AsyncSession,
    skill_id: str,
    variables: dict[str, str],
    *,
    module: str = "essay",
    model_id: str | None = None,
) -> str:
    """同步执行 Skill，返回完整结果（非流式）。"""
    manifest = registry.get(skill_id)
    if manifest is None:
        raise NotFoundError(f"Skill {skill_id} 不存在")

    # 校验必需变量
    for v in manifest.variables:
        if v not in variables:
            raise ValidationError(f"Skill {skill_id} 缺少变量: {v}")

    prompt = manifest.render_prompt(**variables)
    if not prompt:
        raise ValidationError(f"Skill {skill_id} 的 Prompt 模板为空")

    resolved = await resolve_model(session, module=module, override_model_id=model_id)
    model = build_chat_model(resolved)
    # 非流式调用
    resp = await model.ainvoke([HumanMessage(content=prompt)])
    return resp.content if isinstance(resp.content, str) else str(resp.content)


async def stream_skill(
    session: AsyncSession,
    skill_id: str,
    variables: dict[str, str],
    *,
    module: str = "essay",
    model_id: str | None = None,
) -> AsyncIterator[dict]:
    """流式执行 Skill，yield SSE 事件。"""
    manifest = registry.get(skill_id)
    if manifest is None:
        raise NotFoundError(f"Skill {skill_id} 不存在")

    for v in manifest.variables:
        if v not in variables:
            raise ValidationError(f"Skill {skill_id} 缺少变量: {v}")

    prompt = manifest.render_prompt(**variables)
    if not prompt:
        raise ValidationError(f"Skill {skill_id} 的 Prompt 模板为空")

    resolved = await resolve_model(session, module=module, override_model_id=model_id)
    model = build_chat_model(resolved)
    model_label = f"{resolved.provider_id}:{resolved.model_name}"

    final_tokens = 0
    async for text, tokens in stream_chat(model, [HumanMessage(content=prompt)]):
        final_tokens = tokens
        yield {"type": "chunk", "content": text}
    yield {"type": "done", "modelUsed": model_label, "tokensUsed": final_tokens}
