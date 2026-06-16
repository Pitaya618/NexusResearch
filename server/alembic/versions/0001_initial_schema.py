"""initial schema: literature, essay, provider, chat, skills

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-16

Phase 1 核心表。后续表（paper_project, skill, annotation 等）在对应 Phase 追加。
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- literature ---
    op.create_table(
        "literature",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("authors", sa.Text(), nullable=False, server_default=""),
        sa.Column("journal", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("doi", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("abstract", sa.Text(), nullable=False, server_default=""),
        sa.Column("ai_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("tags", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("is_favorite", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("read_status", sa.String(length=20), nullable=False, server_default="unread"),
        sa.Column("pdf_path", sa.Text(), nullable=True),
        sa.Column("file_path", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_literature_read_status", "literature", ["read_status"])
    op.create_index("ix_literature_is_favorite", "literature", ["is_favorite"])

    # --- essay ---
    op.create_table(
        "essay",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("title", sa.Text(), nullable=False, server_default=""),
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
        sa.Column("tag", sa.String(length=50), nullable=False, server_default="灵感"),
        sa.Column("word_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- ai_edit_suggestion ---
    op.create_table(
        "ai_edit_suggestion",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("essay_id", sa.String(length=64), nullable=False),
        sa.Column("segments", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("accepted", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.Text(), nullable=False, server_default=""),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_edit_suggestion_essay_id", "ai_edit_suggestion", ["essay_id"])

    # --- provider ---
    op.create_table(
        "provider",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False, server_default=""),
        sa.Column("icon", sa.String(length=32), nullable=False, server_default=""),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("base_url", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("api_key_encrypted", sa.Text(), nullable=False, server_default=""),
        sa.Column(
            "compatibility_type", sa.String(length=20), nullable=False, server_default="openai"
        ),
        sa.Column(
            "connection_status",
            sa.String(length=30),
            nullable=False,
            server_default="not-configured",
        ),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- module_model_assignment ---
    op.create_table(
        "module_model_assignment",
        sa.Column("module", sa.String(length=30), nullable=False),
        sa.Column("model_id", sa.String(length=200), nullable=False, server_default=""),
        sa.Column("purpose", sa.String(length=200), nullable=False, server_default=""),
        sa.PrimaryKeyConstraint("module"),
    )

    # --- chat_message ---
    op.create_table(
        "chat_message",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("context_type", sa.String(length=20), nullable=False),
        sa.Column("context_id", sa.String(length=64), nullable=False),
        sa.Column("context_page", sa.Integer(), nullable=True),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
        sa.Column("model_used", sa.String(length=200), nullable=False, server_default=""),
        sa.Column("tokens_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.String(length=40), nullable=False, server_default=""),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_chat_message_context_type", "chat_message", ["context_type"])
    op.create_index("ix_chat_message_context_id", "chat_message", ["context_id"])


def downgrade() -> None:
    op.drop_index("ix_chat_message_context_id", table_name="chat_message")
    op.drop_index("ix_chat_message_context_type", table_name="chat_message")
    op.drop_table("chat_message")
    op.drop_table("module_model_assignment")
    op.drop_table("provider")
    op.drop_index("ix_ai_edit_suggestion_essay_id", table_name="ai_edit_suggestion")
    op.drop_table("ai_edit_suggestion")
    op.drop_table("essay")
    op.drop_index("ix_literature_is_favorite", table_name="literature")
    op.drop_index("ix_literature_read_status", table_name="literature")
    op.drop_table("literature")
