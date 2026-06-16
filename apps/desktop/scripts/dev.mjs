/**
 * 开发模式启动脚本。
 *
 * 流程：
 * 1. 编译 main/preload TS → JS（esbuild，watch 模式）
 * 2. 启动 Vite dev server（@nexus/web）
 * 3. 启动 Electron，加载 Vite URL，sidecar 可选跳过（前端经 proxy 直连 uvicorn）
 *
 * 开发期推荐：手动 `cd server && uvicorn ... --port 8000`，然后
 * `NEXUS_SKIP_SIDECAR=1 pnpm dev`（避免每次重启都 spawn Python）。
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const desktopDir = resolve(__dirname, '..');
const repoRoot = resolve(desktopDir, '..', '..');

async function main() {
  // 启动 Electron，传入开发服务器地址与 sidecar 模式
  const devServerUrl = 'http://localhost:5173';
  const env = {
    ...process.env,
    NEXUS_DEV_SERVER_URL: devServerUrl,
    // 开发期默认跳过 sidecar（手动启动 uvicorn），可通过环境变量覆盖
    NEXUS_SKIP_SIDECAR: process.env.NEXUS_SKIP_SIDECAR ?? '1',
  };

  console.info('[dev] starting electron (dev server:', devServerUrl, ')');
  console.info(
    '[dev] sidecar:',
    env.NEXUS_SKIP_SIDECAR === '1'
      ? '跳过（请手动启动：cd server && .venv\\Scripts\\python.exe -m uvicorn app.main:app --port 8000）'
      : '由 Electron 启动',
  );

  // NOTE: 此脚本假定 main/preload 已由 tsc 或 esbuild 预编译。
  // 完整实现需引入 esbuild watch；此处为占位，Phase 1 联调用 electron 直跑。
  const electronBin = resolve(repoRoot, 'node_modules', '.bin', 'electron');
  const proc = spawn(electronBin, ['.'], {
    cwd: desktopDir,
    env,
    stdio: 'inherit',
    shell: true,
  });

  proc.on('exit', (code) => process.exit(code ?? 0));
}

main();
