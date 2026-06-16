# NexusResearch 类型代码生成（tools/codegen）

将 `packages/shared-types/src/*.ts` 中的 TypeScript 类型同步为
`server/app/models/_generated/models.py` 的 Pydantic v2 模型。

TS 类型是**单一真相源**；后端 Pydantic 模型由本工具链自动产出，勿手改。

## 管线

```
packages/shared-types/src/*.ts
        │  ts-json-schema-generator (Step 1)
        ▼
tools/codegen/schema.json           (JSON Schema draft-07)
        │  datamodel-code-generator (Step 2, Python)
        ▼
server/app/models/_generated/models.py   (Pydantic v2)
```

## 用法

在仓库根目录：

```bash
pnpm codegen          # 完整管线（schema + pydantic）
pnpm codegen:schema   # 仅生成 JSON Schema
pnpm codegen:py       # 仅生成 Pydantic（需先有 schema.json）
```

## 暴露哪些类型

`run.js` 中的 `EXPOSED_TYPES` 数组定义了导出到后端的类型清单。
默认包含领域实体（`entities.ts`）与 DTO（`dto.ts`），**不包含**
UI/forms/common 工具类型（后端无意义）。

新增后端需要的类型时：
1. 在 `packages/shared-types/src/` 定义
2. 在 `EXPOSED_TYPES` 中登记
3. 运行 `pnpm codegen`

## 依赖

- TS：`ts-json-schema-generator`
- Python：`datamodel-code-generator`（已声明在 server dev 依赖）

## 注意事项

- 泛型类型（如 `PaginatedResponse<T>`）无法独立生成；
  需通过具体使用（如 `LiteratureListResponse`）间接暴露。
- 可辨识联合（如 `AiContext`）生成为带字面量字段的合并模型，
  通过 `type` 字段做区分。
- camelCase 字段名原样保留，与前端契约一致。
