# NexusResearch 桌面打包指南

将应用打包为 Windows/macOS/Linux 原生安装包。

## 前置条件

- Node.js ≥ 18 + pnpm ≥ 9
- Python ≥ 3.10（用于打包后端）
- 已运行 `pnpm install` 和 `server/.venv` 已配置依赖

## 打包流程

### 1. 打包 Python 后端（PyInstaller）

```bash
cd server

# Windows
scripts\build-python.bat

# macOS / Linux
bash scripts/build-python.sh
```

产物：`server/dist/nexus-server/nexus-server[.exe]` + 依赖目录（onedir 模式，~500MB）

> 耗时 5-10 分钟。产物不入库（`.gitignore` 已排除）。

### 2. 打包桌面应用（electron-builder）

```bash
# 方式 A：一键打包（前端构建 + 编译 + electron-builder）
cd apps/desktop
pnpm package

# 方式 B：分步
pnpm build        # 前端构建 + Electron 编译
pnpm exec electron-builder   # 产出安装包
```

产物：`apps/desktop/release/`
- Windows: `NexusResearch-0.1.0-x64.exe`（NSIS 安装器）
- macOS: `NexusResearch-0.1.0-x64.dmg`
- Linux: `NexusResearch-0.1.0-x64.AppImage`

### 3. 从仓库根一键打包

```bash
pnpm build:python   # 打包 Python 后端
pnpm package        # 打包桌面应用
```

## 应用结构（打包后）

```
NexusResearch.app/
├── Electron 主进程（dist/main/index.js）
├── resources/
│   ├── web/                    # 前端构建产物（index.html + JS/CSS）
│   └── nexus-server/           # Python sidecar（PyInstaller onedir）
│       ├── nexus-server[.exe]
│       ├── _internal/          # Python 运行时 + 依赖
│       └── skills/             # 内置技能 YAML
└── ...
```

## 启动流程（运行期）

1. 用户启动应用 → Electron 主进程
2. sidecar.ts 找空闲端口，spawn `resources/nexus-server/nexus-server`
3. 轮询 `/api/health` 直到就绪（~1-2s）
4. 加载 `resources/web/index.html`，注入 `window.__NEXUS__.apiBaseUrl`
5. 前端通过该地址访问后端 API

## 常见问题

### PyInstaller 打包后运行报 ModuleNotFoundError
确保 `nexus-server.spec` 中 `collect_submodules("app")` 已包含（用于 uvicorn 字符串引用导入）。

### 打包体积过大
LangChain + Python 运行时约 500MB。可选优化：
- `excludes` 中排除未使用的 langchain 子包
- 使用 UPX 压缩（`upx=True`，需安装 UPX）

### macOS 代码签名
发布版需 Apple Developer 证书。开发期 `electron-builder.yml` 中 `identity: null` 跳过签名。

### Windows 智能屏幕警告
未签名的 exe 会触发 SmartScreen。发布版需代码签名证书（EV 证书可消除警告）。

## 开发模式（无需打包）

```bash
# 终端 1：后端
pnpm dev:server

# 终端 2：前端
pnpm dev

# 终端 3（可选）：Electron 壳
pnpm --filter @nexus/desktop dev
```

前端直接浏览器访问 http://localhost:5173，Vite proxy 转发 `/api` 到后端。
