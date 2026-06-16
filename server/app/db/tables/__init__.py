"""ORM 表模型注册。导入本包即触发所有表注册到 Base.metadata。"""
from app.db.tables.chat import ChatMessage
from app.db.tables.essay import AiEditSuggestion, Essay
from app.db.tables.literature import Literature
from app.db.tables.provider import ModuleModelAssignment, Provider

__all__ = [
    "Literature",
    "Essay",
    "AiEditSuggestion",
    "ChatMessage",
    "Provider",
    "ModuleModelAssignment",
]
