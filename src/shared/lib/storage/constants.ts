/** 存储键名常量 */
export const STORAGE_KEY_PREFIX = 'nr-';

export const STORAGE_KEYS = {
  panelWidths: `${STORAGE_KEY_PREFIX}shared-panels`,
  viewMode: `${STORAGE_KEY_PREFIX}lit-mgr-view`,
  theme: `${STORAGE_KEY_PREFIX}theme`,
  onboarding: `${STORAGE_KEY_PREFIX}onboarding`,
  essays: `${STORAGE_KEY_PREFIX}essays`,
  annotations: `${STORAGE_KEY_PREFIX}annotations`,
  providers: `${STORAGE_KEY_PREFIX}providers`,
} as const;
