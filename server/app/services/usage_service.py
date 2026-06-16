"""用量统计服务。

聚合 chat_message 表的 token / 模型 / 时间维度数据。
对齐前端 SettingsPage 用量统计区的数据需求。
"""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.tables import ChatMessage


async def get_overview(session: AsyncSession) -> dict:
    """总览：总 token / 请求次数 / 模型数。"""
    total_tokens = (
        await session.execute(select(func.sum(ChatMessage.tokens_used)))
    ).scalar_one() or 0

    total_requests = (
        await session.execute(
            select(func.count(ChatMessage.id)).where(ChatMessage.role == "assistant")
        )
    ).scalar_one()

    model_count = (
        await session.execute(
            select(func.count(func.distinct(ChatMessage.model_used))).where(
                ChatMessage.model_used != ""
            )
        )
    ).scalar_one()

    # 粗估费用（按模型，Phase 后期可配置单价）
    cost = _estimate_cost_simple(total_tokens)

    return {
        "totalTokens": total_tokens,
        "totalRequests": total_requests,
        "totalCost": round(cost, 4),
        "modelCount": model_count,
    }


async def get_by_model(session: AsyncSession) -> list[dict]:
    """按模型聚合用量。"""
    rows = (
        await session.execute(
            select(
                ChatMessage.model_used,
                func.sum(ChatMessage.tokens_used).label("tokens"),
                func.count(ChatMessage.id).label("requests"),
            )
            .where(ChatMessage.role == "assistant")
            .group_by(ChatMessage.model_used)
            .order_by(func.sum(ChatMessage.tokens_used).desc())
        )
    ).all()

    return [
        {
            "name": row.model_used or "unknown",
            "tokens": row.tokens or 0,
            "requests": row.requests,
            "cost": round(_estimate_cost_simple(row.tokens or 0), 4),
        }
        for row in rows
        if row.model_used
    ]


async def get_trend(session: AsyncSession, *, days: int = 7) -> list[dict]:
    """按天聚合 token 趋势（最近 N 天）。

    注意：SQLite 的日期处理较粗糙，这里用 Python 聚合以保证跨平台一致性。
    """
    since = datetime.now(timezone.utc) - timedelta(days=days)

    rows = (
        await session.execute(
            select(
                ChatMessage.created_at,
                ChatMessage.tokens_used,
                ChatMessage.model_used,
            ).where(ChatMessage.role == "assistant")
        )
    ).all()

    # 按日期 + 模型聚合
    by_date: dict[str, dict] = defaultdict(lambda: {"total": 0, "cost": 0.0, "models": defaultdict(int)})

    for row in rows:
        if not row.created_at:
            continue
        # created_at 可能是字符串或 datetime
        dt = row.created_at if isinstance(row.created_at, datetime) else _parse_dt(row.created_at)
        if dt is None or dt < since:
            continue
        date_key = dt.strftime("%m-%d")
        entry = by_date[date_key]
        tokens = row.tokens_used or 0
        entry["total"] += tokens
        entry["cost"] += _estimate_cost_simple(tokens)
        if row.model_used:
            entry["models"][row.model_used] += tokens

    # 填充缺失日期
    result = []
    for i in range(days):
        dt = datetime.now(timezone.utc) - timedelta(days=days - 1 - i)
        key = dt.strftime("%m-%d")
        entry = by_date.get(key, {"total": 0, "cost": 0.0, "models": {}})
        result.append(
            {
                "date": key,
                "total": entry["total"],
                "cost": round(entry["cost"], 4),
                **{k: v for k, v in entry["models"].items()},
            }
        )
    return result


def _estimate_cost_simple(tokens: int) -> float:
    """粗估费用：按 $0.002/1K tokens（GPT-3.5 量级，仅占位）。"""
    return (tokens / 1000) * 0.002


def _parse_dt(s: str) -> datetime | None:
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None
