/** 技能市场页面 — 1:1 还原原始 HTML */
import { useState } from 'react';
import type { SkillsNavSection, SkillCategory } from 'shared/types';

const SKILLS = [
  { id: '1', name: '文献计量分析', desc: '分析文献引用网络和合作关系', icon: '📊', category: ['文献'] as SkillCategory[], module: 'literature', installed: true, version: '1.2.0' },
  { id: '2', name: '智能摘要生成', desc: 'AI 自动生成文献摘要', icon: '🤖', category: ['文献'] as SkillCategory[], module: 'literature', installed: true, version: '2.0.1' },
  { id: '3', name: '自动标签分类', desc: '基于内容自动打标签', icon: '🏷️', category: ['文献'] as SkillCategory[], module: 'literature', installed: true, version: '1.1.0' },
  { id: '4', name: '语义搜索', desc: '基于语义的文献搜索', icon: '🔍', category: ['文献'] as SkillCategory[], module: 'literature', installed: false, version: '1.0.0' },
  { id: '5', name: '论文问答增强', desc: 'AI 增强的论文问答', icon: '💬', category: ['阅读'] as SkillCategory[], module: 'reader', installed: true, version: '1.3.0' },
  { id: '6', name: '公式识别 OCR', desc: '识别 PDF 中的数学公式', icon: '📐', category: ['阅读'] as SkillCategory[], module: 'reader', installed: false, version: '0.9.0' },
  { id: '7', name: '阅读笔记模板', desc: '结构化笔记模板库', icon: '📋', category: ['阅读'] as SkillCategory[], module: 'reader', installed: true, version: '1.0.2' },
  { id: '8', name: '学术润色', desc: 'AI 学术语言润色', icon: '✍️', category: ['写作'] as SkillCategory[], module: 'essay', installed: true, version: '2.1.0', hasUpdate: true },
  { id: '9', name: '改写 & 续写', desc: 'AI 改写和续写辅助', icon: '🔄', category: ['写作'] as SkillCategory[], module: 'essay', installed: true, version: '1.5.0' },
  { id: '10', name: '灵感收集器', desc: '快速收集和整理想法', icon: '💡', category: ['写作'] as SkillCategory[], module: 'essay', installed: false, version: '1.0.0' },
  { id: '11', name: '论文配图生成', desc: 'AI 生成论文配图', icon: '🎨', category: ['绘图'] as SkillCategory[], module: 'paper', installed: true, version: '1.0.0' },
  { id: '12', name: '参考文献格式化', desc: '自动格式化引用', icon: '📚', category: ['写作'] as SkillCategory[], module: 'paper', installed: true, version: '1.2.0', hasUpdate: true },
];

export function SkillsPage() {
  const [activeNav, setActiveNav] = useState<SkillsNavSection>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = SKILLS.filter((s) => {
    if (activeNav !== 'all' && activeNav !== 'installed' && activeNav !== 'updates' && s.module !== activeNav) return false;
    if (activeNav === 'installed' && !s.installed) return false;
    if (activeNav === 'updates' && !s.hasUpdate) return false;
    if (activeFilter !== 'all' && !s.category.includes(activeFilter as SkillCategory)) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="skills-layout">
      <div className="skills-nav">
        <div className="skills-nav-title">按模块</div>
        {[
          { id: 'all' as const, label: '全部 Skills', count: SKILLS.length },
          { id: 'literature' as const, label: '文献管理', count: 4 },
          { id: 'reader' as const, label: '文献阅读', count: 3 },
          { id: 'essay' as const, label: '随笔', count: 3 },
          { id: 'paper' as const, label: '论文写作', count: 2 },
        ].map((item) => (
          <button
            key={item.id}
            className={`skills-nav-item${activeNav === item.id ? ' active' : ''}`}
            onClick={() => setActiveNav(item.id)}
          >
            <span className="nav-icon">{item.id === 'all' ? '🧩' : item.id === 'literature' ? '📚' : item.id === 'reader' ? '📖' : item.id === 'essay' ? '✏️' : '📝'}</span>
            {item.label}
            <span className="skills-nav-badge">{item.count}</span>
          </button>
        ))}
        <div style={{ height: 16 }} />
        <div className="skills-nav-title">管理</div>
        <button className={`skills-nav-item${activeNav === 'installed' ? ' active' : ''}`} onClick={() => setActiveNav('installed')}>
          <span className="nav-icon">✅</span> 已安装
        </button>
        <button className={`skills-nav-item${activeNav === 'updates' ? ' active' : ''}`} onClick={() => setActiveNav('updates')}>
          <span className="nav-icon">🔄</span> 可更新
          <span className="skills-nav-badge">2</span>
        </button>
      </div>

      <div className="skills-content">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索 Skills…" />
        </div>
        <div className="filter-row">
          {['all', '文献', '阅读', '写作', '数据分析', '绘图'].map((f) => (
            <button
              key={f}
              className={`filter-chip${activeFilter === f ? ' active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f === 'all' ? '全部' : f}
            </button>
          ))}
        </div>

        {filtered.map((skill) => (
          <div key={skill.id} className="skill-card">
            <div className="skill-icon" style={{ background: 'oklch(96% 0.006 250)' }}>{skill.icon}</div>
            <div className="skill-info">
              <div className="skill-name">{skill.name}</div>
              <div className="skill-desc">{skill.desc}</div>
              <div className="skill-meta">
                {skill.category.map((c) => <span key={c} className="skill-tag">{c}</span>)}
                <span className="skill-tag module">{skill.module}</span>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>v{skill.version}</span>
              </div>
            </div>
            <div className="skill-actions">
              {skill.installed ? (
                <>
                  <span className="skill-status installed">已安装</span>
                  {skill.hasUpdate && <button className="btn-sm primary" style={{ marginTop: 4 }}>更新</button>}
                </>
              ) : (
                <button className="btn-sm primary">安装</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
