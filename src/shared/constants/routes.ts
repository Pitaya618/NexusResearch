/** 路由路径常量 */

export const ROUTES = {
  landing: '/landing',
  welcome: '/welcome',
  app: '/app',
  literature: '/app/literature',
  literatureReader: '/app/literature/:id',
  essay: '/app/essay',
  essayDetail: '/app/essay/:id',
  paper: '/app/paper',
  paperDetail: '/app/paper/:id',
  settings: '/app/settings',
  settingsTab: '/app/settings/:tab',
  skills: '/app/skills',
  skillsSection: '/app/skills/:section',
} as const;

/** 侧边栏导航项定义 */
export const SIDEBAR_ITEMS = [
  { id: 'literature-manager' as const, icon: '📚', tooltip: '文献管理', href: '/app/literature' },
  { id: 'essay' as const, icon: '✏️', tooltip: '随笔', href: '/app/essay' },
  { id: 'paper-editor' as const, icon: '📝', tooltip: '论文写作', href: '/app/paper' },
] as const;

export const SIDEBAR_BOTTOM_ITEMS = [
  { id: 'skills' as const, icon: '🧩', tooltip: 'Skill 管理', href: '/app/skills' },
  { id: 'settings' as const, icon: '⚙️', tooltip: '设置', href: '/app/settings' },
] as const;
