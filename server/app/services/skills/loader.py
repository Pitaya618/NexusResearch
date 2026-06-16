"""Skill 清单格式与加载器。

Skill 是声明式 YAML 文件，定义名称、Prompt 模板、适用模块等。
安装 = 复制 YAML 到用户 skills 目录；卸载 = 删除。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import yaml
from jinja2 import Template

from app.core.config import settings
from app.core.errors import ValidationError
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class SkillManifest:
    """解析后的 Skill 清单。"""

    id: str
    name: str
    description: str = ""
    icon: str = "🧩"
    category: list[str] = field(default_factory=list)
    module: list[str] = field(default_factory=list)
    version: str = "1.0.0"
    latest_version: str | None = None
    update_description: str | None = None
    author: str = ""
    prompt_template: str = ""  # Jinja2 模板
    variables: list[str] = field(default_factory=list)  # 模板期望的变量名

    def render_prompt(self, **kwargs) -> str:
        """用 Jinja2 渲染 Prompt 模板。"""
        if not self.prompt_template:
            return ""
        return Template(self.prompt_template, trim_blocks=True).render(**kwargs)

    def to_dto(self, status: str = "available") -> dict:
        """转前端 DTO。"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "category": self.category,
            "module": self.module,
            "status": status,
            "version": self.version,
            "latestVersion": self.latest_version,
            "updateDescription": self.update_description,
        }


def parse_manifest(raw: dict) -> SkillManifest:
    """解析 + 校验 YAML 字典为 SkillManifest。"""
    skill_id = raw.get("id", "").strip()
    name = raw.get("name", "").strip()
    if not skill_id or not name:
        raise ValidationError("Skill 清单缺少 id 或 name")

    prompt = raw.get("prompt", "")
    # 收集模板变量（Jinja2 {{ var }}）
    variables = []
    if prompt:
        import re

        variables = list(set(re.findall(r"\{\{\s*(\w+)\s*\}\}", prompt)))

    return SkillManifest(
        id=skill_id,
        name=name,
        description=raw.get("description", ""),
        icon=raw.get("icon", "🧩"),
        category=raw.get("category", []),
        module=raw.get("module", []),
        version=str(raw.get("version", "1.0.0")),
        latest_version=str(raw["latestVersion"]) if raw.get("latestVersion") else None,
        update_description=raw.get("updateDescription"),
        author=raw.get("author", ""),
        prompt_template=prompt,
        variables=variables,
    )


def load_skill_file(path: Path) -> SkillManifest:
    """从 YAML 文件加载单个 Skill。"""
    try:
        raw = yaml.safe_load(path.read_text(encoding="utf-8"))
        if not isinstance(raw, dict):
            raise ValidationError(f"Skill 文件 {path.name} 不是有效的 YAML 映射")
        return parse_manifest(raw)
    except yaml.YAMLError as e:
        raise ValidationError(f"Skill 文件 {path.name} 解析失败: {e}") from e
