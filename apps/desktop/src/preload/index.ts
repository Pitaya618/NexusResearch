/**
 * Preload 脚本 —— 在隔离上下文中向前端暴露安全的最小 API。
 *
 * 通过 contextBridge 暴露 window.__NEXUS__，前端据此解析后端地址。
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('__NEXUS__', {
  /** 获取 sidecar base URL（同步，主进程缓存）。 */
  get apiBaseUrl() {
    return ipcRenderer.sendSync('nexus:get-api-base-url');
  },
  get version() {
    return ipcRenderer.sendSync('nexus:get-version');
  },
});
