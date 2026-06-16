/** 随笔页面 — 从后端加载真实数据 + AI 对话（SSE 流式） */
import { useState, useCallback, useRef, useEffect } from 'react';
import { ResizableLayout } from 'widgets/resizable-layout/ResizableLayout';
import { useEssayStore } from 'features/essay/model/essayStore';
import { aiApi } from 'shared/lib/api';
import type { ChatMessage } from 'shared/types';

export function EssayPage() {
  const { essays, loading, fetchList, update } = useEssayStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: '👋 我是你的 AI 科研助手。选中左侧随笔后，我可以帮你润色、分析或扩展内容。', timestamp: new Date().toISOString() },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!activeId && essays.length > 0) setActiveId(essays[0].id);
  }, [essays, activeId]);

  const activeEssay = essays.find((e) => e.id === activeId);

  const handleSend = useCallback(async () => {
    if (!chatInput.trim() || streaming || !activeEssay) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString(),
    };
    const assistantId = (Date.now() + 1).toString();
    setChatMessages((prev) => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString() }]);
    setChatInput('');
    setStreaming(true);
    if (chatTextareaRef.current) chatTextareaRef.current.style.height = 'auto';

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await aiApi.chat(
        {
          messages: [...chatMessages, userMsg].map((m) => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp })),
          context: { type: 'essay', essayId: activeEssay.id },
        },
        (chunk) => {
          setChatMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
          );
        },
        () => setStreaming(false),
        controller.signal,
      );
    } catch {
      setChatMessages((prev) =>
        prev.map((m) => (m.id === assistantId && m.content === '' ? { ...m, content: '（AI 调用失败，请检查 Provider 配置）' } : m)),
      );
    } finally {
      setStreaming(false);
    }
  }, [chatInput, streaming, activeEssay, chatMessages]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const handleTitleChange = useCallback((id: string, title: string) => {
    update(id, { title });
  }, [update]);

  const leftPanel = (
    <div className="col-list">
      <div className="essay-list-header">
        随笔列表
        <button title="新建随笔">+</button>
      </div>
      <div className="essay-list-body">
        {loading && <div style={{ padding: 16, color: 'var(--text-tertiary)' }}>加载中…</div>}
        {!loading && essays.length === 0 && <div style={{ padding: 16, color: 'var(--text-tertiary)' }}>暂无随笔</div>}
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
        <input
          className="title"
          defaultValue={activeEssay.title}
          key={activeEssay.id}
          onBlur={(e) => handleTitleChange(activeEssay.id, e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <button className="pill-btn">🏷 {activeEssay.tag}</button>
        <select className="pill-select"><option>导入到论文写作</option><option>导入到实验模块</option></select>
        <button className={`pill-btn${chatOpen ? ' primary' : ''}`} onClick={() => setChatOpen(!chatOpen)}>💬 AI</button>
        <button className="pill-btn">⚙</button>
      </div>
      <div className="col-body">
        <textarea
          className="md-editor"
          key={activeEssay.id}
          defaultValue={activeEssay.content}
          onBlur={(e) => update(activeEssay.id, { content: e.target.value })}
        />
      </div>
    </div>
  ) : null;

  const rightPanel = (
    <div className={`col-chat${chatOpen ? '' : ' collapsed'}`}>
      <div className="col-header">
        AI 对话 <span style={{ fontWeight: 400, fontSize: 11 }}>流式</span>
        <button className="toggle-btn" onClick={() => setChatOpen(false)} title="收起面板">✕</button>
      </div>
      <div className="chat-messages">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`chat-msg ${msg.role}`}>
            {msg.content || (streaming && msg.role === 'assistant' ? '思考中…' : '')}
          </div>
        ))}
      </div>
      <div className="chat-input-row">
        <textarea
          ref={chatTextareaRef}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={activeEssay ? '输入问题，AI 可读取左侧随笔全文…' : '请先选择一篇随笔'}
          rows={1}
          disabled={!activeEssay}
        />
        {streaming ? (
          <button onClick={handleStop}>停止</button>
        ) : (
          <button onClick={handleSend} disabled={!activeEssay}>发送</button>
        )}
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
