/**
 * 文献 store —— Zustand，从后端加载真实数据，替换 mock。
 *
 * 职责：
 * - 列表（带过滤分页，参数推送到后端）
 * - 详情（按需加载完整 Literature）
 * - 统计
 * - 创建/更新/删除/批量操作
 */
import { create } from 'zustand';
import { literatureApi } from 'shared/lib/api';
import type {
  Literature,
  LiteratureListItem,
  LiteratureOverviewStats,
} from 'shared/types';

/** 后端返回的统计结构（含更多字段） */
interface ServerStats {
  total: number;
  favoriteCount: number;
  readCount: number;
  unreadCount: number;
  withAiSummary: number;
}

interface LiteratureState {
  /** 列表项（含 abstractPreview，不含完整 abstract） */
  items: readonly LiteratureListItem[];
  /** 缓存的完整详情（按 id） */
  details: Record<number, Literature>;
  total: number;
  loading: boolean;
  error: string | null;
  /** 概览统计（从后端 total/withAiSummary 映射） */
  stats: LiteratureOverviewStats;

  /** 拉取列表（带过滤参数） */
  fetchList: (params?: {
    collectionId?: string;
    search?: string;
    isFavorite?: boolean;
    readStatus?: string;
  }) => Promise<void>;
  /** 拉取单篇详情（命中缓存则跳过） */
  fetchDetail: (id: number) => Promise<Literature | null>;
  /** 刷新统计 */
  fetchStats: () => Promise<void>;
  /** 创建文献 */
  create: (data: Partial<Literature>) => Promise<Literature | null>;
  /** 更新文献 */
  update: (id: number, fields: Partial<Literature>) => Promise<void>;
  /** 删除文献 */
  remove: (id: number) => Promise<void>;
  /** 批量操作 */
  bulkAction: (
    ids: number[],
    action: 'delete' | 'markAsRead' | 'markAsUnread' | 'addFavorite' | 'removeFavorite',
  ) => Promise<void>;
}

export const useLiteratureStore = create<LiteratureState>((set, get) => ({
  items: [],
  details: {},
  total: 0,
  loading: false,
  error: null,
  stats: { total: 0, addedThisMonth: 0, withAiSummary: 0 },

  fetchList: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await literatureApi.list(params);
      set({ items: res.items, total: res.total, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : '加载失败' });
    }
  },

  fetchDetail: async (id) => {
    const cached = get().details[id];
    if (cached) return cached;
    try {
      const detail = await literatureApi.detail(id);
      set((s) => ({ details: { ...s.details, [id]: detail } }));
      return detail;
    } catch {
      return null;
    }
  },

  fetchStats: async () => {
    try {
      const s: ServerStats = await literatureApi.stats();
      set({
        stats: {
          total: s.total,
          addedThisMonth: 0, // 后端暂未提供，留 0
          withAiSummary: s.withAiSummary,
        },
      });
    } catch {
      /* 静默失败 */
    }
  },

  create: async (data) => {
    try {
      const created = await literatureApi.create(data);
      await get().fetchList();
      await get().fetchStats();
      return created;
    } catch {
      return null;
    }
  },

  update: async (id, fields) => {
    try {
      const updated = await literatureApi.update(id, fields);
      set((s) => ({
        details: { ...s.details, [id]: updated },
        // 同步更新列表项的浅字段
        items: s.items.map((it) =>
          it.id === id
            ? { ...it, ...fields, title: fields.title ?? it.title, isFavorite: fields.isFavorite ?? it.isFavorite, readStatus: fields.readStatus ?? it.readStatus }
            : it,
        ),
      }));
      await get().fetchStats();
    } catch {
      /* 静默失败 */
    }
  },

  remove: async (id) => {
    try {
      await literatureApi.delete(id);
      set((s) => {
        const details = { ...s.details };
        delete details[id];
        return {
          details,
          items: s.items.filter((it) => it.id !== id),
        };
      });
      await get().fetchStats();
    } catch {
      /* 静默失败 */
    }
  },

  bulkAction: async (ids, action) => {
    try {
      await literatureApi.bulkAction(ids, action);
      await get().fetchList();
      await get().fetchStats();
    } catch {
      /* 静默失败 */
    }
  },
}));
