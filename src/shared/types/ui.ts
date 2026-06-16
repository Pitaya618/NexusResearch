/** UI 状态类型定义 */
import type {
  AiSubTab,
  EssayTag,
  HighlightColor,
  ReaderRightTab,
  ReaderTool,
  SkillCategory,
  SkillModule,
  SkillStatus,
  SortField,
  ReadStatus,
} from './entities';
import type { ISODateString, SortDirection } from './common';

/** 路由 ID */
export type RouteId =
  | 'literature-manager'
  | 'literature-reader'
  | 'essay'
  | 'paper-editor'
  | 'skills'
  | 'settings'
  | 'welcome'
  | 'landing'
  | 'index';

/** 侧边栏项 */
export interface SidebarItem {
  readonly id: RouteId;
  readonly icon: string;
  readonly tooltip: string;
  readonly href: string;
}

/** 侧边栏状态 */
export interface SidebarState {
  readonly activeRoute: RouteId;
  readonly items: readonly SidebarItem[];
}

/** 标签页 */
export interface Tab {
  readonly id: string;
  readonly route: RouteId;
  readonly title: string;
  readonly icon: string;
  readonly isActive: boolean;
  readonly closable: boolean;
  readonly params?: Record<string, string>;
}

/** 标签栏状态 */
export interface TabBarState {
  readonly tabs: readonly Tab[];
  readonly activeTabId: string | null;
}

/** 面板方向 */
export type PanelSide = 'left' | 'right';

/** 面板宽度配置 */
export interface PanelWidths {
  readonly sidebar?: number;
  readonly left?: number;
  readonly right?: number;
  readonly detail?: number;
  readonly fileTree?: number;
  readonly chatOpen?: boolean;
  readonly chatWidthBeforeCollapse?: number;
}

/** 视图模式 */
export type ViewMode = 'card' | 'list';

/** 搜索状态 */
export interface SearchState {
  readonly query: string;
  readonly isSearching: boolean;
}

/** 文献过滤器 */
export interface LiteratureFilter {
  readonly collectionId: string | null;
  readonly tagIds: readonly string[];
  readonly readStatus: ReadStatus | null;
  readonly isFavorite: boolean | null;
  readonly sortField: SortField;
  readonly sortDirection: SortDirection;
}

/** 技能过滤器 */
export interface SkillFilter {
  readonly category: SkillCategory | 'all';
  readonly module: SkillModule | 'all';
  readonly status: SkillStatus | 'all';
  readonly query: string;
}

/** 拖拽调整状态 */
export interface ResizingState {
  readonly isResizing: boolean;
  readonly handleId: string | null;
  readonly startX: number;
  readonly startWidth: number;
}

/** 主题 */
export type Theme = 'light' | 'dark';

/** 字体大小 */
export type FontSize = 'S' | 'M' | 'L';

/** 阅读器状态 */
export interface ReaderState {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly zoom: number;
  readonly activeTool: ReaderTool;
  readonly activeRightTab: ReaderRightTab;
}

/** 随笔编辑器状态 */
export interface EssayEditorState {
  readonly activeEssayId: string | null;
  readonly isChatOpen: boolean;
  readonly chatWidthBeforeCollapse: number;
}

/** 论文编辑器状态 */
export interface PaperEditorState {
  readonly activeProjectId: string | null;
  readonly activeFile: string | null;
  readonly activeRightView: 'pdf' | 'ai';
  readonly activeAiSubTab: AiSubTab;
}

/** 设置导航区域 */
export type SettingsNavSection = 'models-api' | 'usage' | 'proxy' | 'data' | 'about';

/** 技能导航区域 */
export type SkillsNavSection = 'all' | 'literature' | 'reader' | 'essay' | 'paper' | 'installed' | 'updates';

/** 通知类型 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/** 通知 */
export interface Notification {
  readonly id: string;
  readonly type: NotificationType;
  readonly message: string;
  readonly duration?: number;
  readonly createdAt: ISODateString;
}
