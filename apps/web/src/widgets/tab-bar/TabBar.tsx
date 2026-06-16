/** 标签栏 — 1:1 还原原始 HTML 结构 */
import { useTabStore } from 'entities/tab/model/tabs';
import { useNavigate } from 'react-router-dom';

/** 静态路由映射 */
const STATIC_ROUTE_PATHS: Record<string, string> = {
  'literature-manager': '/app/literature',
  essay: '/app/essay',
  'paper-editor': '/app/paper',
  settings: '/app/settings',
  skills: '/app/skills',
};

/** 获取路由路径，支持动态参数 */
function getRoutePath(route: string, params?: Record<string, string>): string {
  // 检查静态路由
  if (STATIC_ROUTE_PATHS[route]) {
    return STATIC_ROUTE_PATHS[route];
  }
  // 处理动态路由（如 literature-reader）
  if (route === 'literature-reader' && params?.id) {
    return `/app/literature/${params.id}`;
  }
  return '/';
}

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();
  const navigate = useNavigate();

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      const path = getRoutePath(tab.route, tab.params);
      if (path) navigate(path);
    }
  };

  const handleClose = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // 找到当前标签页在列表中的位置
    const currentIndex = tabs.findIndex((t) => t.id === tabId);
    // 关闭标签页
    closeTab(tabId);
    // 如果关闭的是当前活动标签页，导航到上一个标签页
    if (activeTabId === tabId && tabs.length > 1) {
      // 计算新的活动标签页索引（关闭后的上一个）
      const newIndex = currentIndex > 0 ? currentIndex - 1 : 1;
      const newActiveTab = tabs[newIndex];
      if (newActiveTab && newActiveTab.id !== tabId) {
        const path = getRoutePath(newActiveTab.route, newActiveTab.params);
        if (path) navigate(path);
      }
    }
  };

  return (
    <div className="tab-bar" id="tab-bar">
      {tabs.map((tab) => (
        <a
          key={tab.id}
          href="#"
          className={`tab${tab.isActive ? ' active' : ''}`}
          onClick={(e) => { e.preventDefault(); handleTabClick(tab.id); }}
        >
          <span className="t-icon">{tab.icon}</span>
          <span className="t-title">{tab.title}</span>
          {tab.closable && (
            <button
              className="t-close"
              onClick={(e) => handleClose(e, tab.id)}
              title="关闭"
            >
              ×
            </button>
          )}
        </a>
      ))}
    </div>
  );
}
