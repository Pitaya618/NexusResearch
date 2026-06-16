# NexusResearch 打包教程

本教程将 NexusResearch 从源码打包为 **Windows / macOS / Linux 原生安装包**。

> 已在 Windows 11 上验证通过。macOS/Linux 步骤相同，仅脚本后缀不同（`.sh` vs `.bat`）。

---

## 一、前置条件

| 工具 | 版本要求 | 检查命令 |
|------|----------|----------|
| **Node.js** | ≥ 18 | `node --version` |
| **pnpm** | ≥ 9 | `pnpm --version` |
| **Python** | ≥ 3.10 | `python --version` |
| **磁盘空间** | ≥ 2 GB | 打包产物约 600 MB |

首次使用需初始化依赖（约 5 分钟）：

```bash
# 1. 安装前端 + Electron 依赖
pnpm install

# 2. 创建 Python 虚拟环境并安装依赖
cd server
python -m venv .venv
.venv\Scripts\activate                    # Windows
# source .venv/bin/activate               # macOS/Linux
python -m ensurepip --upgrade
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
python -m pip install pyinstaller         # 打包工具
python -m pip install "datamodel-code-generator[http]"  # 类型生成
cd ..

# 3. 生成类型同步（TS → Pydantic）
pnpm codegen
```

> 之后每次打包只需执行第二、三节，无需重复初始化。

---

## 二、打包 Python 后端（PyInstaller）

将 FastAPI 后端打包为独立可执行文件 `nexus-server`，无需目标机器安装 Python。

```bash
cd server

# Windows
scripts\build-python.bat

# macOS / Linux
bash scripts/build-python.sh
```

**耗时**：5–10 分钟（首次更久，因需分析依赖图）。

**产物**：
```
server/dist/nexus-server/
├── nexus-server.exe        ← 主程序（~15 MB）
└── _internal/              ← Python 运行时 + 所有依赖（~500 MB）
    ├── skills/             ← 内置技能 YAML（运行期读取）
    ├── alembic/            ← 数据库迁移脚本
    └── ...
```

**验证产物**（可选）：
```bash
# 直接运行（不依赖 Python 环境）
dist\nexus-server\nexus-server.exe
# 应输出 app_ready，监听端口（默认从 NEXUS_PORT 环境变量读取）
```

> ⚠️ 如果报 `ModuleNotFoundError: No module named 'app'`，确认 `nexus-server.spec` 中包含 `collect_submodules("app")`。

完成后返回仓库根目录：
```bash
cd ..
```

---

## 三、打包桌面应用（electron-builder）

将前端 + Electron 壳 + Python sidecar 打包为系统安装包。

```bash
# 方式 A：从仓库根一键打包（推荐）
pnpm package

# 方式 B：进入 desktop 目录手动打包
cd apps/desktop
pnpm package
```

**这一步会自动完成**：
1. 构建前端（`@nexus/web` → `apps/web/dist/`）
2. 编译 Electron main/preload（TS → JS）
3. 检测 Python sidecar 是否存在（`server/dist/nexus-server/`）
4. 调用 electron-builder 打包

**耗时**：2–3 分钟。

**产物**：`apps/desktop/release/`

| 平台 | 文件 | 格式 |
|------|------|------|
| **Windows** | `NexusResearch-0.1.0-x64.exe` | NSIS 安装器 |
| **macOS** | `NexusResearch-0.1.0-x64.dmg` | 磁盘镜像 |
| **Linux** | `NexusResearch-0.1.0-x64.AppImage` | 免安装镜像 |

> electron-builder 只会为**当前操作系统**生成对应格式的包。跨平台打包需在对应 OS 上运行，或使用 CI（见第六节）。

---

## 四、验证安装包

### Windows

双击 `NexusResearch-0.1.0-x64.exe` → 安装 → 启动。

启动后应用会：
1. 显示窗口（深色背景）
2. 后台启动 Python sidecar（占用空闲端口）
3. 健康检查通过后加载前端（~1-2 秒）
4. 进入主界面

### 验证后端运行

应用启动后，后端监听在 `127.0.0.1:{随机端口}`。可在应用内「设置」页查看，或检查日志。

---

## 五、打包后应用结构

```
安装目录/NexusResearch/
├── NexusResearch.exe              ← Electron 主程序
├── resources/
│   ├── app.asar                   ← Electron 代码（main + preload）
│   └── ...
│   ├── web/                       ← 前端构建产物
│   │   ├── index.html
│   │   └── assets/
│   └── nexus-server/              ← Python sidecar（PyInstaller 产物）
│       ├── nexus-server.exe
│       └── _internal/
└── ...
```

**运行时数据目录**（用户数据，与程序分离）：
- **Windows**: `%APPDATA%\NexusResearch\`（nexus.db、pdfs/、papers/、skills/）
- **macOS**: `~/Library/Application Support/NexusResearch/`
- **Linux**: `~/.local/share/NexusResearch/`

---

## 六、一键打包（完整流程）

从仓库根目录：

```bash
# 完整打包（Python + Desktop）
pnpm build:python    # 第二节：PyInstaller
pnpm package         # 第三节：electron-builder

# 产物在 apps/desktop/release/
```

---

## 七、常见问题

### Q1: PyInstaller 报 `ModuleNotFoundError`

**原因**：某个库通过字符串引用动态导入（如 uvicorn 的 `"app.main:app"`）。

**解决**：在 `server/nexus-server.spec` 的 `hiddenimports` 列表中添加缺失的模块名，或用 `collect_submodules("包名")` 自动收集。

### Q2: electron-builder 找不到 Python sidecar

**现象**：构建时提示 `Python sidecar 未打包`。

**解决**：确保已先运行 `pnpm build:python`，且 `server/dist/nexus-server/nexus-server.exe` 存在。

### Q3: 打包体积太大（~600 MB）

**主要构成**：
- Electron 运行时：~150 MB
- Python + LangChain 依赖：~450 MB
- 前端：~2 MB

**优化选项**：
- 在 `nexus-server.spec` 的 `excludes` 中排除未使用的包
- 启用 UPX 压缩（安装 UPX 后设 `upx=True`）
- 精简 LangChain 依赖（仅保留实际使用的 Provider）

### Q4: Windows SmartScreen 警告

未签名的 exe 会触发 "Windows 已保护你的电脑"。

**解决**：购买代码签名证书（EV 证书可消除警告），在 `electron-builder.yml` 配置 `win.certificateFile`。

### Q5: macOS 无法打开（"无法验证开发者"）

**开发期**：右键 → 打开，或在终端执行 `xattr -cr /Applications/NexusResearch.app`。

**发布版**：需 Apple Developer 证书签名 + 公证（`electron-builder.yml` 配置 `mac.identity`）。

### Q6: 跨平台打包

electron-builder 不支持在 Windows 上打 macOS 包（需 macOS 环境）。方案：

```yaml
# .github/workflows/build.yml（GitHub Actions 示例）
# 用 matrix 在三个平台上分别打包
jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: npm install -g pnpm
      - run: pnpm install
      - run: cd server && python -m venv .venv && .venv/Scripts/python -m pip install -e ".[dev]" pyinstaller  # Windows
      - run: pnpm codegen
      - run: pnpm build:python
      - run: pnpm package
```

---

## 八、开发模式（无需打包）

日常开发用前后端分离模式，改动即时热更新：

```bash
# 终端 1：后端（热重载）
pnpm dev:server
# → http://localhost:8000

# 终端 2：前端（热重载）
pnpm dev
# → http://localhost:5173（/api 经 Vite proxy 转发到 8000）

# 浏览器直接访问 http://localhost:5173 即可，无需 Electron
```

如需在 Electron 窗口中调试：
```bash
# 终端 3（可选）
pnpm --filter @nexus/desktop dev
```

---

## 附：各脚本对照

| 脚本 | 位置 | 作用 |
|------|------|------|
| `pnpm dev:server` | 根 | 启动后端（热重载，开发用） |
| `pnpm dev` | 根 | 启动前端 Vite（开发用） |
| `pnpm build:python` | 根 → `server/scripts/build-python.bat` | PyInstaller 打包后端 |
| `pnpm build:desktop` | 根 → `apps/desktop/scripts/build.mjs` | 构建前端 + 编译 Electron（不打包安装包） |
| `pnpm package` | 根 → `apps/desktop` | 完整桌面打包（含 electron-builder） |
| `pnpm codegen` | 根 → `tools/codegen` | TS 类型同步到 Pydantic |
