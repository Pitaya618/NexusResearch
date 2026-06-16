# NexusResearch

AI 科研助手 — 智能学术研究管理平台

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.137-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron)](https://www.electronjs.org/)

## ✨ 功能特性

- 📚 **文献管理** — 高效组织和管理学术文献资料
- 📖 **PDF 阅读与标注** — 内置 PDF 阅读器，支持高亮、笔记等标注功能
- 🤖 **AI 对话** — 多 Provider 模型聚合，按模块路由不同 LLM（流式响应）
- ✍️ **AI 辅助写作** — 智能论文写作辅助与编辑建议
- 📝 **LaTeX 编辑器** — 专业的学术论文排版编辑
- 🧩 **Skills 系统** — 声明式技能，可自由安装与热插拔
- 🎨 **现代化 UI** — 基于 oklch 色彩空间的精美界面设计
- 🌐 **中文界面** — 完整的中文本地化支持

## 🏗️ 架构

Monorepo（pnpm workspaces），桌面应用形态：Electron 壳 + Python sidecar。

```
┌─────────── Electron 桌面应用 ───────────┐
│  Renderer (React @nexus/web)            │
│        │ HTTP + SSE (localhost:{port})   │
│        ▼                                 │
│  Python FastAPI Sidecar (@nexus/server) │
│   ├─ 模型聚合网关 (LangChain, 多Provider) │
│   ├─ Skills 引擎 (YAML 声明式)           │
│   ├─ SQLite + 文件系统                   │
│   └─ LaTeX 编译 / MCP 客户端             │
└──────────────────────────────────────────┘
```

**类型单一真相源**：`packages/shared-types`（TS）→ 经 codegen 同步为后端 Pydantic 模型。

## 🛠️ 技术栈

| 层 | 技术 |
|----|------|
| **桌面壳** | Electron 33 |
| **前端** | React 18 + TypeScript + Vite 8 + Zustand + FSD |
| **后端** | Python 3.12 + FastAPI + Uvicorn |
| **AI 编排** | LangChain (Python) |
| **数据库** | SQLite + SQLAlchemy 2.0 + Alembic |
| **通信** | HTTP REST + SSE（流式 AI） |
| **Skills** | YAML 声明式清单 + Jinja2 Prompt |
| **DTO 同步** | ts-json-schema-generator + datamodel-code-generator |
| **仓库** | pnpm workspaces monorepo |

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0 + pnpm >= 9.0.0
- Python >= 3.10

### 安装

```bash
# 前端与桌面壳依赖
pnpm install

# 后端依赖（首次需引导 pip）
cd server
python -m venv .venv
.venv\Scripts\activate          # Windows；macOS/Linux: source .venv/bin/activate
python -m ensurepip --upgrade
python -m pip install -e ".[dev]"
cd ..

# 类型同步（TS → Pydantic）
pnpm codegen
```

### 开发模式（前后端联调）

```bash
# 终端 1：后端
cd server && .venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# 终端 2：前端（/api 经 Vite proxy 转发到 8000）
pnpm dev
```

访问 http://localhost:5173。后端 API 文档：http://localhost:8000/docs。

## 📁 项目结构

```
NexusResearch/
├── apps/
│   ├── web/                    # 前端（React + FSD）
│   │   └── src/shared/lib/api/ # API client（fetch + SSE）
│   └── desktop/                # Electron 桌面壳
│       └── src/main/sidecar.ts # Python 进程生命周期管理
├── server/                     # Python FastAPI 后端
│   ├── app/
│   │   ├── api/                # 路由层（对齐前端 DTO）
│   │   ├── core/               # 配置、日志、错误处理
│   │   ├── db/                 # ORM 表、会话、迁移
│   │   ├── models/_generated/  # codegen 产出的 Pydantic 模型
│   │   └── services/           # AI 引擎、Skills、LaTeX、MCP
│   ├── alembic/                # 数据库迁移
│   └── skills/                 # 内置技能清单（YAML）
├── packages/
│   └── shared-types/           # ★ 类型单一真相源（TS）
└── tools/
    └── codegen/                # TS → JSON Schema → Pydantic
```

详见各子目录 README。

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。
