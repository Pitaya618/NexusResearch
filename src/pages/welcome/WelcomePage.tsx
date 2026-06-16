/** 引导页面 — 1:1 还原原始 HTML */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { OnboardingStepId } from 'shared/types';

const STEPS: { id: OnboardingStepId; title: string; desc: string; icon: string; iconClass: string; statusPending: string; statusDone: string }[] = [
  { id: 'api-key', title: '配置 API Key', desc: '添加至少一个 AI 模型的 API Key', icon: '🔑', iconClass: 'key', statusPending: '未配置', statusDone: '已配置' },
  { id: 'preferences', title: '界面偏好', desc: '选择主题、字体大小等', icon: '🎨', iconClass: 'pref', statusPending: '默认', statusDone: '已设置' },
  { id: 'tour', title: '功能概览', desc: '快速了解各模块功能', icon: '🗺️', iconClass: 'tour', statusPending: '未浏览', statusDone: '已浏览' },
  { id: 'sample', title: '加载示例数据', desc: '体验完整功能', icon: '📦', iconClass: 'data', statusPending: '未加载', statusDone: '已加载' },
];

const SAMPLE_DATA = [
  { icon: '📄', name: 'Attention Is All You Need', type: '文献' },
  { icon: '📄', name: 'BERT: Pre-training of Deep...', type: '文献' },
  { icon: '📄', name: 'Molecular Graph Generation', type: '文献' },
  { icon: '✏️', name: 'LLM 在药物发现中的应用', type: '随笔' },
  { icon: '📝', name: '基于 Transformer 的分子生成方法', type: '论文' },
  { icon: '🧪', name: 'MolGPT 复现实验', type: '实验' },
];

export function WelcomePage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<OnboardingStepId | null>(null);
  const [completed, setCompleted] = useState<Record<OnboardingStepId, boolean>>({
    'api-key': false, preferences: false, tour: false, sample: false,
  });

  const doneCount = Object.values(completed).filter(Boolean).length;
  const allDone = doneCount === 4;

  const markComplete = (step: OnboardingStepId) => {
    setCompleted((prev) => ({ ...prev, [step]: true }));
    setActiveStep(null);
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'var(--bg)', display: 'flex', overflow: 'auto' }}>
      <div className="onboarding">
        {!activeStep ? (
          <>
            <div className="ob-header">
              <div className="ob-logo">N</div>
              <h1>欢迎使用 NexusResearch</h1>
              <p>让我们花 2 分钟完成初始配置</p>
              <div className="ob-progress">
                {STEPS.map((s) => (
                  <div key={s.id} className={`dot${completed[s.id] ? ' done' : ''}`} />
                ))}
              </div>
            </div>

            <div className="ob-modules">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={`ob-module${completed[s.id] ? ' done' : ''}`}
                  onClick={() => setActiveStep(s.id)}
                >
                  <div className={`ob-mod-icon ${s.iconClass}`}>{s.icon}</div>
                  <div className="ob-mod-body">
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                  <div className={`ob-mod-status${completed[s.id] ? ' done' : ' pending'}`}>
                    <span className={`status-dot${completed[s.id] ? '' : ' off'}`} />
                    {completed[s.id] ? s.statusDone : s.statusPending}
                  </div>
                </div>
              ))}
            </div>

            <div className="ob-footer">
              <button className="btn btn-ghost" onClick={() => navigate('/app/literature')}>跳过，直接开始</button>
              <button className="btn btn-primary" disabled={!allDone} onClick={() => navigate('/app/literature')} style={{ opacity: allDone ? 1 : 0.5 }}>开始使用</button>
            </div>
          </>
        ) : activeStep === 'api-key' ? (
          <div className="step-panel" style={{ display: 'block' }}>
            <button className="step-back" onClick={() => setActiveStep(null)}>← 返回</button>
            <h2>配置 API Key</h2>
            <div className="form-group"><label>供应商</label><select><option>OpenAI</option><option>Anthropic</option><option>DeepSeek</option><option>阿里云</option><option>Google</option><option>Ollama</option><option>自定义</option></select></div>
            <div className="form-group"><label>API Key</label><input type="password" placeholder="sk-..." /></div>
            <div className="form-row">
              <div className="form-group"><label>接口风格</label><select><option>OpenAI 兼容</option><option>Anthropic 兼容</option></select></div>
              <div className="form-group"><label>备注（可选）</label><input placeholder="我的 OpenAI Key" /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="btn btn-ghost">测试连接</button>
              <button className="btn btn-primary" onClick={() => markComplete('api-key')}>添加</button>
            </div>
          </div>
        ) : activeStep === 'preferences' ? (
          <div className="step-panel" style={{ display: 'block' }}>
            <button className="step-back" onClick={() => setActiveStep(null)}>← 返回</button>
            <h2>界面偏好</h2>
            <div className="ob-module" style={{ cursor: 'default', padding: '14px 0', border: 'none', borderRadius: 0 }}>
              <div className="ob-mod-body"><h3 style={{ fontSize: 14 }}>主题</h3></div>
              <div className="theme-swatches">
                <div className="theme-swatch light active" />
                <div className="theme-swatch dark" />
              </div>
            </div>
            <div className="ob-module" style={{ cursor: 'default', padding: '14px 0', border: 'none', borderRadius: 0 }}>
              <div className="ob-mod-body"><h3 style={{ fontSize: 14 }}>字体大小</h3></div>
              <div className="font-size-btns">
                <button className="font-size-btn">S</button>
                <button className="font-size-btn active">M</button>
                <button className="font-size-btn">L</button>
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => markComplete('preferences')}>确认</button>
          </div>
        ) : activeStep === 'tour' ? (
          <div className="step-panel" style={{ display: 'block' }}>
            <button className="step-back" onClick={() => setActiveStep(null)}>← 返回</button>
            <h2>功能概览</h2>
            <div className="feature-grid-sm">
              {[
                { icon: '📚', label: '文献管理' }, { icon: '📖', label: '文献阅读' }, { icon: '✏️', label: '随笔' },
                { icon: '📝', label: '论文写作' }, { icon: '🧪', label: '实验复现' }, { icon: '🤖', label: '模型聚合网关' },
              ].map((f) => (
                <div key={f.label} className="fg-item"><span className="icon">{f.icon}</span>{f.label}</div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => markComplete('tour')}>了解了</button>
          </div>
        ) : (
          <div className="step-panel" style={{ display: 'block' }}>
            <button className="step-back" onClick={() => setActiveStep(null)}>← 返回</button>
            <h2>加载示例数据</h2>
            <div className="sample-list">
              {SAMPLE_DATA.map((item) => (
                <div key={item.name} className="sample-item">
                  <span className="icon">{item.icon}</span>
                  <span className="name">{item.name}</span>
                  <span className="type">{item.type}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => markComplete('sample')}>加载示例数据</button>
          </div>
        )}
      </div>
    </div>
  );
}
