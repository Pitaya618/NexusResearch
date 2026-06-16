/**
 * Python sidecar 进程管理。
 *
 * 职责：
 * - 找一个空闲端口
 * - spawn Python uvicorn 进程（开发：venv python；打包：PyInstaller 单文件）
 * - 轮询 /api/health 直到就绪
 * - 把端口写入 preload 可读的位置（供前端 apiBaseUrl 解析）
 * - 应用退出时优雅终止
 */
import net from 'node:net';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

/** Sidecar 运行期信息。 */
export interface SidecarHandle {
  readonly port: number;
  readonly baseUrl: string;
  readonly process: ChildProcess;
  /** 停止 sidecar。幂等。 */
  stop: () => void;
}

/** 占用一个空闲的本地 TCP 端口。 */
function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      if (addr && typeof addr === 'object') {
        const port = addr.port;
        srv.close(() => resolve(port));
      } else {
        srv.close();
        reject(new Error('无法获取空闲端口'));
      }
    });
  });
}

/** 轮询健康检查端点直到就绪或超时。 */
async function waitForHealthy(baseUrl: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const probe = async (): Promise<boolean> => {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      return res.ok;
    } catch {
      return false;
    }
  };

  while (Date.now() < deadline) {
    if (await probe()) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`sidecar 健康检查超时（${timeoutMs}ms）: ${baseUrl}`);
}

/** Python 可执行文件路径。
 *  - 开发：server/.venv 下的 python
 *  - 打包：resources/nexus-server（PyInstaller 产物）或系统 python
 */
function resolvePythonCommand(): { cmd: string; args: string[]; cwd: string } {
  if (app.isPackaged) {
    // PyInstaller 产物（Phase 5）：resources/nexus-server[.exe]
    const exeName = process.platform === 'win32' ? 'nexus-server.exe' : 'nexus-server';
    const exePath = path.join(process.resourcesPath, exeName);
    if (existsSync(exePath)) {
      return { cmd: exePath, args: [], cwd: process.resourcesPath };
    }
  }

  // 开发：仓库根 server/.venv
  const repoRoot = app.isPackaged
    ? path.dirname(app.getAppPath())
    : path.resolve(__dirname, '..', '..', '..', '..');
  const venvPython =
    process.platform === 'win32'
      ? path.join(repoRoot, 'server', '.venv', 'Scripts', 'python.exe')
      : path.join(repoRoot, 'server', '.venv', 'bin', 'python');

  const cmd = existsSync(venvPython) ? venvPython : 'python';
  return {
    cmd,
    args: ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--no-access-log'],
    cwd: path.join(repoRoot, 'server'),
  };
}

/** 启动 Python sidecar，返回句柄。 */
export async function startSidecar(): Promise<SidecarHandle> {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const { cmd, args, cwd } = resolvePythonCommand();

  const env = {
    ...process.env,
    NEXUS_ENV: app.isPackaged ? 'production' : 'development',
    NEXUS_HOST: '127.0.0.1',
    NEXUS_PORT: String(port),
  };

  console.info(`[sidecar] starting: ${cmd} ${args.join(' ')} (cwd=${cwd}, port=${port})`);
  const child = spawn(cmd, [...args, '--port', String(port)], {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  child.stdout?.on('data', (d) => process.stdout.write(`[sidecar] ${d}`));
  child.stderr?.on('data', (d) => process.stderr.write(`[sidecar] ${d}`));

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (!child.killed) {
      child.kill('SIGTERM');
      // 兜底强杀（Windows 下 SIGTERM 不一定生效）
      setTimeout(() => {
        try {
          if (!child.killed) child.kill('SIGKILL');
        } catch {
          /* noop */
        }
      }, 3000);
    }
  };

  child.on('exit', (code, signal) => {
    console.info(`[sidecar] exited code=${code} signal=${signal}`);
  });

  // 写入端口到文件，供 preload 读取（作为 window.__NEXUS__.apiBaseUrl 的来源）
  const portFile = path.join(app.getPath('userData'), 'sidecar.port');
  writeFileSync(portFile, String(port), 'utf-8');

  try {
    await waitForHealthy(baseUrl);
    console.info(`[sidecar] healthy at ${baseUrl}`);
  } catch (err) {
    stop();
    rmSync(portFile, { force: true });
    throw err;
  }

  return { port, baseUrl, process: child, stop };
}
