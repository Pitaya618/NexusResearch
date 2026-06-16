"""Alembic 环境脚本 —— 同步引擎，从应用 settings 读取连接串。

注意：迁移使用同步 SQLAlchemy 引擎（与运行期异步引擎分离，因为 Alembic
对同步支持更成熟）。两者指向同一 SQLite 文件。
"""
from __future__ import annotations

import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import engine_from_config, pool

from alembic import context

# 确保 server/ 在 sys.path 上（让 alembic 能 import app.*）
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db import tables  # noqa: F401,E402  — 注册表模型到 metadata

config = context.config

# 覆盖 alembic.ini 中的占位连接串，使用同步 sqlite 驱动。
# 运行期用 aiosqlite（异步），迁移用 sqlite（同步）—— 两者指向同一文件。
_sync_db_url = settings.db_url.replace("+aiosqlite", "")
config.set_main_option("sqlalchemy.url", _sync_db_url)

# Alembic 在应用 lifespan 之外运行（CLI 模式），需自行确保数据目录存在
settings.ensure_dirs()

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,  # SQLite 需要 batch 模式做 ALTER
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
