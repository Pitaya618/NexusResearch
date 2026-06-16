/** 类型安全的 localStorage 封装 */
import { STORAGE_KEY_PREFIX } from './constants';

class LocalStore {
  /** 读取 */
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /** 写入 */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.error('localStorage 配额已满，请清理数据');
      }
    }
  }

  /** 删除 */
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /** 清除所有应用数据 */
  clearAll(): void {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_KEY_PREFIX));
    keys.forEach((k) => localStorage.removeItem(k));
  }
}

export const localStore = new LocalStore();
