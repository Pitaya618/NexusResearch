"""MCP 服务器管理路由。"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps import SessionDep
from app.core.errors import NotFoundError, ValidationError
from app.services.mcp.manager import McpServerConfig, mcp_manager

router = APIRouter(prefix="/mcp", tags=["mcp"])


class McpServerInput(BaseModel):
    """MCP 服务器配置输入。"""

    id: str
    name: str
    command: str = ""
    args: list[str] = []
    url: str = ""
    transport: str = "stdio"
    enabled: bool = True
    env: dict[str, str] = {}


@router.get("")
async def list_servers() -> list[dict]:
    mcp_manager.ensure_loaded()
    return [s.to_dto() for s in mcp_manager.list_servers()]


@router.get("/{server_id}")
async def get_server(server_id: str) -> dict:
    s = mcp_manager.get(server_id)
    if s is None:
        raise NotFoundError(f"MCP 服务器 {server_id} 不存在")
    return s.to_dto()


@router.post("", status_code=201)
async def add_server(req: McpServerInput) -> dict:
    cfg = McpServerConfig(
        id=req.id,
        name=req.name,
        command=req.command,
        args=req.args,
        url=req.url,
        transport=req.transport,
        enabled=req.enabled,
        env=req.env,
    )
    return mcp_manager.add(cfg).to_dto()


@router.patch("/{server_id}")
async def update_server(server_id: str, fields: dict) -> dict:
    return mcp_manager.update(server_id, fields).to_dto()


@router.delete("/{server_id}")
async def remove_server(server_id: str) -> dict:
    ok = mcp_manager.remove(server_id)
    if not ok:
        raise NotFoundError(f"MCP 服务器 {server_id} 不存在")
    return {"ok": True, "id": server_id}


@router.post("/{server_id}/test")
async def test_server(server_id: str) -> dict:
    return await mcp_manager.test_connection(server_id)
