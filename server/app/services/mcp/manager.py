"""MCP（Model Context Protocol）客户端管理器。

管理 MCP 服务器连接配置，支持工具发现。
Phase 4 实现配置管理与连接测试；实际工具调用需 mcp SDK（按需安装）。
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.core.errors import NotFoundError, ValidationError
from app.core.logging import get_logger

logger = get_logger(__name__)

# MCP 配置存储路径
MCP_CONFIG_PATH = "mcp_servers.json"


@dataclass
class McpServerConfig:
    """单个 MCP 服务器配置。"""

    id: str
    name: str
    command: str = ""  # stdio 模式的启动命令
    args: list[str] = field(default_factory=list)
    url: str = ""  # SSE/HTTP 模式的 URL
    transport: str = "stdio"  # stdio | sse | http
    enabled: bool = True
    env: dict[str, str] = field(default_factory=dict)
    # 运行期状态
    status: str = "disconnected"  # connected | disconnected | error
    tools: list[dict] = field(default_factory=list)

    def to_dto(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "command": self.command,
            "args": self.args,
            "url": self.url,
            "transport": self.transport,
            "enabled": self.enabled,
            "status": self.status,
            "tools": self.tools,
        }


class McpManager:
    """MCP 服务器连接管理器。"""

    def __init__(self) -> None:
        self._servers: dict[str, McpServerConfig] = {}
        self._loaded = False

    @property
    def config_path(self) -> Path:
        return settings.data_dir / MCP_CONFIG_PATH

    def load(self) -> None:
        """从配置文件加载。"""
        self._servers.clear()
        if self.config_path.exists():
            try:
                data = json.loads(self.config_path.read_text(encoding="utf-8"))
                for s in data.get("servers", []):
                    cfg = McpServerConfig(**s)
                    self._servers[cfg.id] = cfg
            except Exception as e:  # noqa: BLE001
                logger.warning("mcp_config_load_failed", error=str(e))
        self._loaded = True
        logger.info("mcp_servers_loaded", count=len(self._servers))

    def save(self) -> None:
        """保存到配置文件。"""
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        data = {"servers": [s.__dict__ for s in self._servers.values()]}
        self.config_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    def ensure_loaded(self) -> None:
        if not self._loaded:
            self.load()

    def list_servers(self) -> list[McpServerConfig]:
        self.ensure_loaded()
        return list(self._servers.values())

    def get(self, server_id: str) -> McpServerConfig | None:
        self.ensure_loaded()
        return self._servers.get(server_id)

    def add(self, config: McpServerConfig) -> McpServerConfig:
        """添加 MCP 服务器配置。"""
        self.ensure_loaded()
        if config.id in self._servers:
            raise ValidationError(f"MCP 服务器 {config.id} 已存在")
        self._servers[config.id] = config
        self.save()
        logger.info("mcp_server_added", server_id=config.id)
        return config

    def update(self, server_id: str, fields: dict) -> McpServerConfig:
        self.ensure_loaded()
        srv = self._servers.get(server_id)
        if srv is None:
            raise NotFoundError(f"MCP 服务器 {server_id} 不存在")
        for k, v in fields.items():
            if hasattr(srv, k):
                setattr(srv, k, v)
        self.save()
        return srv

    def remove(self, server_id: str) -> bool:
        self.ensure_loaded()
        if server_id not in self._servers:
            return False
        del self._servers[server_id]
        self.save()
        return True

    async def test_connection(self, server_id: str) -> dict:
        """测试 MCP 服务器连接。

        Phase 4：对 stdio 模式检测命令是否可执行；对 http/sse 检测 URL 可达。
        实际工具发现需 mcp SDK。
        """
        import shutil

        self.ensure_loaded()
        srv = self._servers.get(server_id)
        if srv is None:
            raise NotFoundError(f"MCP 服务器 {server_id} 不存在")

        if srv.transport == "stdio":
            if not srv.command:
                return {"success": False, "error": "未配置 command"}
            exe = shutil.which(srv.command)
            if exe:
                srv.status = "connected"
                self.save()
                return {"success": True, "error": None}
            return {"success": False, "error": f"命令 {srv.command} 不在 PATH 中"}

        if srv.transport in ("sse", "http"):
            if not srv.url:
                return {"success": False, "error": "未配置 URL"}
            import httpx

            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    resp = await client.get(srv.url)
                if resp.status_code < 500:
                    srv.status = "connected"
                    self.save()
                    return {"success": True, "error": None}
                return {"success": False, "error": f"HTTP {resp.status_code}"}
            except Exception as e:
                srv.status = "error"
                self.save()
                return {"success": False, "error": str(e)}

        return {"success": False, "error": f"不支持的 transport: {srv.transport}"}


# 全局单例
mcp_manager = McpManager()
