"""模型聚合网关。

管理多 Provider，按模块路由到不同 LLM。对齐前端 ModuleModelAssignment。
Phase 2 先实现 OpenAI 兼容 Provider（覆盖 OpenAI/DeepSeek/Moonshot/自定义）。
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, AsyncIterator

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, AIMessageChunk, BaseMessage, HumanMessage, SystemMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AIProviderError
from app.core.logging import get_logger
from app.db.repositories import provider_repo
from app.utils.crypto import decrypt

logger = get_logger(__name__)


@dataclass
class ResolvedModel:
    """解析后的模型调用信息。"""

    provider_id: str
    model_name: str
    api_key: str
    base_url: str
    compatibility: str  # openai | anthropic | custom


# 默认模型 ID（provider_id:model_name 格式）
_DEFAULT_MODEL = "openai:gpt-4o-mini"


async def resolve_model(
    session: AsyncSession,
    module: str = "literature",
    override_model_id: str | None = None,
) -> ResolvedModel:
    """根据模块路由或显式 override 解析出要调用的模型。

    model_id 格式: "{providerId}:{modelName}"，如 "openai:gpt-4o-mini"。
    """
    model_id = override_model_id
    if not model_id:
        # 查模块分配表
        assignment = await provider_repo.get_assignment(session, module)
        model_id = assignment.model_id if assignment and assignment.model_id else _DEFAULT_MODEL

    if ":" not in model_id:
        raise AIProviderError(f"无效的 model_id 格式: {model_id}（应为 providerId:modelName）")

    provider_id, model_name = model_id.split(":", 1)
    provider = await provider_repo.get_provider(session, provider_id)
    if provider is None:
        raise AIProviderError(f"Provider {provider_id} 未配置")

    api_key = decrypt(provider.api_key_encrypted)
    if not api_key:
        raise AIProviderError(f"Provider {provider_id} 的 API Key 未配置或解密失败")

    return ResolvedModel(
        provider_id=provider_id,
        model_name=model_name,
        api_key=api_key,
        base_url=provider.base_url,
        compatibility=provider.compatibility_type,
    )


def build_chat_model(resolved: ResolvedModel) -> BaseChatModel:
    """根据兼容性类型构造 LangChain ChatModel。

    Phase 2: 仅 OpenAI 兼容（覆盖 openai/custom/deepseek/moonshot）。
    Phase 3 将加入 Anthropic。
    """
    if resolved.compatibility == "anthropic":
        try:
            from langchain_anthropic import ChatAnthropic

            return ChatAnthropic(
                model=resolved.model_name,
                api_key=resolved.api_key,
                base_url=resolved.base_url or None,
                streaming=True,
            )
        except ImportError:
            raise AIProviderError("langchain-anthropic 未安装")

    # openai / custom / 默认 —— 均走 OpenAI 兼容接口
    from langchain_openai import ChatOpenAI

    kwargs: dict[str, Any] = {
        "model": resolved.model_name,
        "api_key": resolved.api_key,
        "streaming": True,
    }
    if resolved.base_url:
        kwargs["base_url"] = resolved.base_url

    return ChatOpenAI(**kwargs)


def to_lc_messages(
    messages: list[dict], system_prompt: str | None = None
) -> list[BaseMessage]:
    """前端 ChatMessage[] → LangChain BaseMessage[]。"""
    lc: list[BaseMessage] = []
    if system_prompt:
        lc.append(SystemMessage(content=system_prompt))
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")
        if role == "assistant":
            lc.append(AIMessage(content=content))
        else:
            lc.append(HumanMessage(content=content))
    return lc


async def stream_chat(
    model: BaseChatModel, messages: list[BaseMessage]
) -> AsyncIterator[tuple[str, int]]:
    """流式调用模型，yield (chunk_text, cumulative_tokens)。

    简化的 token 计数：按 chunk 字符数粗估（精确计数需 Phase 3 接入 tokenizer）。
    """
    total_chars = 0
    try:
        async for chunk in model.astream(messages):  # type: AIMessageChunk
            text = chunk.content if isinstance(chunk.content, str) else str(chunk.content)
            if text:
                total_chars += len(text)
                # 粗估 token：4 字符 ≈ 1 token（英文）；中文 1.5 字符 ≈ 1 token，取折中
                approx_tokens = max(1, total_chars // 3)
                yield text, approx_tokens
    except Exception as exc:
        logger.error("ai_stream_failed", error=str(exc))
        raise AIProviderError(f"AI 调用失败：{exc}") from exc
