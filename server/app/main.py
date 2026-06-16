"""FastAPI 应用入口。

启动：python -m uvicorn app.main:app --reload --port 8000
打包后由 Electron main 进程 spawn，端口经环境变量注入。
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import literature, system
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import get_logger, setup_logging
from app.db.session import init_db

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """应用生命周期：启动时初始化数据库，关闭时释放引擎。"""
    logger.info("app_starting", app=settings.app_name, version=settings.version)
    await init_db()
    logger.info("app_ready", host=settings.host, port=settings.port)
    yield
    from app.db.session import engine

    await engine.dispose()
    logger.info("app_stopped")


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    lifespan=lifespan,
    # 生产期由 Electron 内嵌，文档可关闭以减少暴露面
    docs_url="/docs" if settings.env == "development" else None,
    redoc_url=None,
)

# CORS（开发期前端 5173 → 后端 8000）
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 统一错误处理
register_exception_handlers(app)

# 路由挂载（统一 /api 前缀，对齐前端 vite proxy 与 DTO 约定）
api_prefix = "/api"
app.include_router(system.router, prefix=api_prefix)
app.include_router(literature.router, prefix=api_prefix)


@app.get("/")
async def root() -> dict[str, str]:
    return {"name": settings.app_name, "version": settings.version, "status": "running"}
