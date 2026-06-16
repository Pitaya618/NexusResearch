"""数据访问层模块导出。"""
from app.db.repositories import essay_repo, literature_repo, provider_repo

__all__ = ["literature_repo", "essay_repo", "provider_repo"]
