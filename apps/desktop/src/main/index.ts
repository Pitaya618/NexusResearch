/**
 * Electron 主进程入口。
 *
 * 启动顺序：
 * 1. app.whenReady
 * 2. 启动 Python sidecar（端口协商 + 健康检查）
 * 3. 创建 BrowserWindow，加载前端
 * 4. 把 sidecar baseUrl 通过 preload 注入 window.__NEXUS__
 *
 * 退出时优雅终止 sidecar。
 */
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { app, BrowserWindow, ipcMain } from 'electron';
import { startSidecar, type SidecarHandle } from './sidecar';

// 开发期由 scripts/dev.mjs 通过环境变量传入前端地址与 sidecar 模式
const DEV_SERVER_URL = process.env.NEXUS_DEV_SERVER_URL;
const SKIP_SIDECAR = process.env.NEXUS_SKIP_SIDECAR === '1';

let sidecar: SidecarHandle | null = null;

// IPC 处理器（供 preload 同步查询）
ipcMain.on('nexus:get-api-base-url', (event) => {
  event.returnValue = getSidecarBaseUrl();
});
ipcMain.on('nexus:get-version', (event) => {
  event.returnValue = app.getVersion();
});

async function bootstrap(): Promise<void> {
  // 1. 启动 sidecar（开发期可跳过，前端经 Vite proxy 直连手动启动的 uvicorn）
  if (!SKIP_SIDECAR) {
    sidecar = await startSidecar();
  } else {
    console.info('[main] sidecar 已跳过（NEXUS_SKIP_SIDECAR=1），前端将直连 8000');
  }

  // 2. 创建窗口
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: '#0f1115',
    title: 'NexusResearch',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  // 3. 加载前端
  if (DEV_SERVER_URL) {
    await win.loadURL(DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // 打包：加载 web 应用的构建产物（resources/web/index.html）
    await win.loadFile(path.join(process.resourcesPath, 'web', 'index.html'));
  }
}

/** 读取 sidecar 端口（供 preload 调用）。 */
export function getSidecarBaseUrl(): string {
  if (sidecar) return sidecar.baseUrl;
  // sidecar 跳过时，前端走 vite proxy 或默认端口
  const portFile = path.join(app.getPath('userData'), 'sidecar.port');
  try {
    const port = readFileSync(portFile, 'utf-8').trim();
    return `http://127.0.0.1:${port}`;
  } catch {
    return '';
  }
}

// 生命周期
app.whenReady().then(bootstrap).catch((err) => {
  console.error('[main] 启动失败：', err);
  // TODO: 显示错误对话框
  app.quit();
});

app.on('window-all-closed', () => {
  sidecar?.stop();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  sidecar?.stop();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    bootstrap().catch(console.error);
  }
});
