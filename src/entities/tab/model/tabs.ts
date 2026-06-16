/** 标签页状态管理 */
import { create } from 'zustand';
import type { Tab } from 'shared/types';

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (tab: Tab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
}

export const useTabStore = create<TabStore>((set) => ({
  tabs: [],
  activeTabId: null,

  openTab: (tab) =>
    set((state) => {
      const exists = state.tabs.find((t) => t.id === tab.id);
      if (exists) {
        return {
          tabs: state.tabs.map((t) => ({ ...t, isActive: t.id === tab.id })),
          activeTabId: tab.id,
        };
      }
      return {
        tabs: [...state.tabs.map((t) => ({ ...t, isActive: false })), { ...tab, isActive: true }],
        activeTabId: tab.id,
      };
    }),

  closeTab: (tabId) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== tabId);
      // 如果关闭后没有标签页，返回空状态
      if (newTabs.length === 0) {
        return { tabs: [], activeTabId: null };
      }
      const wasActive = state.activeTabId === tabId;
      const newActive = wasActive ? newTabs[newTabs.length - 1]! : state.tabs.find((t) => t.isActive);
      return {
        tabs: newTabs.map((t) => ({ ...t, isActive: t.id === (newActive?.id ?? newTabs[0]!.id) })),
        activeTabId: newActive?.id ?? newTabs[0]!.id,
      };
    }),

  setActiveTab: (tabId) =>
    set((state) => ({
      tabs: state.tabs.map((t) => ({ ...t, isActive: t.id === tabId })),
      activeTabId: tabId,
    })),
}));
