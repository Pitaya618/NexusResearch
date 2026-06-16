/**
 * API 端点函数 —— 按领域组织，类型对齐 @nexus/shared-types 的 DTO。
 *
 * 前端业务层（features 下各模块的 model）应通过本模块访问后端，而非直接 fetch。
 * Phase 1 仅实现验证连通所需的 literature；其余领域在对应 Phase 补齐。
 */
import { http } from './client';
import { streamSse, type AiStreamEvent } from './sse';
import type {
  AiChatRequest,
  Essay,
  GenerateCitationRequest,
  GenerateSummaryRequest,
  GenerateSummaryResponse,
  Literature,
  LiteratureListResponse,
} from 'shared/types';

// ============ 系统 ============

export const systemApi = {
  health: () => http.get<{ status: string }>('/api/health'),
  info: () =>
    http.get<{ app: string; version: string; env: string; dataDir: string }>('/api/system/info'),

  /** 导出数据（返回 blob 下载）。 */
  exportData: async (format: 'json' | 'nrz' = 'json') => {
    const baseUrl = window.__NEXUS__?.apiBaseUrl ?? '';
    const res = await fetch(`${baseUrl}/api/system/export?format=${format}`);
    if (!res.ok) throw new Error(`导出失败: HTTP ${res.status}`);
    return res.blob();
  },

  /** 导入数据（文件上传）。 */
  importData: async (file: File, merge = true) => {
    const baseUrl = window.__NEXUS__?.apiBaseUrl ?? '';
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${baseUrl}/api/system/import?merge=${merge}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`导入失败: HTTP ${res.status}`);
    return res.json();
  },

  /** 存储用量。 */
  storage: () =>
    http.get<{
      used: string;
      available: string;
      dataPath: string;
      literatureCount: number;
      essayCount: number;
      paperCount: number;
    }>('/api/system/storage'),

  /** 用量统计总览。 */
  usageOverview: () =>
    http.get<{ totalTokens: number; totalRequests: number; totalCost: number; modelCount: number }>(
      '/api/system/usage/overview',
    ),

  /** 按模型聚合用量。 */
  usageByModel: () =>
    http.get<{ name: string; tokens: number; requests: number; cost: number }[]>(
      '/api/system/usage/by-model',
    ),

  /** 用量趋势。 */
  usageTrend: (days = 7) =>
    http.get<{ date: string; total: number; cost: number }[]>(
      `/api/system/usage/trend?days=${days}`,
    ),
};

// ============ 文献 ============

export const literatureApi = {
  /** 文献列表（带过滤分页，参数推送到后端）。 */
  list: (params?: {
    collectionId?: string;
    search?: string;
    isFavorite?: boolean;
    readStatus?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.collectionId) qs.set('collectionId', params.collectionId);
    if (params?.search) qs.set('search', params.search);
    if (params?.isFavorite !== undefined) qs.set('isFavorite', String(params.isFavorite));
    if (params?.readStatus) qs.set('readStatus', params.readStatus);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    const query = qs.toString();
    return http.get<LiteratureListResponse>(`/api/literature${query ? `?${query}` : ''}`);
  },

  /** 文献详情。 */
  detail: (id: number) => http.get<Literature>(`/api/literature/${id}`),

  /** 概览统计。 */
  stats: () =>
    http.get<{
      total: number;
      favoriteCount: number;
      readCount: number;
      unreadCount: number;
      withAiSummary: number;
    }>('/api/literature/stats'),

  /** 创建文献。 */
  create: (data: Partial<Literature>) => http.post<Literature>('/api/literature', data),

  /** 更新文献（部分字段）。 */
  update: (id: number, fields: Partial<Literature>) =>
    http.patch<Literature>(`/api/literature/${id}`, fields),

  /** 删除文献。 */
  delete: (id: number) => http.delete<{ ok: boolean }>(`/api/literature/${id}`),

  /** 批量操作。 */
  bulkAction: (
    ids: number[],
    action: 'delete' | 'markAsRead' | 'markAsUnread' | 'addFavorite' | 'removeFavorite',
    payload?: string,
  ) => http.post<{ ok: boolean; affected: number }>('/api/literature/bulk', { ids, action, payload }),

  /** 生成 AI 摘要（Phase 3）。 */
  generateSummary: (req: GenerateSummaryRequest) =>
    http.post<GenerateSummaryResponse>('/api/literature/summary', req),

  /** 生成引用（Phase 3）。 */
  generateCitation: (req: GenerateCitationRequest) =>
    http.post<{ text: string }>('/api/literature/citation', req),
};

// ============ 随笔 ============

export const essayApi = {
  /** 随笔列表。 */
  list: (params?: { tag?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.tag) qs.set('tag', params.tag);
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    return http.get<{ items: Essay[]; total: number }>(`/api/essays${query ? `?${query}` : ''}`);
  },

  /** 随笔详情。 */
  detail: (id: string) => http.get<Essay>(`/api/essays/${id}`),

  /** 创建随笔。 */
  create: (data: { title: string; content: string; tag: string }) =>
    http.post<Essay>('/api/essays', data),

  /** 更新随笔。 */
  update: (id: string, fields: Partial<Pick<Essay, 'title' | 'content' | 'tag'>>) =>
    http.patch<Essay>(`/api/essays/${id}`, fields),

  /** 删除随笔。 */
  delete: (id: string) => http.delete<{ ok: boolean }>(`/api/essays/${id}`),
};

// ============ AI 对话（流式） ============

export const aiApi = {
  /** 流式 AI 对话（SSE）。
   *
   * @param req 对话请求（messages + context + modelId）
   * @param onChunk 每个文本片段回调
   * @param onDone 完成回调（含模型与 token 用量）
   * @param signal 中断信号
   */
  chat: (
    req: AiChatRequest,
    onChunk: (content: string) => void,
    onDone?: (modelUsed: string, tokensUsed: number) => void,
    signal?: AbortSignal,
  ) =>
    streamSse<AiStreamEvent>(
      '/api/ai/chat',
      req,
      (event) => {
        switch (event.type) {
          case 'chunk':
            onChunk(event.content);
            break;
          case 'done':
            onDone?.(event.modelUsed, event.tokensUsed);
            break;
          case 'error':
            throw new Error(event.message);
        }
      },
      signal,
    ),

  /** 生成文献 AI 摘要。 */
  generateSummary: (literatureId: number, modelId?: string) =>
    http.post<{ summary: string; modelUsed: string; tokensUsed: number }>('/api/ai/summary', {
      literatureId,
      modelId,
    }),

  /** 生成引用。 */
  generateCitation: (literatureId: number, format: 'apa' | 'mla' | 'gbt7714') =>
    http.post<{ text: string; format: string }>('/api/ai/citation', { literatureId, format }),

  /** 论文润色。 */
  polish: (selectedText: string, mode: 'academic' | 'concise' | 'expand' | 'keepOriginal', modelId?: string) =>
    http.post<{ originalText: string; polishedText: string; mode: string }>('/api/ai/polish', {
      selectedText,
      mode,
      modelId,
    }),
};

// ============ Provider 管理 ============

export interface ProviderDTO {
  id: string;
  name: string;
  icon: string;
  description: string;
  baseUrl: string;
  apiKey: string; // 脱敏后的标记
  apiKeyConfigured: boolean;
  compatibilityType: string;
  connectionStatus: string;
  isDefault: boolean;
}

export const providerApi = {
  list: () => http.get<ProviderDTO[]>('/api/providers'),
  detail: (id: string) => http.get<ProviderDTO>(`/api/providers/${id}`),
  upsert: (
    id: string,
    data: {
      name: string;
      baseUrl: string;
      apiKey?: string;
      compatibilityType: string;
      isDefault?: boolean;
      description?: string;
      icon?: string;
    },
  ) => http.put<ProviderDTO>(`/api/providers/${id}`, data),
  remove: (id: string) => http.delete<{ ok: boolean }>(`/api/providers/${id}`),
  test: (id: string) =>
    http.post<{ success: boolean; latency: number; error: string | null }>(`/api/providers/${id}/test`),
  fetchModels: (id: string) =>
    http.get<{ models: { id: string; name: string; meta: string }[]; providerId: string }>(
      `/api/providers/${id}/models`,
    ),
  listAssignments: () =>
    http.get<{ module: string; modelId: string; purpose: string }[]>('/api/providers/assignments/all'),
  setAssignment: (module: string, modelId: string, purpose = '') =>
    http.put<{ module: string; modelId: string; purpose: string }>(
      `/api/providers/assignments/${module}`,
      { module, modelId, purpose },
    ),
};

// ============ Skills 市场 ============

export interface SkillDTO {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string[];
  module: string[];
  status: 'installed' | 'available' | 'updating';
  version: string;
  latestVersion?: string;
  updateDescription?: string;
}

export const skillApi = {
  list: (params?: { category?: string; module?: string; status?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.module) qs.set('module', params.module);
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    return http.get<{ items: SkillDTO[]; total: number }>(`/api/skills${query ? `?${query}` : ''}`);
  },
  detail: (id: string) => http.get<SkillDTO>(`/api/skills/${id}`),
  install: (id: string) => http.post<{ ok: boolean }>(`/api/skills/${id}/install`),
  uninstall: (id: string) => http.delete<{ ok: boolean }>(`/api/skills/${id}`),
  execute: (id: string, variables: Record<string, string>, module = 'essay', modelId?: string) =>
    http.post<{ result: string; skillId: string }>(`/api/skills/${id}/execute`, {
      variables,
      module,
      modelId,
    }),
};

// ============ 论文项目与 LaTeX 编译 ============

export interface CompileResultDTO {
  status: 'idle' | 'compiling' | 'success' | 'error';
  pages: number;
  fileSize: string;
  logEntries: { level: string; message: string; timestamp: string }[];
  errorCount: number;
  warningCount: number;
  pdfPath?: string;
}

export const paperApi = {
  /** 检测系统 LaTeX 可用性。 */
  latexAvailable: () => http.get<{ available: boolean }>('/api/papers/latex/available'),

  /** 创建论文项目。 */
  create: (name: string, template = 'neurips-2024') =>
    http.post<{ id: string; name: string; template: string; projectDir: string }>('/api/papers', {
      name,
      template,
    }),

  /** 获取项目（含文件树）。 */
  get: (id: string) =>
    http.get<{ id: string; name: string; fileTree: unknown[]; projectDir: string }>(
      `/api/papers/${id}`,
    ),

  /** 编译。 */
  compile: (projectId: string, mainFile = 'main.tex') =>
    http.post<CompileResultDTO>(`/api/papers/${projectId}/compile`, { projectId, mainFile }),
};

// ============ MCP 服务器管理 ============

export interface McpServerDTO {
  id: string;
  name: string;
  command: string;
  args: string[];
  url: string;
  transport: 'stdio' | 'sse' | 'http';
  enabled: boolean;
  status: string;
  tools: unknown[];
}

export const mcpApi = {
  list: () => http.get<McpServerDTO[]>('/api/mcp'),
  get: (id: string) => http.get<McpServerDTO>(`/api/mcp/${id}`),
  add: (data: {
    id: string;
    name: string;
    command?: string;
    args?: string[];
    url?: string;
    transport?: string;
    enabled?: boolean;
  }) => http.post<McpServerDTO>('/api/mcp', data),
  update: (id: string, fields: Partial<McpServerDTO>) =>
    http.patch<McpServerDTO>(`/api/mcp/${id}`, fields),
  remove: (id: string) => http.delete<{ ok: boolean }>(`/api/mcp/${id}`),
  test: (id: string) =>
    http.post<{ success: boolean; error: string | null }>(`/api/mcp/${id}/test`),
};
