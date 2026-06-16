/**
 * API 层统一导出。
 *
 * 用法：
 *   import { literatureApi, aiApi } from 'shared/lib/api';
 *
 * 详见 ./client.ts（HTTP 封装）、./sse.ts（流式解析）、./endpoints.ts（端点）。
 */
export { http, request, ApiError, type ApiErrorBody } from './client';
export { streamSse, type SseEvent, type AiStreamEvent } from './sse';
export {
  systemApi,
  literatureApi,
  essayApi,
  aiApi,
  providerApi,
  skillApi,
  paperApi,
  mcpApi,
} from './endpoints';
export type { ProviderDTO, SkillDTO, CompileResultDTO, McpServerDTO } from './endpoints';
