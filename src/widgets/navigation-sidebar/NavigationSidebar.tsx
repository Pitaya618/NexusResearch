/** 导航侧边栏 — 1:1 还原原始 HTML 结构 */
import { useLocation, useNavigate } from 'react-router-dom';
import { SIDEBAR_ITEMS, SIDEBAR_BOTTOM_ITEMS } from 'shared/constants';
import { useTabStore } from 'entities/tab/model/tabs';

/** 侧边栏项到 Tab 的映射 */
const SIDEBAR_TAB_MAP: Record<string, { id: string; route: string; title: string; icon: string }> = {
  '/app/literature': { id: 'literature', route: 'literature-manager', title: '文献管理', icon: '📚' },
  '/app/essay': { id: 'essay', route: 'essay', title: '随笔', icon: '✏️' },
  '/app/paper': { id: 'paper', route: 'paper-editor', title: '论文写作', icon: '📝' },
  '/app/settings': { id: 'settings', route: 'settings', title: '设置', icon: '⚙️' },
  '/app/skills': { id: 'skills', route: 'skills', title: 'Skill 管理', icon: '🧩' },
};

export function NavigationSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { openTab } = useTabStore();

  const isActive = (href: string) => {
    // 精确匹配
    if (location.pathname === href) return true;
    // 其他路由使用前缀匹配（如 /app/essay 匹配 /app/essay/123）
    return location.pathname.startsWith(href + '/');
  };

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    navigate(href);
    // 创建或激活对应的 Tab
    const tabConfig = SIDEBAR_TAB_MAP[href];
    if (tabConfig) {
      openTab({
        ...tabConfig,
        isActive: true,
        closable: true,
      });
    }
  };

  return (
    <div className="sidebar" id="global-sidebar">
      <div className="sidebar-nav">
        {SIDEBAR_ITEMS.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`sidebar-item${isActive(item.href) ? ' active' : ''}`}
            data-tooltip={item.tooltip}
            title={item.tooltip}
            onClick={(e) => handleNavClick(e, item.href)}
          >
            {item.icon}
          </a>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div className="sidebar-nav">
        {SIDEBAR_BOTTOM_ITEMS.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`sidebar-item${isActive(item.href) ? ' active' : ''}`}
            data-tooltip={item.tooltip}
            title={item.tooltip}
            onClick={(e) => handleNavClick(e, item.href)}
          >
            {item.icon}
          </a>
        ))}
      </div>
    </div>
  );
}
