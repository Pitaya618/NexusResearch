@echo off
REM 打包 Python 后端为 nexus-server（PyInstaller onedir 模式）。
REM
REM 用法：cd server && scripts\build-python.bat
REM 产物：dist\nexus-server\nexus-server.exe + 依赖目录

setlocal

cd /d "%~dp0\.."

echo === PyInstaller: nexus-server ===

REM 确保 PyInstaller 已安装
.venv\Scripts\python.exe -m PyInstaller --version >nul 2>&1
if errorlevel 1 (
    echo [build-python] 安装 PyInstaller...
    .venv\Scripts\pip install pyinstaller
)

REM 打包
.venv\Scripts\python.exe -m PyInstaller nexus-server.spec --noconfirm --clean

if errorlevel 1 (
    echo [build-python] ✗ 打包失败
    exit /b 1
)

echo.
echo [build-python] ✓ 产物：dist\nexus-server\nexus-server.exe
echo [build-python] 下一步：cd ..\apps\desktop ^&^& pnpm package

endlocal
