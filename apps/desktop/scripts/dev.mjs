/**
 * 开发模式启动脚本。
 *
 * 流程：
 * 1. 编译 main/preload TS → JS（esbuild，watch 模式）
 * 2. 启动 Electron，加载 Vite dev server（需手动先启动 pnpm dev:web）
 * 3. sidecar 默认跳过（手动启动 uvicorn），可通过 NEXUS_SKIP_SIDECAR=0 开启
 *
 * 开发期推荐：
 *   终端1: pnpm dev          （前端 Vite :5173）
 *   终端2: pnpm dev:server   （后端 uvicorn :8000）
 *   终端3: pnpm --filter @nexus/desktop dev  （Electron 壳）
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const desktopDir = resolve(__dirname, '..');
const repoRoot = resolve(desktopDir, '..', '..');

async function main() {
  const devServerUrl = process.env.NEXUS_DEV_SERVER_URL ?? 'http://localhost:5173';
  const skipSidecar = process.env.NEXUS_SKIP_SIDECAR ?? '1';

  console.info('[dev] dev server:', devServerUrl);
  console.info(
    '[dev] sidecar:',
    skipSidecar === '1'
      ? '跳过（请手动启动：pnpm dev:server）'
      : '由 Electron 启动',
  );

  // 1. 先编译一次 main/preload（非 watch，确保启动时产物存在）
  console.info('[dev] compiling main/preload...');
  spawn('node', ['scripts/compile.mjs'], { cwd: desktopDir, stdio: 'inherit' }).on(
    'exit',
    (code) => {
      if (code !== 0) {
        console.error('[dev] ✗ 编译失败');
        process.exit(code ?? 1);
      }
      launchElectron();
    },
  );
}

function launchElectron() {
  const env = {
    ...process.env,
    NEXUS_DEV_SERVER_URL: process.env.NEXUS_DEV_SERVER_URL ?? 'http://localhost:5173',
    NEXUS_SKIP_SIDECAR: process.env.NEXUS_SKIP_SIDECAR ?? '1',
  };

  // Windows 下 electron 在 node_modules/.bin/electron.cmd
  const isWin = process.platform === 'win32';
  const electronBin = resolve(
    repoRoot,
    'node_modules',
    '.bin',
    isWin ? 'electron.cmd' : 'electron',
  );

  const proc = spawn(electronBin, ['.'], {
    cwd: desktopDir,
    env,
    stdio: 'inherit',
    shell: isWin,
  });

  proc.on('exit', (code) => process.exit(code ?? 0));
}

main();
