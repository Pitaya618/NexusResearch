"""论文项目与编译路由。

对齐前端 dto.ts 的 PaperCompileRequest / PaperCompileResponse。
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps import SessionDep
from app.core.config import settings
from app.core.errors import NotFoundError
from app.services.latex.compiler import CompileResult, compile_project, is_latex_available

router = APIRouter(prefix="/papers", tags=["paper"])


class CompileInput(BaseModel):
    projectId: str
    template: str = "neurips-2024"
    mainFile: str = "main.tex"


class ProjectCreateInput(BaseModel):
    name: str
    template: str = "neurips-2024"


def _project_dir(project_id: str) -> Path:
    return settings.data_dir / "papers" / project_id


@router.post("/{project_id}/compile")
async def compile(project_id: str, req: CompileInput) -> dict:
    """编译 LaTeX 项目。"""
    proj_dir = _project_dir(project_id)
    if not proj_dir.exists():
        raise NotFoundError(f"论文项目 {project_id} 不存在")

    result: CompileResult = compile_project(proj_dir, main_file=req.mainFile)
    return result.to_dto()


@router.get("/latex/available")
async def latex_available() -> dict:
    """检测系统是否安装 LaTeX。"""
    return {"available": is_latex_available()}


@router.post("", status_code=201)
async def create_project(req: ProjectCreateInput) -> dict:
    """创建论文项目（生成目录 + 模板文件）。"""
    project_id = f"paper-{uuid.uuid4().hex[:8]}"
    proj_dir = _project_dir(project_id)
    proj_dir.mkdir(parents=True, exist_ok=True)

    # 写入最小 main.tex 模板
    (proj_dir / "main.tex").write_text(
        _template_tex(req.template, req.name),
        encoding="utf-8",
    )
    (proj_dir / "references.bib").write_text("", encoding="utf-8")

    return {
        "id": project_id,
        "name": req.name,
        "template": req.template,
        "projectDir": str(proj_dir),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/{project_id}")
async def get_project(project_id: str) -> dict:
    """获取项目信息（含文件树）。"""
    proj_dir = _project_dir(project_id)
    if not proj_dir.exists():
        raise NotFoundError(f"论文项目 {project_id} 不存在")

    file_tree = _build_file_tree(proj_dir)
    return {
        "id": project_id,
        "name": project_id,
        "fileTree": file_tree,
        "projectDir": str(proj_dir),
    }


def _build_file_tree(root: Path) -> list[dict]:
    """构建文件树（递归）。"""
    nodes = []
    for entry in sorted(root.iterdir(), key=lambda p: (not p.is_dir(), p.name)):
        if entry.name.startswith("."):
            continue
        if entry.is_dir():
            nodes.append(
                {"name": entry.name, "type": "folder", "children": _build_file_tree(entry)}
            )
        else:
            ext = entry.suffix.lstrip(".")
            nodes.append({"name": entry.name, "type": ext or "file"})
    return nodes


def _template_tex(template: str, title: str) -> str:
    """生成最小 LaTeX 模板。"""
    return f"""\\documentclass{{article}}
\\title{{{title}}}
\\author{{NexusResearch}}
\\date{{\\today}}

\\begin{{document}}
\\maketitle

\\section{{Introduction}}
Write your content here.

\\end{{document}}
"""
