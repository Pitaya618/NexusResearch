/** 空状态页面 — 当没有打开的标签页时显示 */

export function EmptyStatePage() {
  return (
    <div className="empty-state-page">
      <div className="empty-state-content">
        <div className="empty-state-icon">📚</div>
        <h2>欢迎使用 NexusResearch</h2>
        <p className="empty-state-description">
          从左侧导航栏选择一个功能开始使用
        </p>
        <div className="empty-state-actions">
          <div className="empty-state-hint">
            <span className="hint-icon">📄</span>
            <span>点击 <strong>文献管理</strong> 浏览和管理您的文献</span>
          </div>
          <div className="empty-state-hint">
            <span className="hint-icon">✏️</span>
            <span>点击 <strong>随笔</strong> 记录您的研究想法</span>
          </div>
          <div className="empty-state-hint">
            <span className="hint-icon">📝</span>
            <span>点击 <strong>论文写作</strong> 撰写学术论文</span>
          </div>
        </div>
      </div>
    </div>
  );
}
