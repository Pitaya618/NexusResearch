"""SSE（Server-Sent Events）响应封装。

用于 AI 对话流式输出。前端通过 fetch + ReadableStream 解析。
事件格式：
    data: {"type":"chunk","content":"你好"}\n\n
    data: {"type":"done","modelUsed":"...","tokensUsed":128}\n\n
"""
from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

from fastapi.responses import StreamingResponse


def sse_event(data: dict[str, Any]) -> str:
    """序列化单个 SSE 事件帧。"""
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def sse_stream(generator: AsyncIterator[dict[str, Any]]) -> StreamingResponse:
    """把异步生成器（产出 dict）包装为 SSE 响应。

    生成器产出的 dict 直接作为事件 data。建议用 {"type": "chunk", "content": ...}
    或 {"type": "done", ...} 等结构。
    """

    async def _iter():
        try:
            async for event in generator:
                yield sse_event(event)
        except Exception as exc:  # noqa: BLE001
            yield sse_event({"type": "error", "message": str(exc)})

    return StreamingResponse(
        _iter(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # 禁用代理缓冲
        },
    )
