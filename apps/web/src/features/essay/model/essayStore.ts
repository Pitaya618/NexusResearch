/**
 * 随笔 store —— Zustand，从后端加载真实数据，替换 mock。
 */
import { create } from 'zustand';
import { essayApi } from 'shared/lib/api';
import type { Essay } from 'shared/types';

interface EssayState {
  essays: readonly Essay[];
  loading: boolean;
  error: string | null;

  fetchList: (params?: { tag?: string; search?: string }) => Promise<void>;
  create: (data: { title: string; content: string; tag: string }) => Promise<Essay | null>;
  update: (id: string, fields: Partial<Pick<Essay, 'title' | 'content' | 'tag'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useEssayStore = create<EssayState>((set, get) => ({
  essays: [],
  loading: false,
  error: null,

  fetchList: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await essayApi.list(params);
      set({ essays: res.items, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : '加载失败' });
    }
  },

  create: async (data) => {
    try {
      const created = await essayApi.create(data);
      await get().fetchList();
      return created;
    } catch {
      return null;
    }
  },

  update: async (id, fields) => {
    try {
      const updated = await essayApi.update(id, fields);
      set((s) => ({
        essays: s.essays.map((e) => (e.id === id ? updated : e)),
      }));
    } catch {
      /* 静默失败 */
    }
  },

  remove: async (id) => {
    try {
      await essayApi.delete(id);
      set((s) => ({ essays: s.essays.filter((e) => e.id !== id) }));
    } catch {
      /* 静默失败 */
    }
  },
}));
