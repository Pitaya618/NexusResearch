#!/usr/bin/env bash
# 打包 Python 后端为 nexus-server（PyInstaller onedir 模式）。
#
# 用法：cd server && bash scripts/build-python.sh
# 产物：dist/nexus-server/nexus-server + 依赖目录

set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== PyInstaller: nexus-server ==="

# 确保 PyInstaller 已安装
if ! .venv/bin/python -m PyInstaller --version &>/dev/null; then
    echo "[build-python] 安装 PyInstaller..."
    .venv/bin/pip install pyinstaller
fi

# 打包
.venv/bin/python -m PyInstaller nexus-server.spec --noconfirm --clean

echo ""
echo "[build-python] ✓ 产物：dist/nexus-server/nexus-server"
echo "[build-python] 下一步：cd ../apps/desktop && pnpm package"
