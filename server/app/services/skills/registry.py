"""Skill 注册表 —— 管理内置与已安装 Skill。

内置 Skill 位于 server/skills/*.yaml（随应用分发）。
已安装 Skill 位于用户数据目录 ~/.nexusresearch/skills/*.yaml。
"""
from __future__ import annotations

from pathlib import Path

from app.core.config import settings
from app.core.logging import get_logger
from app.services.skills.loader import SkillManifest, load_skill_file

logger = get_logger(__name__)

# server/skills 目录（内置）
BUILTIN_DIR = Path(__file__).resolve().parents[3] / "skills"
# 用户安装目录
USER_DIR_PROPERTY = "skills"


class SkillRegistry:
    """Skill 注册表。"""

    def __init__(self) -> None:
        self._builtin: dict[str, SkillManifest] = {}
        self._user_installed: set[str] = set()  # 用户安装的 skill id
        self._loaded = False

    def load_all(self) -> None:
        """扫描内置 + 用户目录，构建注册表。"""
        self._builtin.clear()
        self._user_installed.clear()

        # 内置 Skill
        if BUILTIN_DIR.exists():
            for f in BUILTIN_DIR.glob("*.yaml"):
                try:
                    m = load_skill_file(f)
                    self._builtin[m.id] = m
                except Exception as e:  # noqa: BLE001
                    logger.warning("skill_load_failed", file=str(f), error=str(e))

        # 用户已安装 Skill（记录在 config 或目录存在即视为安装）
        user_dir = settings.data_dir / "skills"
        if user_dir.exists():
            for f in user_dir.glob("*.yaml"):
                try:
                    m = load_skill_file(f)
                    self._builtin[m.id] = m  # 用户安装的覆盖同名内置
                    self._user_installed.add(m.id)
                except Exception as e:  # noqa: BLE001
                    logger.warning("user_skill_load_failed", file=str(f), error=str(e))

        self._loaded = True
        logger.info(
            "skills_loaded",
            builtin=len(self._builtin),
            installed=len(self._user_installed),
        )

    def ensure_loaded(self) -> None:
        if not self._loaded:
            self.load_all()

    def reload(self) -> None:
        """重新扫描（安装/卸载后调用）。"""
        self.load_all()

    def all_skills(self) -> list[SkillManifest]:
        self.ensure_loaded()
        return list(self._builtin.values())

    def get(self, skill_id: str) -> SkillManifest | None:
        self.ensure_loaded()
        return self._builtin.get(skill_id)

    def is_installed(self, skill_id: str) -> bool:
        self.ensure_loaded()
        # 内置 Skill 默认视为已安装；用户目录的也视为已安装
        return skill_id in self._builtin

    def install(self, skill_id: str) -> bool:
        """安装 Skill（复制内置清单到用户目录）。

        当前实现：内置 Skill 本就可用，安装仅做标记。
        未来支持从远程市场下载。
        """
        self.ensure_loaded()
        m = self._builtin.get(skill_id)
        if m is None:
            return False
        user_dir = settings.data_dir / "skills"
        user_dir.mkdir(parents=True, exist_ok=True)
        # 写入用户目录（标记已安装）
        import yaml

        manifest = {
            "id": m.id,
            "name": m.name,
            "description": m.description,
            "icon": m.icon,
            "category": m.category,
            "module": m.module,
            "version": m.version,
            "prompt": m.prompt_template,
            "author": m.author,
        }
        (user_dir / f"{m.id}.yaml").write_text(
            yaml.dump(manifest, allow_unicode=True), encoding="utf-8"
        )
        self._user_installed.add(skill_id)
        logger.info("skill_installed", skill_id=skill_id)
        return True

    def uninstall(self, skill_id: str) -> bool:
        """卸载用户安装的 Skill（删除用户目录文件）。"""
        user_dir = settings.data_dir / "skills"
        target = user_dir / f"{skill_id}.yaml"
        if target.exists():
            target.unlink()
            self._user_installed.discard(skill_id)
            return True
        return False


# 全局单例
registry = SkillRegistry()
