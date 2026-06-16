/** 表单数据类型定义 */
import type {
  AnnotationType,
  CompatibilityType,
  DiffAction,
  EssayTag,
  HighlightColor,
  ModuleType,
  NoteTemplate,
  PolishMode,
  ProxyType,
} from './entities';
import type { FontSize, SortField, Theme } from './ui';
import type { SortDirection } from './common';

/** API Key 表单数据 */
export interface ApiKeyFormData {
  readonly vendor: string;
  readonly apiKey: string;
  readonly interfaceStyle: 'openai' | 'anthropic';
  readonly note: string;
}

/** 偏好设置表单数据 */
export interface PreferencesFormData {
  readonly theme: Theme;
  readonly fontSize: FontSize;
  readonly bodyFont: string;
  readonly codeFont: string;
  readonly language: string;
}

/** 添加提供商表单数据 */
export interface AddProviderFormData {
  readonly name: string;
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly compatibilityType: CompatibilityType;
}

/** 代理表单数据 */
export interface ProxyFormData {
  readonly enabled: boolean;
  readonly type: ProxyType;
  readonly host: string;
  readonly port: number;
  readonly auth: string;
}

/** 文献搜索表单数据 */
export interface LiteratureSearchFormData {
  readonly query: string;
  readonly sortField: SortField;
  readonly sortDirection: SortDirection;
}

/** 随笔表单数据 */
export interface EssayFormData {
  readonly title: string;
  readonly content: string;
  readonly tag: EssayTag;
}

/** 笔记表单数据 */
export interface NoteFormData {
  readonly content: string;
  readonly template: NoteTemplate | null;
  readonly literatureId: number;
}

/** 批注表单数据 */
export interface AnnotationFormData {
  readonly type: AnnotationType;
  readonly color: HighlightColor;
  readonly page: number;
  readonly quotedText: string;
  readonly note: string;
}

/** 导出表单数据 */
export interface ExportFormData {
  readonly exportPath: string;
  readonly includeLiterature: boolean;
  readonly includeEssays: boolean;
  readonly includePapers: boolean;
  readonly includeSettings: boolean;
}

/** 导入表单数据 */
export interface ImportFormData {
  readonly filePath: string;
  readonly overrideSettings: boolean;
  readonly mergeLiterature: boolean;
}

/** 模块模型表单数据 */
export interface ModuleModelFormData {
  readonly module: ModuleType;
  readonly modelId: string;
}

/** 润色表单数据 */
export interface PolishFormData {
  readonly selectedText: string;
  readonly mode: PolishMode;
}
