/** 数据传输对象 (DTO) 类型定义 */
import type {
  AiEditSuggestion,
  ChatMessage,
  CitationFormat,
  CompileResult,
  DiffAction,
  Essay,
  EssayTag,
  Literature,
  LiteratureListItem,
  LatexTemplate,
  ModelInfo,
  PolishMode,
  ReadStatus,
  Skill,
  SkillCategory,
  SkillModule,
  SkillStatus,
} from './entities';
import type { PaginatedResponse, SortConfig } from './common';

/** 分页请求基础参数 */
export interface PaginatedRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly sort?: SortConfig<unknown>;
  readonly search?: string;
}

/** 文献列表请求 */
export interface LiteratureListRequest extends PaginatedRequest {
  readonly collectionId?: string;
  readonly tagIds?: readonly string[];
  readonly readStatus?: ReadStatus;
  readonly isFavorite?: boolean;
}

/** 文献列表响应 */
export type LiteratureListResponse = PaginatedResponse<LiteratureListItem>;

/** 文献详情响应 */
export type LiteratureDetailResponse = Literature;

/** 创建文献请求 */
export type CreateLiteratureRequest = Omit<Literature, 'id' | 'aiSummary'> & {
  readonly importSource?: 'doi' | 'pdf' | 'bibtex' | 'manual';
};

/** 更新文献请求 */
export type UpdateLiteratureRequest = Partial<
  Pick<Literature, 'title' | 'authors' | 'journal' | 'year' | 'tags' | 'isFavorite' | 'readStatus'>
> & { readonly id: number };

/** 删除文献请求 */
export interface DeleteLiteratureRequest {
  readonly id: number;
}

/** 批量文献操作 */
export interface BulkLiteratureAction {
  readonly ids: readonly number[];
  readonly action: 'delete' | 'markAsRead' | 'markAsUnread' | 'addTag' | 'removeTag' | 'addFavorite' | 'removeFavorite';
  readonly payload?: string;
}

/** 生成摘要请求 */
export interface GenerateSummaryRequest {
  readonly literatureId: number;
  readonly modelId?: string;
}

/** 生成摘要响应 */
export interface GenerateSummaryResponse {
  readonly summary: string;
  readonly modelUsed: string;
  readonly tokensUsed: number;
}

/** 生成引用请求 */
export interface GenerateCitationRequest {
  readonly literatureId: number;
  readonly format: CitationFormat;
}

/** 随笔列表请求 */
export interface EssayListRequest extends PaginatedRequest {
  readonly tag?: EssayTag;
}

/** 随笔列表响应 */
export type EssayListResponse = PaginatedResponse<Essay>;

/** 创建随笔请求 */
export type CreateEssayRequest = Omit<Essay, 'id' | 'createdAt' | 'updatedAt'>;

/** 更新随笔请求 */
export type UpdateEssayRequest = Partial<Pick<Essay, 'title' | 'content' | 'tag'>> & {
  readonly id: string;
};

/** AI 上下文 - 可辨识联合类型 */
export type AiContext =
  | { readonly type: 'literature'; readonly literatureId: number }
  | { readonly type: 'essay'; readonly essayId: string }
  | { readonly type: 'paper'; readonly projectId: string; readonly activeFile?: string }
  | { readonly type: 'reader'; readonly literatureId: number; readonly currentPage: number };

/** AI 聊天请求 */
export interface AiChatRequest {
  readonly messages: readonly ChatMessage[];
  readonly context: AiContext;
  readonly modelId?: string;
}

/** AI 聊天响应 */
export interface AiChatResponse {
  readonly message: ChatMessage;
  readonly modelUsed: string;
  readonly tokensUsed: number;
}

/** AI 编辑建议响应 */
export interface AiEditSuggestionResponse {
  readonly suggestion: AiEditSuggestion;
  readonly modelUsed: string;
}

/** 应用编辑请求 */
export interface ApplyEditRequest {
  readonly suggestionId: string;
  readonly action: DiffAction;
  readonly essayId: string;
}

/** 论文编译请求 */
export interface PaperCompileRequest {
  readonly projectId: string;
  readonly template: LatexTemplate;
}

/** 论文编译响应 */
export type PaperCompileResponse = CompileResult;

/** 论文润色请求 */
export interface PaperPolishRequest {
  readonly projectId: string;
  readonly selectedText: string;
  readonly mode: PolishMode;
  readonly modelId?: string;
}

/** 论文润色响应 */
export interface PaperPolishResponse {
  readonly originalText: string;
  readonly polishedText: string;
  readonly mode: PolishMode;
}

/** 提供商测试请求 */
export interface ProviderTestRequest {
  readonly providerId: string;
}

/** 提供商测试响应 */
export interface ProviderTestResponse {
  readonly success: boolean;
  readonly latency: number;
  readonly error?: string;
}

/** 获取模型列表请求 */
export interface FetchModelsRequest {
  readonly providerId: string;
}

/** 获取模型列表响应 */
export interface FetchModelsResponse {
  readonly models: readonly ModelInfo[];
  readonly providerId: string;
}

/** 技能列表请求 */
export interface SkillListRequest extends PaginatedRequest {
  readonly category?: SkillCategory;
  readonly module?: SkillModule;
  readonly status?: SkillStatus;
}

/** 技能列表响应 */
export type SkillListResponse = PaginatedResponse<Skill>;

/** 安装技能请求 */
export interface InstallSkillRequest {
  readonly skillId: string;
}

/** 更新技能请求 */
export interface UpdateSkillRequest {
  readonly skillId: string;
}

/** 连接测试响应 */
export interface ConnectionTestResponse {
  readonly success: boolean;
  readonly message: string;
  readonly latency?: number;
}

/** 导入数据响应 */
export interface ImportDataResponse {
  readonly imported: {
    readonly literature: number;
    readonly essays: number;
    readonly papers: number;
    readonly settings: boolean;
  };
  readonly skipped: number;
  readonly errors: readonly string[];
}
