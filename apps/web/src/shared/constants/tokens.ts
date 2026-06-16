/** 设计令牌常量 - 从 HTML 原型提取的 oklch 色值 */

export const COLORS = {
  bg: 'oklch(99% 0.002 240)',
  surface: 'oklch(100% 0 0)',
  fg: 'oklch(18% 0.012 250)',
  muted: 'oklch(54% 0.012 250)',
  border: 'oklch(92% 0.005 250)',
  borderStrong: 'oklch(86% 0.006 250)',
  accent: 'oklch(58% 0.18 255)',
  accentHover: 'oklch(52% 0.20 255)',
  success: 'oklch(65% 0.18 142)',
  warning: 'oklch(75% 0.15 85)',
  danger: 'oklch(55% 0.22 20)',
  highlightBlue: 'oklch(85% 0.12 255)',
  highlightYellow: 'oklch(90% 0.12 95)',
  highlightGreen: 'oklch(85% 0.15 145)',
  highlightPurple: 'oklch(82% 0.14 300)',
  highlightRed: 'oklch(85% 0.14 25)',
} as const;

export const LAYOUT = {
  sidebarWidth: 52,
  tabBarHeight: 36,
  statusBarHeight: 28,
  resizeHandleWidth: 9,
  minPanelWidth: 180,
  maxPanelWidth: 600,
} as const;

export const STORAGE_KEYS = {
  panelWidths: 'nr-shared-panels',
  viewMode: 'lit-mgr-view',
  theme: 'nr-theme',
  onboarding: 'nr-onboarding',
} as const;
