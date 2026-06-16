/**
 * Provider store —— 管理后端 Provider 配置。
 */
import { create } from 'zustand';
import { providerApi, type ProviderDTO } from 'shared/lib/api';

interface ProviderState {
  providers: ProviderDTO[];
  assignments: { module: string; modelId: string; purpose: string }[];
  loading: boolean;
  testing: string | null; // 正在测试的 providerId

  fetchAll: () => Promise<void>;
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
  ) => Promise<void>;
  remove: (id: string) => Promise<void>;
  test: (id: string) => Promise<{ success: boolean; latency: number; error: string | null }>;
  setAssignment: (module: string, modelId: string) => Promise<void>;
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  providers: [],
  assignments: [],
  loading: false,
  testing: null,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const [providers, assignments] = await Promise.all([
        providerApi.list(),
        providerApi.listAssignments(),
      ]);
      set({ providers, assignments, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  upsert: async (id, data) => {
    await providerApi.upsert(id, data);
    await get().fetchAll();
  },

  remove: async (id) => {
    await providerApi.remove(id);
    await get().fetchAll();
  },

  test: async (id) => {
    set({ testing: id });
    try {
      const result = await providerApi.test(id);
      await get().fetchAll(); // 刷新连接状态
      return result;
    } finally {
      set({ testing: null });
    }
  },

  setAssignment: async (module, modelId) => {
    await providerApi.setAssignment(module, modelId);
    await get().fetchAll();
  },
}));
