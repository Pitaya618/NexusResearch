"""数据库引擎与会话工厂。

异步 SQLite (aiosqlite)。session 通过 FastAPI 依赖注入提供给路由层。
"""
from __future__ import annotations

from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# 注：SQLite 启用 WAL 与外键约束（PRAGMA 通过 event listener 设置，见下方）
engine = create_async_engine(
    settings.db_url,
    echo=settings.env == "development",
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def _set_sqlite_pragmas() -> None:
    """启用 SQLite WAL 模式与外键约束（提升并发与数据完整性）。"""

    @engine.sync_engine.event.listens_for(engine.sync_engine, "connect")  # type: ignore[attr-defined]
    def _set_pragma(dbapi_conn, _):  # noqa: ANN001
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


async def init_db() -> None:
    """应用启动时调用：确保目录存在、设置 PRAGMA、建表。

    策略：优先运行 Alembic 迁移；若 alembic 不可用（如首次未安装）则
    回落到 create_all 兜底（仅开发期）。生产打包由安装器预先跑迁移。
    """
    settings.ensure_dirs()
    _set_sqlite_pragmas()

    from app.db.base import Base
    from app.db import tables  # noqa: F401  — 触发表模型注册

    ran_migration = False
    try:
        from alembic import command
        from alembic.config import Config as AlembicConfig

        cfg_path = Path(__file__).resolve().parents[2] / "alembic.ini"
        if cfg_path.exists():
            alembic_cfg = AlembicConfig(str(cfg_path))
            # 同步迁移：用同步 sqlite 引擎（env.py 内部转换）
            command.upgrade(alembic_cfg, "head")
            ran_migration = True
    except Exception as exc:  # noqa: BLE001
        logger.warning("alembic_migration_skipped", error=str(exc))

    if not ran_migration:
        logger.info("fallback_create_all")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    logger.info("database_initialized", path=str(settings.db_path), migrated=ran_migration)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI 依赖：提供一个异步数据库会话，请求结束自动关闭。"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
