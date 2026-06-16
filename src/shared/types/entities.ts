/** 业务实体类型定义 */
import type { ISODateString, OklchColor } from './common';

// ========== 文献实体 ==========

/** 阅读状态 */
export type ReadStatus = 'read' | 'unread';

/** 引用格式 */
export type CitationFormat = 'apa' | 'mla' | 'gbt7714';

/** 引用 */
export interface Citation {
  readonly format: CitationFormat;
  readonly text: string;
}

/** 文献实体 */
export interface Literature {
  readonly id: number;
  readonly title: string;
  readonly authors: string;
  readonly journal: string;
  readonly year: number;
  readonly doi: string;
  readonly abstract: string;
  readonly aiSummary: string;
  readonly tags: readonly string[];
  readonly isFavorite: boolean;
  readonly readStatus: ReadStatus;
  readonly pdfUrl?: string;
  readonly filePath?: string;
}

/** 文献列表项（摘要视图用） */
export type LiteratureListItem = Pick<
  Literature,
  'id' | 'title' | 'authors' | 'journal' | 'year' | 'tags' | 'readStatus' | 'isFavorite'
> & {
  readonly abstractPreview: string;
};

/** 收藏夹 */
export interface Collection {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly count: number;
  readonly isSystem: boolean;
}

/** 标签 */
export interface Tag {
  readonly id: string;
  readonly name: string;
  readonly color: OklchColor;
  readonly count: number;
}

/** 文献概览统计 */
export interface LiteratureOverviewStats {
  readonly total: number;
  readonly addedThisMonth: number;
  readonly withAiSummary: number;
}

/** 详情面板标签页 */
export type DetailTab = 'abstract' | 'aiSummary' | 'notes' | 'citations';

/** 排序字段 */
export type SortField = 'title' | 'authors' | 'journal' | 'year';

// ========== 阅读器实体 ==========

/** 高亮颜色 */
export type HighlightColor = 'blue' | 'yellow' | 'green' | 'purple' | 'red';

/** 批注类型 */
export type AnnotationType = 'highlight' | 'underline' | 'note';

/** 批注 */
export interface Annotation {
  readonly id: string;
  readonly type: AnnotationType;
  readonly color: HighlightColor;
  readonly page: number;
  readonly quotedText: string;
  readonly note: string;
  readonly createdAt: ISODateString;
}

/** 笔记模板 */
export type NoteTemplate = 'method-result-evaluation' | 'problem-method-experiment-conclusion' | 'blank';

/** 阅读笔记 */
export interface ReadingNote {
  readonly id: string;
  readonly literatureId: number;
  readonly content: string;
  readonly template: NoteTemplate | null;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

/** 聊天角色 */
export type ChatRole = 'user' | 'assistant';

/** 聊天消息 */
export interface ChatMessage {
  readonly id: string;
  readonly role: ChatRole;
  readonly content: string;
  readonly timestamp: ISODateString;
}

/** 阅读器工具 */
export type ReaderTool = 'highlight' | 'underline' | 'note';

/** 阅读器右侧面板标签 */
export type ReaderRightTab = 'notes' | 'annotations' | 'ai';

// ========== 随笔实体 ==========

/** 随笔标签 */
export type EssayTag = '灵感' | '文献笔记' | '实验草稿' | '综述';

/** 随笔 */
export interface Essay {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly tag: EssayTag;
  readonly wordCount: number;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

/** 差异操作 */
export type DiffAction = 'accept' | 'reject' | 'refine';

/** 差异片段 */
export interface DiffSegment {
  readonly type: 'addition' | 'deletion' | 'unchanged';
  readonly text: string;
}

/** AI 编辑建议 */
export interface AiEditSuggestion {
  readonly id: string;
  readonly segments: readonly DiffSegment[];
  readonly accepted: boolean | null;
}

// ========== 论文实体 ==========

/** 文件类型 */
export type FileType = 'tex' | 'bib' | 'sty' | 'pdf' | 'log' | 'image' | 'folder';

/** 文件节点（递归树结构） */
export interface FileNode {
  readonly name: string;
  readonly type: FileType;
  readonly children?: readonly FileNode[];
  readonly isActive?: boolean;
}

/** LaTeX 模板 */
export type LatexTemplate = 'neurips-2024' | 'icml-2024' | 'arxiv' | 'ieee-trans' | 'elsevier';

/** 编译状态 */
export type CompileStatus = 'idle' | 'compiling' | 'success' | 'error';

/** 编译日志条目 */
export interface CompileLogEntry {
  readonly level: 'info' | 'warn' | 'error' | 'success';
  readonly message: string;
  readonly timestamp: ISODateString;
}

/** 编译结果 */
export interface CompileResult {
  readonly status: CompileStatus;
  readonly pages: number;
  readonly fileSize: string;
  readonly logEntries: readonly CompileLogEntry[];
  readonly errorCount: number;
  readonly warningCount: number;
}

/** 润色模式 */
export type PolishMode = 'academic' | 'concise' | 'expand' | 'keepOriginal';

/** AI 子标签 */
export type AiSubTab = 'qa' | 'polish' | 'draw' | 'log';

/** 论文项目 */
export interface PaperProject {
  readonly id: string;
  readonly name: string;
  readonly fileTree: readonly FileNode[];
  readonly template: LatexTemplate;
  readonly compileResult: CompileResult | null;
  readonly activeFile: string | null;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

/** 关联项目 */
export interface LinkedProject {
  readonly type: 'essay' | 'experiment';
  readonly id: string;
  readonly name: string;
}

// ========== 技能实体 ==========

/** 技能分类 */
export type SkillCategory = '文献' | '阅读' | '写作' | '数据分析' | '绘图';

/** 技能状态 */
export type SkillStatus = 'installed' | 'available' | 'updating';

/** 技能模块 */
export type SkillModule = 'literature' | 'reader' | 'essay' | 'paper';

/** 技能 */
export interface Skill {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly category: readonly SkillCategory[];
  readonly module: readonly SkillModule[];
  readonly status: SkillStatus;
  readonly version: string;
  readonly latestVersion?: string;
  readonly updateDescription?: string;
}

/** 技能统计 */
export interface SkillStats {
  readonly skillId: string;
  readonly usageCount: number;
  readonly lastUsedAt: ISODateString | null;
  readonly status: 'running' | 'paused';
}

/** 已安装技能 */
export type InstalledSkill = Skill & { readonly stats: SkillStats };

// ========== 提供商/设置实体 ==========

/** 兼容性类型 */
export type CompatibilityType = 'openai' | 'anthropic' | 'custom';

/** 连接状态 */
export type ConnectionStatus = 'connected' | 'not-configured' | 'error';

/** API 提供商 */
export interface Provider {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly compatibilityType: CompatibilityType;
  readonly connectionStatus: ConnectionStatus;
  readonly isDefault: boolean;
}

/** 模型信息 */
export interface ModelInfo {
  readonly id: string;
  readonly name: string;
  readonly meta: string;
  readonly tags: readonly string[];
  readonly isHot: boolean;
}

/** 模块类型 */
export type ModuleType = 'literature' | 'reader' | 'essay' | 'paper';

/** 模块模型分配 */
export interface ModuleModelAssignment {
  readonly module: ModuleType;
  readonly modelId: string;
  readonly purpose: string;
}

/** 代理类型 */
export type ProxyType = 'HTTP' | 'SOCKS5';

/** 代理配置 */
export interface ProxyConfig {
  readonly enabled: boolean;
  readonly type: ProxyType;
  readonly host: string;
  readonly port: number;
  readonly auth: string;
}

/** 存储用量明细 */
export interface StorageBreakdown {
  readonly literature: number;
  readonly essays: number;
  readonly papers: number;
  readonly cache: number;
  readonly unit: 'GB' | 'MB';
}

/** 存储信息 */
export interface StorageInfo {
  readonly used: string;
  readonly available: string;
  readonly breakdown: StorageBreakdown;
  readonly dataPath: string;
  readonly literatureCount: number;
  readonly essayCount: number;
  readonly paperCount: number;
}

// ========== 引导实体 ==========

/** 引导步骤 ID */
export type OnboardingStepId = 'api-key' | 'preferences' | 'tour' | 'sample';

/** 引导步骤 */
export interface OnboardingStep {
  readonly id: OnboardingStepId;
  readonly completed: boolean;
}

/** 示例数据项 */
export interface SampleDataItem {
  readonly name: string;
  readonly type: 'literature' | 'essay' | 'paper-outline' | 'experiment';
  readonly icon: string;
}

/** 引导进度 */
export interface OnboardingProgress {
  readonly steps: Record<OnboardingStepId, boolean>;
  readonly sampleDataLoaded: boolean;
}

// ========== Landing 页面实体 ==========

/** Landing 功能卡片 */
export interface LandingFeature {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly colorClass: string;
}

/** Landing 场景卡片 */
export interface LandingScenario {
  readonly number: number;
  readonly title: string;
  readonly description: string;
}

/** Landing 模型 */
export interface LandingModel {
  readonly name: string;
  readonly color: string;
}

/** 下载平台 */
export type Platform = 'windows' | 'macos' | 'linux';

/** 下载链接 */
export interface DownloadLink {
  readonly platform: Platform;
  readonly url: string;
  readonly label: string;
}
