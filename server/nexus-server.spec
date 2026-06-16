# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec —— 将 Python 后端打包为 nexus-server。

用法：
  cd server
  .venv\Scripts\pyinstaller nexus-server.spec --noconfirm

产物：dist/nexus-server/（onedir 模式，含 nexus-server.exe + 依赖）

设计：
- onedir 模式（非 onefile）：避免每次启动解压到临时目录的延迟（~2s）
- 入口：nexus_server_entry.py（直接监听端口，无需命令行参数）
- 包含 skills/ 与 alembic/ 目录（运行期读取）
"""
import os
from pathlib import Path
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

SERVER_DIR = Path(SPECPATH).resolve()

# 关键：uvicorn.run("app.main:app") 是字符串引用，PyInstaller 无法静态分析。
# 必须显式收集 app 包的全部子模块。
app_hidden = collect_submodules("app")

# 收集 LangChain 子模块（动态导入）
langchain_hidden = collect_submodules("langchain") + collect_submodules("langchain_core")

a = Analysis(
    [str(SERVER_DIR / "nexus_server_entry.py")],
    pathex=[str(SERVER_DIR)],
    binaries=[],
    datas=[
        # 内置技能清单
        (str(SERVER_DIR / "skills"), "skills"),
        # alembic 迁移脚本
        (str(SERVER_DIR / "alembic"), "alembic"),
        (str(SERVER_DIR / "alembic.ini"), "."),
        # langchain 数据文件（prompt 模板等）
        *collect_data_files("langchain"),
        *collect_data_files("langchain_core"),
    ],
    hiddenimports=[
        "uvicorn.logging",
        "uvicorn.loops",
        "uvicorn.loops.auto",
        "uvicorn.protocols",
        "uvicorn.protocols.http.auto",
        "uvicorn.protocols.websockets.auto",
        "uvicorn.lifespan",
        "uvicorn.lifespan.on",
        "aiosqlite",
        "cryptography",
        "multipart",
        "langchain_openai",
        "langchain_anthropic",
        *app_hidden,
        *langchain_hidden,
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["pytest", "tests"],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="nexus-server",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="nexus-server",
)
