"""结构化日志 —— 基于 structlog。

输出 JSON 格式（生产）或彩色控制台（开发），便于调试与后续聚合。
"""
from __future__ import annotations

import logging
import sys

import structlog

from app.core.config import settings


def setup_logging() -> None:
    """配置 root logger 与 structlog 处理管线。在应用启动时调用一次。"""

    is_dev = settings.env == "development"

    # 标准 logging 兜底（uvicorn / sqlalchemy 的日志经此输出）
    logging.basicConfig(
        level=logging.DEBUG if is_dev else logging.INFO,
        format="%(message)s",
        stream=sys.stdout,
    )

    # 共享的处理器链
    shared_processors: list = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.processors.format_exc_info,
            # 开发：彩色控制台；生产：JSON
            structlog.dev.ConsoleRenderer(colors=is_dev)
            if is_dev
            else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.DEBUG if is_dev else logging.INFO
        ),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """获取一个绑定 logger。"""
    return structlog.get_logger(name)
