import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      app: path.resolve(__dirname, 'src/app'),
      pages: path.resolve(__dirname, 'src/pages'),
      widgets: path.resolve(__dirname, 'src/widgets'),
      features: path.resolve(__dirname, 'src/features'),
      entities: path.resolve(__dirname, 'src/entities'),
      shared: path.resolve(__dirname, 'src/shared'),
    },
  },
  server: {
    port: 5173,
    // 开发期：把 /api 请求代理到本地 Python FastAPI sidecar（默认 8000）。
    // 生产期由 Electron main 进程写入真实端口，前端通过 apiBaseUrl 读取。
    proxy: {
      '/api': {
        target: process.env.NEXUS_API_URL ?? 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
