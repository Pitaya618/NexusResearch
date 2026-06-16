/**
 * NexusResearch 共享类型单一真相源
 *
 * 前端通过 `shared/types` 别名引用（apps/web/src/shared/types/* 再导出本包）。
 * 后端通过代码生成管线（TS → JSON Schema → Pydantic）同步本包类型。
 *
 * 修改本目录下的类型后，请运行 `pnpm codegen` 以同步到 Python 后端。
 */
export * from './common';
export * from './entities';
export * from './ui';
export * from './forms';
export * from './dto';
