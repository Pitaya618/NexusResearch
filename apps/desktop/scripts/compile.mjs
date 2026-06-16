/**
 * 编译 Electron main/preload TS → JS（esbuild，CJS 格式）。
 *
 * 用法：node scripts/compile.mjs [--watch]
 * 产物：dist/main/index.js, dist/preload/index.js
 */
import { build, context } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { rmSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const desktopDir = resolve(__dirname, "..");
const srcDir = resolve(desktopDir, "src");
const outDir = resolve(desktopDir, "dist");

const isWatch = process.argv.includes("--watch");

// 清理产物
rmSync(outDir, { recursive: true, force: true });

/** 共享 esbuild 配置。Electron main 必须是 CJS。 */
const baseConfig = {
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  sourcemap: true,
  external: ["electron", "electron-updater"],
  logLevel: "info",
};

const entries = [
  {
    entryPoints: [resolve(srcDir, "main", "index.ts")],
    outfile: resolve(outDir, "main", "index.js"),
  },
  {
    entryPoints: [resolve(srcDir, "preload", "index.ts")],
    outfile: resolve(outDir, "preload", "index.js"),
  },
];

async function main() {
  if (isWatch) {
    for (const entry of entries) {
      const ctx = await context({ ...baseConfig, ...entry });
      await ctx.watch();
    }
    console.log("[compile] watching...");
  } else {
    await Promise.all(entries.map((entry) => build({ ...baseConfig, ...entry })));
    console.log("[compile] ✓ main + preload compiled → dist/");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
