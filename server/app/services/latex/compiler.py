"""LaTeX 编译服务。

检测系统 pdflatex，编译项目目录，解析日志。
若无 TeX 发行版，返回明确的错误提示（Phase 5 可集成 TinyTeX）。
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class CompileLogEntry:
    level: str  # info | warn | error | success
    message: str
    timestamp: str = ""

    def to_dto(self) -> dict:
        return {"level": self.level, "message": self.message, "timestamp": self.timestamp}


@dataclass
class CompileResult:
    status: str  # idle | compiling | success | error
    pages: int = 0
    file_size: str = ""
    log_entries: list[CompileLogEntry] = field(default_factory=list)
    error_count: int = 0
    warning_count: int = 0
    pdf_path: str | None = None

    def to_dto(self) -> dict:
        return {
            "status": self.status,
            "pages": self.pages,
            "fileSize": self.file_size,
            "logEntries": [e.to_dto() for e in self.log_entries],
            "errorCount": self.error_count,
            "warningCount": self.warning_count,
            "pdfPath": self.pdf_path,
        }


def is_latex_available() -> bool:
    """检测系统是否安装 pdflatex。"""
    return shutil.which("pdflatex") is not None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def compile_project(project_dir: Path, main_file: str = "main.tex") -> CompileResult:
    """编译 LaTeX 项目（同步，调用 pdflatex 两次以解析引用）。

    project_dir: 项目根目录（含 main.tex）
    返回 CompileResult。
    """
    result = CompileResult(status="compiling")

    if not is_latex_available():
        result.status = "error"
        result.error_count = 1
        result.log_entries.append(
            CompileLogEntry(
                level="error",
                message=(
                    "未检测到 LaTeX 发行版（pdflatex）。请安装 TeX Live / MiKTeX，"
                    "或等待应用内置 TinyTeX 支持（Phase 5）。"
                ),
                timestamp=_now_iso(),
            )
        )
        return result

    tex_file = project_dir / main_file
    if not tex_file.exists():
        result.status = "error"
        result.error_count = 1
        result.log_entries.append(
            CompileLogEntry(
                level="error",
                message=f"主文件 {main_file} 不存在于 {project_dir}",
                timestamp=_now_iso(),
            )
        )
        return result

    # 编译两次（解析交叉引用）
    env = {**os.environ, "TEXINPUTS": f".:{project_dir}:"}
    for pass_num in range(2):
        try:
            proc = subprocess.run(
                [
                    "pdflatex",
                    "-interaction=nonstopmode",
                    "-halt-on-error",
                    "-file-line-error",
                    main_file,
                ],
                cwd=str(project_dir),
                env=env,
                capture_output=True,
                text=True,
                timeout=120,
            )
        except subprocess.TimeoutExpired:
            result.status = "error"
            result.error_count += 1
            result.log_entries.append(
                CompileLogEntry(level="error", message="编译超时（120s）", timestamp=_now_iso())
            )
            return result
        except Exception as e:
            result.status = "error"
            result.error_count += 1
            result.log_entries.append(
                CompileLogEntry(level="error", message=f"编译进程异常: {e}", timestamp=_now_iso())
            )
            return result

    # 解析 .log 文件
    log_file = project_dir / (Path(main_file).stem + ".log")
    if log_file.exists():
        _parse_log(log_file.read_text(encoding="utf-8", errors="replace"), result)

    # 检查 PDF 产物
    pdf_file = project_dir / (Path(main_file).stem + ".pdf")
    if pdf_file.exists():
        result.status = "success" if result.error_count == 0 else "error"
        result.pdf_path = str(pdf_file)
        result.file_size = _format_size(pdf_file.stat().st_size)
        result.pages = _count_pages(pdf_file)
        if result.error_count == 0:
            result.log_entries.append(
                CompileLogEntry(
                    level="success",
                    message=f"编译成功！{result.pages} 页，{result.file_size}",
                    timestamp=_now_iso(),
                )
            )
    else:
        result.status = "error"
        result.error_count = max(result.error_count, 1)
        result.log_entries.append(
            CompileLogEntry(level="error", message="未生成 PDF 产物", timestamp=_now_iso())
        )

    logger.info(
        "latex_compiled",
        status=result.status,
        pages=result.pages,
        errors=result.error_count,
        warnings=result.warning_count,
    )
    return result


def _parse_log(log_text: str, result: CompileResult) -> None:
    """解析 pdflatex .log 文件，提取错误/警告/页数。"""
    for line in log_text.splitlines():
        line = line.strip()
        # 错误：file:line: Error 或 ! ...
        if re.match(r"^! ", line) or "Error" in line:
            result.error_count += 1
            result.log_entries.append(CompileLogEntry("error", line[:300], _now_iso()))
        elif line.startswith("LaTeX Warning") or line.startswith("Package Warning"):
            result.warning_count += 1
            # 警告只在第一遍记录，避免重复
            if len(result.log_entries) < 50:
                result.log_entries.append(CompileLogEntry("warn", line[:300], _now_iso()))


def _format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    if size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes / (1024 * 1024):.2f} MB"


def _count_pages(pdf_file: Path) -> int:
    """粗略计数 PDF 页数（查找 /Type /Page）。"""
    try:
        content = pdf_file.read_bytes()
        return content.count(b"/Type /Page") - content.count(b"/Type /Pages")
    except Exception:
        return 0
