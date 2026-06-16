"""统一错误处理。

对齐前端 `common.ts` 的 `Result<T, E>` 联合类型：失败时返回
`{ ok: false, error: {...} }`，HTTP 状态码语义化。

使用方式：业务层抛出以下领域异常，全局处理器统一捕获并转换为响应体。
"""
from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    """所有业务错误的基类。子类设置 status_code 与 code。"""

    status_code: int = 400
    code: str = "app_error"

    def __init__(self, message: str, *, details: dict[str, Any] | None = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ValidationError(AppError):
    status_code = 422
    code = "validation_error"


class ConflictError(AppError):
    status_code = 409
    code = "conflict"


class AIProviderError(AppError):
    """AI 提供商调用失败（鉴权、限流、网络等）。"""

    status_code = 502
    code = "ai_provider_error"


def _error_body(err: AppError) -> dict[str, Any]:
    """构造对齐前端 Result.error 的响应体。"""
    return {
        "ok": False,
        "error": {
            "code": err.code,
            "message": err.message,
            **({"details": err.details} if err.details else {}),
        },
    }


def register_exception_handlers(app: FastAPI) -> None:
    """注册全局异常处理器。"""

    @app.exception_handler(AppError)
    async def _handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=_error_body(exc))
