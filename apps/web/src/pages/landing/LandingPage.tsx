/** Landing 营销页面 — 1:1 还原原始 HTML */

const FEATURES = [
  { icon: '📚', color: 'c1', title: '文献管理', desc: '批量导入 PDF，自动提取元数据与 AI 摘要。标签、收藏夹、引用格式一键生成。' },
  { icon: '📖', color: 'c2', title: '文献阅读', desc: '内嵌 PDF 阅读器，高亮批注，Markdown 笔记。AI 辅助理解论文，公式识别与解析。' },
  { icon: '📝', color: 'c3', title: '随笔', desc: 'Markdown 写作 + AI 对话 + 知识图谱。AI 可直接编辑你的草稿，灵感随时记录。' },
  { icon: '✏️', color: 'c4', title: '论文写作', desc: 'LaTeX 编辑器 + 实时 PDF 预览。AI 润色、改写、扩写，支持主流学术模板。' },
  { icon: '🧪', color: 'c5', title: '实验复现', desc: '结构化实验记录，步骤可复现。AI 辅助分析实验结果，生成实验报告。' },
  { icon: '🤖', color: 'c6', title: '模型聚合网关', desc: '7+ 主流大模型统一接入。智能路由、成本监控、Token 用量分析。' },
];

const SCENARIOS = [
  { num: '01', title: '完成文献综述', desc: '从文献搜索到综述撰写，AI 辅助每一个环节。自动整理引用，生成结构化综述框架。' },
  { num: '02', title: '复现一篇论文', desc: '结构化记录复现步骤，AI 帮助理解关键公式和算法，追踪每个实验细节。' },
  { num: '03', title: '管理 API 成本', desc: '统一管理多个 AI 提供商，实时监控使用费用，智能选择最优模型。' },
];

const MODELS = [
  { name: 'GPT-4o', color: 'oklch(60% 0.16 142)' },
  { name: 'Claude 4 Opus', color: 'oklch(60% 0.16 300)' },
  { name: 'Claude 4 Sonnet', color: 'oklch(60% 0.14 280)' },
  { name: 'DeepSeek R1', color: 'oklch(60% 0.16 255)' },
  { name: 'Qwen3 Max', color: 'oklch(60% 0.16 200)' },
  { name: 'Gemini 2.5 Pro', color: 'oklch(60% 0.16 85)' },
  { name: 'ERNIE 4.5', color: 'oklch(60% 0.14 20)' },
  { name: 'Kimi', color: 'oklch(60% 0.14 170)' },
];

export function LandingPage() {
  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'var(--bg)', overflow: 'auto' }}>
      {/* Nav */}
      <nav className="nav">
        <a href="/landing" className="nav-logo">
          <span className="nav-logo-icon">N</span> NexusResearch
        </a>
        <div className="nav-links">
          <a href="#features">功能</a>
          <a href="#scenarios">场景</a>
          <a href="#models">模型</a>
          <a href="#oss">开源</a>
          <a href="https://github.com/nexusresearch" target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <div className="nav-actions">
          <a href="/welcome" className="btn btn-ghost">在线体验</a>
          <a href="#download" className="btn btn-primary">免费下载</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge"><span className="dot" /> v1.0 即将发布 · MIT 开源</div>
        <h1>让每一项研究<br />因 AI 而加速</h1>
        <p>面向学术研究者的一站式 AI 科研助手。从文献管理、实验设计到论文产出，全流程智能辅助，开箱即用。</p>
        <div className="hero-actions">
          <a href="#download" className="btn btn-primary btn-large">免费下载</a>
          <a href="/welcome" className="btn btn-ghost btn-large">在线体验</a>
          <a href="https://github.com/nexusresearch" className="btn btn-ghost btn-large" target="_blank" rel="noreferrer">GitHub ↗</a>
        </div>
        <div className="hero-device">
          <div className="hero-device-bar"><span className="d" /><span className="d" /><span className="d" /></div>
          <div className="hero-screenshot">
            <div className="sidebar-mock">
              <div className="icon active">📚</div>
              <div className="icon">📖</div>
              <div className="icon">📝</div>
              <div className="icon">✏️</div>
              <div className="icon">🔬</div>
            </div>
            <div className="main-mock">
              <div className="mock-search">🔍 搜索标题、作者、摘要…</div>
              <div className="mock-cards">
                <div className="mock-card">
                  <div className="title" /><div className="line" /><div className="line short" />
                  <div className="tag-row"><div className="tag accent" /><div className="tag" /></div>
                </div>
                <div className="mock-card">
                  <div className="title" /><div className="line" /><div className="line short" />
                  <div className="tag-row"><div className="tag" /><div className="tag accent" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" id="features">
        <div className="section-label">核心功能</div>
        <h2>覆盖科研全流程</h2>
        <p className="sub">从文献调研到论文发表，每个环节都有 AI 辅助。</p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className={`f-icon ${f.color}`}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scenarios */}
      <section className="section" id="scenarios" style={{ background: 'var(--surface)', maxWidth: '100%', padding: '80px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="section-label">使用场景</div>
          <h2>为研究者设计</h2>
          <div className="scenario-cards">
            {SCENARIOS.map((s) => (
              <div key={s.num} className="scenario-card">
                <div className="number">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Models */}
      <section className="section" id="models">
        <div className="section-label">模型支持</div>
        <h2>7+ 主流模型，统一接入</h2>
        <div className="model-grid">
          {MODELS.map((m) => (
            <div key={m.name} className="model-chip">
              <span className="m-dot" style={{ background: m.color }} />
              {m.name}
            </div>
          ))}
        </div>
      </section>

      {/* Open Source */}
      <section className="section" id="oss">
        <div className="oss-banner">
          <h3>MIT 协议，完全开源</h3>
          <p>自由使用、修改和分发</p>
          <div className="code">git clone https://github.com/nexusresearch/nexusresearch.git</div>
        </div>
      </section>

      {/* Download */}
      <section className="cta-section" id="download">
        <h2>立即下载</h2>
        <p>v1.0.0 · 约 150 MB</p>
        <div className="hero-actions">
          <a href="#" className="btn btn-primary btn-large">Windows (.exe)</a>
          <a href="#" className="btn btn-ghost btn-large">macOS (.dmg)</a>
          <a href="#" className="btn btn-ghost btn-large">Linux (.AppImage)</a>
        </div>
      </section>

      {/* Footer */}
      <div className="footer">
        © 2026 NexusResearch. MIT License.
      </div>
    </div>
  );
}
