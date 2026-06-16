"""应用配置 —— 基于 pydantic-settings，从环境变量与 .env 读取。

开发期默认值适配 `python -m uvicorn app.main:app --reload --port 8000`。
打包期由 Electron main 进程通过环境变量注入端口、数据目录等。
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _default_data_dir() -> Path:
    """跨平台用户数据目录。

    Windows: %APPDATA%/NexusResearch
    macOS:   ~/Library/Application Support/NexusResearch
    Linux:   ~/.local/share/NexusResearch
    开发期：若 NEXUS_DEV=1，回落到 server/.data 以便隔离。
    """
    if os.getenv("NEXUS_DEV"):
        return Path(__file__).resolve().parents[2] / ".data"

    if sys.platform == "win32":
        base = Path(os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming"))
    elif sys.platform == "darwin":
        base = Path.home() / "Library" / "Application Support"
    else:
        base = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share"))
    return base / "NexusResearch"


class Settings(BaseSettings):
    """全局配置。所有字段均可通过同名环境变量（前缀 NEXUS_）覆盖。"""

    model_config = SettingsConfigDict(
        env_prefix="NEXUS_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ---------- 运行 ----------
    app_name: str = "NexusResearch"
    version: str = "0.1.0"
    env: str = Field(default="development", description="development | production")
    host: str = "127.0.0.1"
    port: int = 8000

    # ---------- 数据 / 文件 ----------
    data_dir: Path = Field(default_factory=_default_data_dir)
    db_filename: str = "nexus.db"

    # ---------- 安全 ----------
    # API Key 加密主密钥。开发期留空则用机器指纹派生；生产期必须显式注入。
    secret_key: str = ""

    # ---------- CORS ----------
    # 开发期允许 Vite (5173) 跨域；打包后同源不需要。
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:4173",
        ]
    )

    @property
    def db_url(self) -> str:
        """异步 SQLite 连接串。"""
        db_path = self.data_dir / self.db_filename
        # 三斜杠=相对，四斜杠=绝对。这里用绝对路径以避免 cwd 依赖。
        return f"sqlite+aiosqlite:///{db_path.as_posix()}"

    @property
    def db_path(self) -> Path:
        return self.data_dir / self.db_filename

    def ensure_dirs(self) -> None:
        """确保运行期所需目录存在。在应用启动时调用。"""
        self.data_dir.mkdir(parents=True, exist_ok=True)
        for sub in ("pdfs", "papers", "skills", "cache"):
            (self.data_dir / sub).mkdir(parents=True, exist_ok=True)


settings = Settings()
