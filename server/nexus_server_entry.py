# -*- coding: utf-8 -*-
"""PyInstaller 入口脚本 —— nexus-server。

打包后由 Electron main 进程 spawn，通过环境变量接收配置：
  NEXUS_HOST（默认 127.0.0.1）
  NEXUS_PORT（由 sidecar.ts 协商的空闲端口）

不依赖命令行参数，简化 spawn 调用。
"""
from __future__ import annotations

import os
import sys


def main() -> None:
    # 确保 PyInstaller 临时目录在 sys.path（--onedir 模式下通常已处理）
    if getattr(sys, "frozen", False):
        base_dir = os.path.dirname(sys.executable)
        if base_dir not in sys.path:
            sys.path.insert(0, base_dir)

    # 配置（由 Electron 注入）
    host = os.environ.get("NEXUS_HOST", "127.0.0.1")
    port = int(os.environ.get("NEXUS_PORT", "8000"))

    # 延迟导入（让 sys.path 调整生效）
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        log_level=os.environ.get("NEXUS_LOG_LEVEL", "warning").strip(),
        access_log=False,
    )


if __name__ == "__main__":
    main()
