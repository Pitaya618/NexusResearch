/** 应用主布局 — 1:1 还原原始 HTML 结构: sidebar + right-wrapper(tab-bar + main + status-bar) */
import { Outlet } from 'react-router-dom';
import { NavigationSidebar } from 'widgets/navigation-sidebar/NavigationSidebar';
import { TabBar } from 'widgets/tab-bar/TabBar';
import { StatusBar } from 'widgets/status-bar/StatusBar';
import { EmptyStatePage } from 'pages/empty-state/EmptyStatePage';
import { useTabStore } from 'entities/tab/model/tabs';

export function AppLayout() {
  const { activeTabId } = useTabStore();

  return (
    <>
      <NavigationSidebar />
      <div className="right-wrapper">
        <TabBar />
        <div className="main">
          <div className="content">
            {activeTabId ? <Outlet /> : <EmptyStatePage />}
          </div>
        </div>
        <StatusBar />
      </div>
    </>
  );
}
