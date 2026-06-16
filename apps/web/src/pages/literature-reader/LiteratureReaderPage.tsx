/** 文献阅读页面 — 1:1 还原原始 HTML */
import { useState, useCallback, useRef } from 'react';
import { ResizableLayout } from 'widgets/resizable-layout/ResizableLayout';
import type { ReaderRightTab, HighlightColor, ChatMessage } from 'shared/types';

const MOCK_ANNOTATIONS = [
  { id: 'a1', color: 'blue' as HighlightColor, page: 1, text: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks', note: '' },
  { id: 'a2', color: 'green' as HighlightColor, page: 2, text: 'Self-attention, sometimes called intra-attention', note: '核心定义' },
  { id: 'a3', color: 'purple' as HighlightColor, page: 2, text: 'the Transformer is the first transduction model relying entirely on self-attention', note: '' },
  { id: 'a4', color: 'red' as HighlightColor, page: 3, text: 'Multi-head attention allows the model to jointly attend to information', note: '多头注意力的优势' },
  { id: 'a5', color: 'yellow' as HighlightColor, page: 4, text: 'we employ h = 8 parallel attention layers', note: '' },
];

const COLOR_BG: Record<HighlightColor, string> = {
  blue: 'var(--highlight-blue)', yellow: 'var(--highlight-yellow)', green: 'var(--highlight-green)',
  purple: 'var(--highlight-purple)', red: 'var(--highlight-red)',
};

export function LiteratureReaderPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRightTab, setActiveRightTab] = useState<ReaderRightTab>('notes');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [colorFilter, setColorFilter] = useState<HighlightColor | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: '你好！我可以帮你理解这篇论文。请问关于 Transformer 架构有什么问题？', timestamp: '2026-06-06T10:00:00Z' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', content: chatInput, timestamp: new Date().toISOString() }]);
    setChatInput('');
    if (chatTextareaRef.current) chatTextareaRef.current.style.height = 'auto';
    setTimeout(() => {
      setChatMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: 'Transformer 架构的核心创新在于完全基于注意力机制，摒弃了传统的 RNN/CNN 结构。它通过多头自注意力实现了对序列中任意位置的直接建模。',
        timestamp: new Date().toISOString(),
      }]);
    }, 1000);
  }, [chatInput]);

  const filteredAnnotations = colorFilter ? MOCK_ANNOTATIONS.filter((a) => a.color === colorFilter) : MOCK_ANNOTATIONS;

  const pdfPanel = (
    <div className="pdf-panel">
      <div className="pdf-toolbar">
        <div className="page-nav">
          <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>◀</button>
          <span>{currentPage} / 8</span>
          <button onClick={() => setCurrentPage(Math.min(8, currentPage + 1))}>▶</button>
        </div>
        <div className="pdf-zoom">
          <span>80%</span>
          <input type="range" min={80} max={200} defaultValue={100} />
          <span>200%</span>
        </div>
        <div className="spacer" />
        {[
          { id: 'highlight', icon: '🖍️', label: '高亮' },
          { id: 'underline', icon: '📏', label: '下划线' },
          { id: 'note', icon: '📝', label: '批注' },
        ].map((tool) => (
          <button
            key={tool.id}
            className={`tool-btn${activeTool === tool.id ? ' active' : ''}`}
            onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
          >
            {tool.icon} {tool.label}
          </button>
        ))}
      </div>
      <div className="pdf-canvas">
        <div className="pdf-page" style={{ display: 'block' }}>
          <h2 style={{ textAlign: 'center', fontSize: 20 }}>Attention Is All You Need</h2>
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Ashish Vaswani, Noam Shazeer, Niki Parmar, et al.<br />
            Google Brain / Google Research<br />
            NeurIPS 2017
          </p>
          <div className="abstract">
            <strong>Abstract</strong><br />
            <span className="highlight blue">The dominant sequence transduction models are based on complex recurrent or convolutional neural networks</span> that include an encoder and decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.
          </div>
          <h3>1 Introduction</h3>
          <p>Recurrent neural networks, long short-term memory and gated recurrent neural networks in particular, have been firmly established as state of the art approaches in sequence modeling and transduction problems such as language modeling and machine translation.</p>
          <p><span className="highlight green">Self-attention, sometimes called intra-attention</span>, is an attention mechanism relating different positions of a single sequence in order to compute a representation of the sequence.</p>
          <p><span className="highlight purple">The Transformer is the first transduction model relying entirely on self-attention</span> to compute representations of its input and output without using sequence-aligned RNNs or convolution.</p>
          <div className="page-footer">1</div>
        </div>
      </div>
    </div>
  );

  const rightPanel = (
    <div className="reader-right-panel">
      <div className="reader-tabs">
        {([
          { id: 'notes' as const, label: '笔记' },
          { id: 'annotations' as const, label: '批注' },
          { id: 'ai' as const, label: 'AI 问答' },
        ]).map((tab) => (
          <button
            key={tab.id}
            className={`reader-tab${activeRightTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveRightTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeRightTab === 'notes' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexShrink: 0 }}>
            <button className="btn-sm ghost">方法-结果-评价</button>
            <button className="btn-sm ghost">问题-方法-结论</button>
            <button className="btn-sm ghost">空白</button>
          </div>
          <textarea
            className="note-editor"
            defaultValue={`## 方法\n- 提出 Transformer 架构\n- 完全基于注意力机制\n\n## 结果\n- WMT 2014 EN-DE: 28.4 BLEU\n- 训练时间 3.5 天（8 GPU）\n\n## 评价\n- 开创性工作\n- 并行化训练大幅提升效率`}
          />
        </div>
      )}

      {activeRightTab === 'annotations' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="filter-bar">
            <button className={`filter-btn${!colorFilter ? ' active' : ''}`} onClick={() => setColorFilter(null)}>全部</button>
            {(['blue', 'green', 'purple', 'red', 'yellow'] as HighlightColor[]).map((c) => (
              <button key={c} className={`filter-btn${colorFilter === c ? ' active' : ''}`} onClick={() => setColorFilter(c)} style={colorFilter === c ? {} : {}}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: COLOR_BG[c], marginRight: 4 }} />
                {c}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredAnnotations.map((a) => (
              <div key={a.id} className="annotation-item">
                <span className="annotation-color" style={{ background: COLOR_BG[a.color] }} />
                <div className="annotation-text">
                  "{a.text.slice(0, 60)}..."
                  {a.note && <div style={{ color: 'var(--accent)', marginTop: 4 }}>📝 {a.note}</div>}
                </div>
                <span className="annotation-page">p.{a.page}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeRightTab === 'ai' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="chat-messages" style={{ flex: 1 }}>
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`chat-msg ${msg.role}`}>{msg.content}</div>
            ))}
          </div>
          <div className="chat-input-row">
            <textarea
              ref={chatTextareaRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
              placeholder="询问关于这篇论文…"
              rows={1}
            />
            <button onClick={handleSendChat}>发送</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ResizableLayout
      storageKey="nr-reader-panels"
      panels={[
        { id: 'pdf', content: pdfPanel, defaultWidth: 600, minWidth: 400, className: 'pdf-panel', flex: true },
        { id: 'right', content: rightPanel, defaultWidth: 380, minWidth: 260, maxWidth: 500, className: 'reader-right-panel' },
      ]}
    />
  );
}
