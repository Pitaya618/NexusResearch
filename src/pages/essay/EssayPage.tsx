/** 随笔页面 — 1:1 还原原始 HTML */
import { useState, useCallback, useRef } from 'react';
import { SAMPLE_ESSAYS } from 'entities/essay/model/essays';
import { ResizableLayout } from 'widgets/resizable-layout/ResizableLayout';
import type { Essay, ChatMessage, AiEditSuggestion } from 'shared/types';

const MOCK_SUGGESTION: AiEditSuggestion = {
  id: 's1',
  segments: [
    { type: 'unchanged', text: '大型语言模型（LLM）正在' },
    { type: 'deletion', text: '改变' },
    { type: 'addition', text: '深刻变革' },
    { type: 'unchanged', text: '药物发现的范式。' },
  ],
  accepted: null,
};

export function EssayPage() {
  const [activeId, setActiveId] = useState('essay-1');
  const [essays] = useState<readonly Essay[]>(SAMPLE_ESSAYS);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: '👋 我已读取你的随笔内容。关于 LLM 在药物发现中的应用，我看到你已经梳理了 Transformer 分子生成和强化学习优化两个方向。需要我帮你深入分析哪个部分？', timestamp: '2026-06-06T10:00:00Z' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [suggestion, setSuggestion] = useState<AiEditSuggestion | null>(MOCK_SUGGESTION);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);

  const activeEssay = essays.find((e) => e.id === activeId);

  const handleSend = useCallback(() => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', content: chatInput, timestamp: new Date().toISOString() }]);
    setChatInput('');
    if (chatTextareaRef.current) chatTextareaRef.current.style.height = 'auto';
    setTimeout(() => {
      setChatMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '好的。基于你的草稿，我重新组织了"初步想法"部分的结构。建议将标题改为"基于 Transformer 的分子生成"，并在挑战部分增加"训练数据偏差"。',
        timestamp: new Date().toISOString(),
      }]);
      setSuggestion(MOCK_SUGGESTION);
    }, 1000);
  }, [chatInput]);

  const handleDiffAction = useCallback((action: 'accept' | 'reject') => {
    setSuggestion(null);
    setChatMessages((prev) => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: action === 'accept' ? '✓ 已应用修改！' : '✕ 已忽略建议。',
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  const leftPanel = (
    <div className="col-list">
      <div className="essay-list-header">
        随笔列表
        <button title="新建随笔">+</button>
      </div>
      <div className="essay-list-body">
        {essays.map((essay) => (
          <div
            key={essay.id}
            className={`essay-list-row${essay.id === activeId ? ' active' : ''}`}
            onClick={() => setActiveId(essay.id)}
          >
            {essay.title}
            <span className="meta">{essay.wordCount.toLocaleString()} 字 · <span className="tag">{essay.tag}</span></span>
          </div>
        ))}
      </div>
    </div>
  );

  const centerPanel = activeEssay ? (
    <div className="col-editor">
      <div className="col-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input className="title" defaultValue={activeEssay.title} style={{ flex: 1, minWidth: 0 }} />
        <button className="pill-btn">🏷 {activeEssay.tag}</button>
        <select className="pill-select"><option>导入到论文写作</option><option>导入到实验模块</option></select>
        <button className={`pill-btn${chatOpen ? ' primary' : ''}`} onClick={() => setChatOpen(!chatOpen)}>💬 AI</button>
        <button className="pill-btn">⚙</button>
      </div>
      <div className="col-body">
        <textarea className="md-editor" defaultValue={activeEssay.content} />
      </div>
    </div>
  ) : null;

  const rightPanel = (
    <div className={`col-chat${chatOpen ? '' : ' collapsed'}`}>
      <div className="col-header">
        AI 对话 <span style={{ fontWeight: 400, fontSize: 11 }}>Claude 4 Opus</span>
        <button className="toggle-btn" onClick={() => setChatOpen(false)} title="收起面板">✕</button>
      </div>
      <div className="chat-messages">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`chat-msg ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {suggestion && (
          <div className="chat-msg assistant">
            <strong>建议修改：</strong><br /><br />
            {suggestion.segments.map((seg, i) => (
              <span key={i} className={seg.type === 'addition' ? 'diff-add' : seg.type === 'deletion' ? 'diff-del' : ''}>
                {seg.text}
              </span>
            ))}
            <div className="actions">
              <button className="accept" onClick={() => handleDiffAction('accept')}>✓ 接受</button>
              <button onClick={() => handleDiffAction('reject')}>✕ 拒绝</button>
              <button>✎ 微调</button>
            </div>
          </div>
        )}
      </div>
      <div className="chat-input-row">
        <textarea
          ref={chatTextareaRef}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="输入问题，AI 可读取左侧随笔全文…"
          rows={1}
        />
        <button onClick={handleSend}>发送</button>
      </div>
    </div>
  );

  return (
    <>
      <ResizableLayout
        storageKey="nr-essay-panels"
        panels={[
          { id: 'list', content: leftPanel, defaultWidth: 220, minWidth: 140, maxWidth: 400, className: 'col-list' },
          { id: 'editor', content: centerPanel ?? <div />, defaultWidth: 500, minWidth: 240, className: 'col-editor', flex: true },
          { id: 'chat', content: rightPanel, defaultWidth: 340, minWidth: 200, maxWidth: 500, className: 'col-chat' },
        ]}
      />
      {!chatOpen && (
        <button className="chat-reopen visible" onClick={() => setChatOpen(true)}>💬</button>
      )}
    </>
  );
}
