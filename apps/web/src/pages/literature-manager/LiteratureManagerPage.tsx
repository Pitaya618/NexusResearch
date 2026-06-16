/** 文献管理页面 — 从后端加载真实数据（替换 mock） */
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SAMPLE_COLLECTIONS, SAMPLE_TAGS } from 'entities/literature/model/literature';
import { ResizableLayout } from 'widgets/resizable-layout/ResizableLayout';
import { useTabStore } from 'entities/tab/model/tabs';
import { useLiteratureStore } from 'features/literature/model/literatureStore';
import type { Literature, DetailTab, CitationFormat, ViewMode } from 'shared/types';

export function LiteratureManagerPage() {
  const { openTab } = useTabStore();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCollection, setActiveCollection] = useState('all');
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('abstract');

  const { items, stats, loading, fetchList, fetchDetail, fetchStats, remove } = useLiteratureStore();

  // 初次加载 + 过滤条件变化时重新拉取
  useEffect(() => {
    const params: { collectionId?: string; search?: string } = {};
    if (activeCollection !== 'all') params.collectionId = activeCollection;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    fetchList(params);
  }, [fetchList, activeCollection, searchQuery]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 选中文献时加载完整详情
  const selectedLit = useMemo(() => {
    if (selectedId === null) return null;
    const item = items.find((l) => l.id === selectedId);
    return item ?? null;
  }, [items, selectedId]);

  // 选中后异步加载完整详情（含 abstract/aiSummary）
  const [fullDetail, setFullDetail] = useState<Literature | null>(null);
  useEffect(() => {
    setFullDetail(null);
    if (selectedId !== null) {
      fetchDetail(selectedId).then((d) => setFullDetail(d));
    }
  }, [selectedId, fetchDetail]);

  const handleCopy = useCallback((text: string) => { navigator.clipboard.writeText(text).catch(() => {}); }, []);

  /** 打开文献阅读标签页 */
  const handleOpenReader = useCallback((lit: { id: number; title: string }) => {
    openTab({
      id: `reader-${lit.id}`,
      route: 'literature-reader',
      title: lit.title.length > 20 ? lit.title.slice(0, 20) + '...' : lit.title,
      icon: '📖',
      isActive: true,
      closable: true,
      params: { id: String(lit.id) },
    });
    navigate(`/app/literature/${lit.id}`);
  }, [openTab, navigate]);

  const handleDelete = useCallback(async (id: number) => {
    await remove(id);
    setSelectedId(null);
  }, [remove]);

  const leftPanel = (
    <div className="left-panel">
      <div className="panel-section">
        <h4>收藏夹</h4>
        {SAMPLE_COLLECTIONS.map((c) => (
          <div
            key={c.id}
            className={`collection-item${activeCollection === c.id ? ' active' : ''}`}
            onClick={() => setActiveCollection(c.id)}
          >
            <span>{c.icon} {c.name}</span>
            <span className="count">{c.id === 'all' ? stats.total : ''}</span>
          </div>
        ))}
      </div>
      <div className="panel-section">
        <h4>标签</h4>
        {SAMPLE_TAGS.map((t) => (
          <div key={t.id} className="tag-row">
            <span className="tag-dot" style={{ background: t.color }} />
            {t.name}
            <span className="count">{t.count}</span>
          </div>
        ))}
      </div>
      <div className="panel-section">
        <h4>概览</h4>
        <div className="overview-stats">
          <div className="stat-row"><span>总计</span><span className="val">{stats.total}</span></div>
          <div className="stat-row"><span>本月新增</span><span className="val">{stats.addedThisMonth}</span></div>
          <div className="stat-row"><span>有 AI 摘要</span><span className="val">{stats.withAiSummary}</span></div>
        </div>
      </div>
    </div>
  );

  const centerPanel = (
    <div className="center-panel">
      <div className="center-toolbar">
        <input
          className="search-input"
          placeholder="搜索标题、作者、摘要…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="segmented-control">
          <span className={`segment-option${viewMode === 'card' ? ' active' : ''}`} onClick={() => setViewMode('card')}>卡片</span>
          <span className={`segment-option${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')}>列表</span>
        </div>
        <button className="toolbar-btn">📥 导入</button>
        <select className="toolbar-btn" style={{ fontSize: 12 }}>
          <option>按年份 ↓</option>
          <option>按标题</option>
          <option>按导入时间</option>
        </select>
      </div>

      {loading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中…</div>}

      {!loading && items.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          暂无文献{searchQuery ? `匹配「${searchQuery}」` : ''}
        </div>
      )}

      {!loading && viewMode === 'card' && (
        <div className="lit-list">
          {items.map((lit) => (
            <div
              key={lit.id}
              className={`lit-card${lit.id === selectedId ? ' selected' : ''}`}
              onClick={() => setSelectedId(lit.id)}
              onDoubleClick={() => handleOpenReader(lit)}
            >
              <div className="lit-cover">📄</div>
              <div className="lit-info">
                <h3>{lit.title}</h3>
                <div className="lit-meta">{lit.authors.split(',')[0]} · {lit.journal} · {lit.year}</div>
                <div className="lit-abstract">{lit.abstractPreview}</div>
                <div className="lit-tags">
                  {lit.tags.map((t) => <span key={t} className="lit-tag">{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && viewMode === 'list' && (
        <div className="lit-table">
          <div className="lit-table-header">
            <span className="col-title sort-arrow">标题 ▾</span>
            <span className="col-authors">作者</span>
            <span className="col-journal">期刊</span>
            <span className="col-year">年份</span>
            <span className="col-tags">标签</span>
            <span className="col-status">状态</span>
          </div>
          {items.map((lit) => (
            <div
              key={lit.id}
              className={`lit-table-row${lit.id === selectedId ? ' selected' : ''}`}
              onClick={() => setSelectedId(lit.id)}
              onDoubleClick={() => handleOpenReader(lit)}
            >
              <span className="col-title">{lit.title}</span>
              <span className="col-authors">{lit.authors.split(',')[0]}</span>
              <span className="col-journal">{lit.journal}</span>
              <span className="col-year">{lit.year}</span>
              <span className="col-tags">
                {lit.tags.map((t) => <span key={t} className="lit-tag">{t}</span>)}
              </span>
              <span className="col-status">
                <span className={`dot${lit.readStatus === 'read' ? ' read' : ' unread'}`} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const detailLit = fullDetail ?? selectedLit;
  const rightPanel = detailLit ? (
    <div className="right-panel">
      <div className="detail-header">
        <h2>{detailLit.title}</h2>
        <div className="authors">{detailLit.authors}</div>
        <div className="venue">{detailLit.journal} · {detailLit.year}</div>
      </div>
      <div className="detail-tabs">
        {(['abstract', 'aiSummary', 'notes', 'citations'] as DetailTab[]).map((tab) => (
          <div
            key={tab}
            className={`detail-tab${activeDetailTab === tab ? ' active' : ''}`}
            onClick={() => setActiveDetailTab(tab)}
          >
            {{ abstract: '原摘要', aiSummary: 'AI 摘要', notes: '笔记', citations: '引用' }[tab]}
          </div>
        ))}
      </div>
      <div className="detail-body">
        {activeDetailTab === 'abstract' && (
          <p>{'abstract' in detailLit ? detailLit.abstract : detailLit.abstractPreview}</p>
        )}
        {activeDetailTab === 'aiSummary' && (
          <p>{'aiSummary' in detailLit ? detailLit.aiSummary : '（加载中…）'}</p>
        )}
        {activeDetailTab === 'notes' && <p>暂无笔记</p>}
        {activeDetailTab === 'citations' && (
          <>
            {(['apa', 'mla', 'gbt7714'] as CitationFormat[]).map((fmt) => (
              <div key={fmt} className="cite-block">
                <div className="cite-format">{fmt.toUpperCase()}</div>
                <button className="copy-btn" onClick={() => handleCopy(`${detailLit.authors}. ${detailLit.title}. ${detailLit.journal}, ${detailLit.year}.`)}>复制</button>
                {detailLit.authors}. {detailLit.title}. <em>{detailLit.journal}</em>, {detailLit.year}.
              </div>
            ))}
          </>
        )}
      </div>
      <div className="detail-actions">
        <button className="btn btn-ghost">📋 复制引用</button>
        <button className="btn btn-danger" onClick={() => handleDelete(detailLit.id)}>🗑 删除</button>
      </div>
    </div>
  ) : (
    <div className="right-panel">
      <div className="detail-empty">
        <div className="icon">📋</div>
        <p style={{ fontWeight: 500 }}>选择一篇文献查看详情</p>
        <p>点击左侧列表中的文献</p>
      </div>
    </div>
  );

  return (
    <ResizableLayout
      storageKey="nr-lit-mgr-panels"
      panels={[
        { id: 'left', content: leftPanel, defaultWidth: 240, minWidth: 200, maxWidth: 320, className: 'left-panel' },
        { id: 'center', content: centerPanel, defaultWidth: 500, minWidth: 280, className: 'center-panel', flex: true },
        { id: 'right', content: rightPanel, defaultWidth: 340, minWidth: 260, maxWidth: 500, className: 'right-panel' },
      ]}
    />
  );
}
