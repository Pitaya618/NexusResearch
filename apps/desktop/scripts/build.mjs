/**
 * 完整打包构建脚本。
 *
 * 流程：
 * 1. 前端构建（@nexus/web → apps/web/dist）
 * 2. 编译 Electron main/preload（TS → JS）
 * 3. 检查 Python sidecar 产物（dist/nexus-server）是否存在
 * 4. electron-builder 据此打包安装包
 *
 * 用法：node scripts/build.mjs
 * 注意：需先手动跑 PyInstaller 打包 Python（见 scripts/build-python.*）
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const desktopDir = resolve(__dirname, "..");
const repoRoot = resolve(desktopDir, "..", "..");
const serverDir = resolve(repoRoot, "server");

function run(cmd, cwd = repoRoot, label = cmd) {
  console.log(`\n[build] ${label}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

async function main() {
  console.log("=== NexusResearch 桌面打包 ===\n");

  // 1. 前端构建
  run("pnpm --filter @nexus/web build", repoRoot, "building frontend (@nexus/web)");

  // 2. 编译 Electron
  run("node scripts/compile.mjs", desktopDir, "compiling electron main/preload");

  // 3. 检查 Python sidecar 产物
  const isWin = process.platform === "win32";
  const serverExeName = isWin ? "nexus-server.exe" : "nexus-server";
  const serverDist = resolve(serverDir, "dist", "nexus-server", serverExeName);

  if (!existsSync(serverDist)) {
    console.warn("\n[build] ⚠ Python sidecar 未打包！");
    console.warn(`       预期路径: ${serverDist}`);
    console.warn("       请先运行: cd server && scripts\\build-python.bat");
    console.warn("       本次构建将不含 sidecar（应用启动后 AI 功能不可用）\n");
  } else {
    console.log(`[build] ✓ Python sidecar found: ${serverDist}`);
  }

  console.log("\n[build] ✓ 构建完成，可运行 electron-builder 打包安装包");
  console.log("[build]   cd apps/desktop && pnpm package");
}

main().catch((err) => {
  console.error("[build] 失败:", err);
  process.exit(1);
});
