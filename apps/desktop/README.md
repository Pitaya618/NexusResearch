# NexusResearch 桌面壳（apps/desktop）

Electron 主进程，负责窗口管理与 Python sidecar 生命周期。

## 架构

```
Electron 主进程 (Node)
├── main/index.ts       窗口创建 + sidecar 编排 + IPC
├── main/sidecar.ts     Python 进程：端口协商 / 健康检查 / 退出清理
└── preload/index.ts    contextBridge 注入 window.__NEXUS__
        │
        ▼
Renderer (React @nexus/web)
└── 通过 window.__NEXUS__.apiBaseUrl 解析后端地址
        │
        ▼
Python FastAPI sidecar (localhost:{port})
```

## 开发模式

推荐：前后端独立运行，Electron 仅做窗口（跳过 sidecar）：

```bash
# 终端 1：启动 Python 后端
cd server && .venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# 终端 2：启动前端 Vite
pnpm dev   # http://localhost:5173，/api 经 proxy → 8000

# 终端 3（可选）：用 Electron 包装前端
cd apps/desktop
NEXUS_SKIP_SIDECAR=1 pnpm dev
```

> Phase 1 阶段，前端直接在浏览器访问 http://localhost:5173 即可联调，
> 无需 Electron。

## 生产模式（打包）

完整流程（Phase 5）：

1. `pnpm --filter @nexus/web build` → `apps/web/dist/`
2. PyInstaller 打包 `server/` → `nexus-server[.exe]`
3. `pnpm --filter @nexus/desktop build` → electron-builder 产出安装包

打包后 Electron 启动时自动 spawn `nexus-server`，端口经健康检查协商，
通过 preload 注入 `window.__NEXUS__.apiBaseUrl`。

## 关键约定

- **端口协商**：sidecar 启动时占用空闲端口，避免固定端口冲突。
- **健康检查**：轮询 `/api/health` 直到就绪再加载前端。
- **优雅退出**：`before-quit` 发送 SIGTERM，3s 后 SIGKILL 兜底。
- **安全**：`contextIsolation: true`，`nodeIntegration: false`，`sandbox: true`。
