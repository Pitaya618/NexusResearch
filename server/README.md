# NexusResearch 后端（server/）

Python FastAPI sidecar —— 作为 Electron 桌面应用的本地后端进程运行。

## 技术栈

- **FastAPI** + **Uvicorn**（ASGI）
- **SQLAlchemy 2.0**（async）+ **aiosqlite** + **Alembic**（迁移）
- **LangChain**（AI 编排，Phase 2+）
- **Pydantic v2**（数据校验，部分由 codegen 从 TS 生成）

## 快速开始

```bash
cd server

# 1. 创建虚拟环境（Python >= 3.10）
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# 2. 安装依赖（首次需引导 pip）
python -m ensurepip --upgrade
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"

# 3. 配置环境变量（可选，开发期有默认值）
copy .env.example .env

# 4. 启动开发服务器
python -m uvicorn app.main:app --reload --port 8000
```

访问 http://localhost:8000/docs 查看 API 文档（仅开发期）。

## 数据库迁移

```bash
# 生成新迁移（修改 ORM 表后）
python -m alembic revision --autogenerate -m "描述变更"

# 应用迁移到最新
python -m alembic upgrade head

# 回滚一版
python -m alembic downgrade -1
```

应用启动时会自动运行 `alembic upgrade head`；若失败则回落到 `create_all`。

## 目录结构

```
server/
├── app/
│   ├── main.py              # FastAPI 入口
│   ├── core/                # 配置、日志、错误处理
│   ├── api/                 # 路由层（对齐前端 DTO）
│   ├── db/                  # ORM 表、会话、仓库
│   ├── models/              # Pydantic 模型（_generated/ 由 codegen 产出）
│   ├── services/            # 业务逻辑（AI 引擎、Skills、LaTeX、MCP）
│   └── utils/               # SSE、加密等工具
├── alembic/                 # 数据库迁移
├── skills/                  # 内置技能清单（YAML）
├── pyproject.toml
└── .env.example
```

## 与前端的类型同步

后端 Pydantic 模型由前端 `packages/shared-types/src/*.ts` 经代码生成产出：

```bash
# 在仓库根目录
pnpm codegen
```

详见 `tools/codegen/`。

## 开发模式说明

开发期前后端分离运行：
- 前端（Vite）：`pnpm dev` → http://localhost:5173
- 后端（Uvicorn）：`python -m uvicorn app.main:app --reload` → http://localhost:8000
- Vite 已配置 `/api` 代理到后端，前端代码无需感知后端地址。

打包态由 Electron main 进程 spawn 本服务作为 sidecar，端口经环境变量注入。
