/** 技能市场页面 — 从后端加载真实 Skills 数据 + 安装 */
import { useState, useEffect, useCallback } from 'react';
import { skillApi, type SkillDTO } from 'shared/lib/api';
import type { SkillsNavSection } from 'shared/types';

export function SkillsPage() {
  const [activeNav, setActiveNav] = useState<SkillsNavSection>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [skills, setSkills] = useState<SkillDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await skillApi.list({ search: searchQuery.trim() || undefined });
      setSkills(res.items);
    } catch {
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleInstall = useCallback(async (skillId: string) => {
    setInstalling(skillId);
    try {
      await skillApi.install(skillId);
      await fetchSkills();
    } finally {
      setInstalling(null);
    }
  }, [fetchSkills]);

  const handleExecute = useCallback(async (skill: SkillDTO) => {
    // 简单执行：弹出输入框获取变量（MVP；后续做正式 UI）
    const input = prompt(`执行 Skill「${skill.name}」\n请输入要处理的文本：`);
    if (!input) return;
    try {
      const res = await skillApi.execute(skill.id, { selected_text: input, text: input, content: input });
      alert(res.result);
    } catch (e) {
      alert(`执行失败：${e instanceof Error ? e.message : '未知错误'}`);
    }
  }, []);

  const filtered = skills.filter((s) => {
    if (activeNav !== 'all' && activeNav !== 'installed' && activeNav !== 'updates' && !s.module.includes(activeNav)) return false;
    if (activeNav === 'installed' && s.status !== 'installed') return false;
    if (activeNav === 'updates' && !s.latestVersion) return false;
    if (activeFilter !== 'all' && !s.category.includes(activeFilter)) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // 各模块计数
  const countByModule = (mod: string) => skills.filter((s) => s.module.includes(mod)).length;

  return (
    <div className="skills-layout">
      <div className="skills-nav">
        <div className="skills-nav-title">按模块</div>
        {[
          { id: 'all' as const, label: '全部 Skills', count: skills.length },
          { id: 'literature' as const, label: '文献管理', count: countByModule('literature') },
          { id: 'reader' as const, label: '文献阅读', count: countByModule('reader') },
          { id: 'essay' as const, label: '随笔', count: countByModule('essay') },
          { id: 'paper' as const, label: '论文写作', count: countByModule('paper') },
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

        {loading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中…</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>暂无 Skills</div>
        )}

        {filtered.map((skill) => (
          <div key={skill.id} className="skill-card">
            <div className="skill-icon" style={{ background: 'oklch(96% 0.006 250)' }}>{skill.icon}</div>
            <div className="skill-info">
              <div className="skill-name">{skill.name}</div>
              <div className="skill-desc">{skill.description}</div>
              <div className="skill-meta">
                {skill.category.map((c) => <span key={c} className="skill-tag">{c}</span>)}
                {skill.module.map((m) => <span key={m} className="skill-tag module">{m}</span>)}
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>v{skill.version}</span>
              </div>
            </div>
            <div className="skill-actions">
              {skill.status === 'installed' ? (
                <>
                  <span className="skill-status installed">已安装</span>
                  <button className="btn-sm" style={{ marginTop: 4 }} onClick={() => handleExecute(skill)}>▶ 执行</button>
                </>
              ) : (
                <button
                  className="btn-sm primary"
                  disabled={installing === skill.id}
                  onClick={() => handleInstall(skill.id)}
                >
                  {installing === skill.id ? '安装中…' : '安装'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
