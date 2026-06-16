/**
 * NexusResearch 类型代码生成运行器。
 *
 * 管线：packages/shared-types/src/*.ts
 *        ↓ ts-json-schema-generator  （本脚本）
 *      tools/codegen/schema.json
 *        ↓ datamodel-code-generator （Python，本脚本调用）
 *      server/app/models/_generated/*.py  (Pydantic v2)
 *
 * 用法：
 *   node run.js schema   # 仅生成 JSON Schema
 *   node run.js py       # 仅生成 Pydantic（需先有 schema.json）
 *   node run.js all      # 完整管线
 */
import { createGenerator } from "ts-json-schema-generator";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const SHARED_TYPES_DIR = resolve(ROOT, "packages", "shared-types", "src");
const SCHEMA_PATH = resolve(__dirname, "schema.json");
const SERVER_DIR = resolve(ROOT, "server");
const PY_OUT_DIR = resolve(SERVER_DIR, "app", "models", "_generated");

// ---------- Step 1: TS → JSON Schema ----------

// 只导出领域实体与 DTO；UI/forms 类型对后端无意义。
// 通过 type filter 限定（ts-json-schema-generator 支持导出全部或指定类型）。
const EXPOSED_TYPES = [
  // common
  "PaginatedResponse",
  // entities
  "Literature",
  "LiteratureListItem",
  "Collection",
  "Tag",
  "Annotation",
  "ReadingNote",
  "ChatMessage",
  "Essay",
  "AiEditSuggestion",
  "DiffSegment",
  "PaperProject",
  "FileNode",
  "CompileResult",
  "CompileLogEntry",
  "Skill",
  "InstalledSkill",
  "SkillStats",
  "Provider",
  "ModelInfo",
  "ModuleModelAssignment",
  "ProxyConfig",
  "StorageInfo",
  "StorageBreakdown",
  // dto
  "LiteratureListRequest",
  "LiteratureListResponse",
  "CreateLiteratureRequest",
  "UpdateLiteratureRequest",
  "DeleteLiteratureRequest",
  "BulkLiteratureAction",
  "GenerateSummaryRequest",
  "GenerateSummaryResponse",
  "GenerateCitationRequest",
  "EssayListRequest",
  "EssayListResponse",
  "CreateEssayRequest",
  "UpdateEssayRequest",
  "AiContext",
  "AiChatRequest",
  "AiChatResponse",
  "AiEditSuggestionResponse",
  "ApplyEditRequest",
  "PaperCompileRequest",
  "PaperCompileResponse",
  "PaperPolishRequest",
  "PaperPolishResponse",
  "ProviderTestRequest",
  "ProviderTestResponse",
  "FetchModelsRequest",
  "FetchModelsResponse",
  "SkillListRequest",
  "SkillListResponse",
  "InstallSkillRequest",
  "UpdateSkillRequest",
  "ConnectionTestResponse",
  "ImportDataResponse",
];

function generateSchema() {
  console.log("[codegen] Generating JSON Schema from TS types...");
  // ts-json-schema-generator 一次只接受单个 type。
  // 对每个 EXPOSED_TYPES 单独生成，合并 definitions，保留跨类型 $ref。
  const generator = createGenerator({
    path: join(SHARED_TYPES_DIR, "index.ts"),
    tsconfig: resolve(ROOT, "packages", "shared-types", "tsconfig.json"),
    expose: "all", // 暴露被引用的子类型到 definitions（让 $ref 可解析）
    jsDoc: "extended",
    skipTypeCheck: false,
  });

  const definitions = {};
  const missing = [];
  for (const t of EXPOSED_TYPES) {
    try {
      const part = generator.createSchema(t);
      if (part.definitions) {
        Object.assign(definitions, part.definitions);
      } else if (part[t]) {
        definitions[t] = part[t];
      } else {
        missing.push(t);
      }
    } catch (e) {
      missing.push(t);
    }
  }
  if (missing.length) {
    console.warn(`[codegen] ! 未生成的类型（可能名称不匹配）：${missing.join(", ")}`);
  }

  const filtered = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://nexusresearch.dev/types.json",
    title: "NexusResearch",
    description: "Shared types (TS single source of truth) → Pydantic via codegen",
    definitions: Object.fromEntries(
      Object.entries(definitions).filter(([k]) => EXPOSED_TYPES.includes(k)),
    ),
  };

  writeFileSync(SCHEMA_PATH, JSON.stringify(filtered, null, 2), "utf-8");
  const count = Object.keys(filtered.definitions).length;
  console.log(`[codegen] ✓ schema.json written (${count} types) → ${SCHEMA_PATH}`);
}

// ---------- Step 2: JSON Schema → Pydantic ----------

function generatePydantic() {
  if (!existsSync(SCHEMA_PATH)) {
    console.error("[codegen] ✗ schema.json not found. Run `node run.js schema` first.");
    process.exit(1);
  }

  mkdirSync(PY_OUT_DIR, { recursive: true });

  console.log("[codegen] Generating Pydantic models via datamodel-code-generator...");
  // 优先用 server/.venv 的 datamodel-codegen；不存在则提示安装。
  const candidates = [
    join(SERVER_DIR, ".venv", "Scripts", "datamodel-codegen"),
    join(SERVER_DIR, ".venv", "bin", "datamodel-codegen"),
    "datamodel-codegen",
  ];
  let cmd = null;
  for (const c of candidates) {
    const isWin = process.platform === "win32";
    const probe = isWin ? `${c}.exe` : c;
    if (existsSync(probe) || c === "datamodel-codegen") {
      cmd = c;
      break;
    }
  }
  if (!cmd) {
    console.error(
      "[codegen] ✗ datamodel-codegen not found. Install: cd server && .venv\\Scripts\\pip install datamodel-code-generator",
    );
    process.exit(1);
  }

  const result = spawnSync(
    cmd,
    [
      "--input",
      SCHEMA_PATH,
      "--output",
      join(PY_OUT_DIR, "models.py"),
      "--output-model-type",
      "pydantic_v2.BaseModel",
      "--input-file-type",
      "jsonschema",
      "--use-double-quotes",
      "--target-python-version",
      "3.10",
      "--enum-field-as-literal",
      "all",
      "--use-standard-collections",
      "--use-union-operator",
      "--disable-timestamp",
      "--field-constraints",
      // 使用内置格式化器，避免外部 black/isort 依赖告警
      "--formatters",
      "builtin",
    ],
    { stdio: "inherit", shell: true },
  );

  if (result.status !== 0) {
    console.error("[codegen] ✗ datamodel-code-generator failed");
    process.exit(result.status ?? 1);
  }

  // 生成 __init__.py 便于导入
  writeFileSync(
    join(PY_OUT_DIR, "__init__.py"),
    '"""自动生成的 Pydantic 模型 —— 勿手改。运行 `pnpm codegen` 重新生成。"""\n' +
      "from app.models._generated.models import *  # noqa: F401,F403\n",
    "utf-8",
  );

  console.log(`[codegen] ✓ Pydantic models written → ${join(PY_OUT_DIR, "models.py")}`);
}

// ---------- Entry ----------

const mode = process.argv[2] || "all";
if (mode === "schema" || mode === "all") generateSchema();
if (mode === "py" || mode === "all") generatePydantic();
console.log("[codegen] done.");
