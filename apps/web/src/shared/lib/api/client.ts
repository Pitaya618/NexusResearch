/**
 * HTTP 客户端 —— 前端访问后端 API 的统一入口。
 *
 * 设计要点：
 * - baseUrl 解析：开发期走 Vite proxy（相对路径 /api），生产期由 Electron
 *   main 进程注入 sidecar 端口（window.__NEXUS__.apiBaseUrl）。
 * - 错误处理：后端返回 { ok: false, error: {...} } 时抛出 ApiError，
 *   成功时直接返回 data。对齐后端 errors.py 与前端 Result<T> 范式。
 * - 请求体/响应体均按后端 Pydantic 模型（camelCase）序列化。
 */
import type { Result } from 'shared/types';

/** 后端错误响应体（对齐 server/app/core/errors.py 的 _error_body） */
export interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/** 前端抛出的 API 错误 */
export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody, message?: string) {
    super(message ?? body.message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/** Electron preload 注入的全局对象（生产期） */
declare global {
  interface Window {
    __NEXUS__?: {
      apiBaseUrl?: string;
      version?: string;
    };
  }
}

/** 解析后端 base URL。
 *  - 生产期（Electron）：window.__NEXUS__.apiBaseUrl（含端口）
 *  - 开发期：空串（走 Vite proxy，相对路径 /api → localhost:8000）
 */
function getBaseUrl(): string {
  return window.__NEXUS__?.apiBaseUrl ?? '';
}

/** 通用请求封装。成功返回 data，失败抛 ApiError。 */
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let body: ApiErrorBody;
    try {
      const parsed = (await res.json()) as Result<unknown, ApiErrorBody>;
      body = parsed.ok ? { code: 'unknown', message: 'Unexpected success body in error' } : parsed.error;
    } catch {
      body = { code: 'network', message: res.statusText || `HTTP ${res.status}` };
    }
    throw new ApiError(res.status, body);
  }

  // 后端成功响应可能是 { ok: true, data: T } 或直接 T（OpenAPI response_model 场景）。
  // 这里做兼容处理：若带 ok 字段则解包，否则原样返回。
  const text = await res.text();
  if (!text) return undefined as T;
  const json = JSON.parse(text) as unknown;
  if (json && typeof json === 'object' && 'ok' in json && 'data' in json && (json as { ok: unknown }).ok === true) {
    return (json as { data: T }).data;
  }
  return json as T;
}

/** 便捷方法 */
export const http = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'DELETE' }),
};
