/** 论文编辑页面 — 1:1 还原原始 HTML */
import { useState, useRef, useEffect, useCallback } from 'react';
import { ResizableLayout } from 'widgets/resizable-layout/ResizableLayout';
import type { FileNode, LatexTemplate, AiSubTab, CompileStatus, PolishMode } from 'shared/types';

const FILE_TREE: readonly FileNode[] = [{
  name: 'paper-molgen', type: 'folder', children: [
    { name: 'main.tex', type: 'tex' },
    { name: 'references.bib', type: 'bib' },
    { name: 'sections', type: 'folder', children: [
      { name: 'abstract.tex', type: 'tex' }, { name: 'introduction.tex', type: 'tex' },
      { name: 'related_work.tex', type: 'tex' }, { name: 'method.tex', type: 'tex' },
      { name: 'experiments.tex', type: 'tex' }, { name: 'conclusion.tex', type: 'tex' },
    ]},
    { name: 'figures', type: 'folder', children: [
      { name: 'architecture.pdf', type: 'pdf' }, { name: 'results.pdf', type: 'pdf' },
    ]},
    { name: 'style', type: 'folder', children: [{ name: 'neurips_2024.sty', type: 'sty' }] },
    { name: 'output', type: 'folder', children: [{ name: 'main.pdf', type: 'pdf' }, { name: 'main.log', type: 'log' }] },
  ],
}];

const LATEX_CONTENT = `\\documentclass{article}
\\usepackage{neurips_2024}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}

\\title{Molecular Graph Generation via\\\\Graph Neural Networks}

\\begin{document}
\\maketitle

\\begin{abstract}
We propose a novel method for molecular graph generation...
\\end{abstract}

\\section{Introduction}
Molecular design is a fundamental challenge...

\\section{Method}
Our approach consists of three components...

\\begin{equation}
  L = L_{\\text{recon}} + \\beta L_{\\text{KL}}
\\end{equation}

\\section{Experiments}
We evaluate on QM9 and ZINC datasets...

\\bibliographystyle{plain}
\\bibliography{references}
\\end{document}`;

const COMPILE_LOG = [
  { level: 'info', msg: 'pdflatex main.tex' },
  { level: 'info', msg: 'Processing sections/abstract.tex...' },
  { level: 'info', msg: 'Processing sections/introduction.tex...' },
  { level: 'warn', msg: 'Overfull \\hbox in paragraph at lines 45--48' },
  { level: 'info', msg: 'Processing references.bib...' },
  { level: 'ok', msg: 'Compilation successful! 12 pages, 0 errors' },
];

export function PaperEditorPage() {
  const [activeFile, setActiveFile] = useState('main.tex');
  const [template, setTemplate] = useState<LatexTemplate>('neurips-2024');
  const [compileStatus, setCompileStatus] = useState<CompileStatus>('idle');
  const [rightView, setRightView] = useState<'pdf' | 'ai'>('pdf');
  const [aiSubTab, setAiSubTab] = useState<AiSubTab>('qa');
  const [polishMode, setPolishMode] = useState<PolishMode>('academic');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['paper-molgen', 'sections', 'figures']));
  const [pdfScale, setPdfScale] = useState(1);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);

  const updatePdfScale = useCallback(() => {
    if (pdfPreviewRef.current) {
      const containerWidth = pdfPreviewRef.current.clientWidth - 40; // 减去 padding
      const pdfWidth = 595; // A4 宽度
      const scale = Math.min(containerWidth / pdfWidth, 1);
      setPdfScale(scale);
    }
  }, []);

  useEffect(() => {
    updatePdfScale();
    const observer = new ResizeObserver(updatePdfScale);
    if (pdfPreviewRef.current) {
      observer.observe(pdfPreviewRef.current);
    }
    return () => observer.disconnect();
  }, [updatePdfScale]);

  const handleCompile = () => {
    setCompileStatus('compiling');
    setTimeout(() => setCompileStatus('success'), 2000);
  };

  const toggleFolder = (name: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const renderFileTree = (nodes: readonly FileNode[], depth = 0) =>
    nodes.map((node) => (
      <div key={node.name} className={node.type === 'folder' ? 'ft-folder' : ''}>
        {node.type === 'folder' ? (
          <>
            <div className="ft-folder-name" onClick={() => toggleFolder(node.name)} style={{ paddingLeft: depth * 16 + 8 }}>
              <span className={`arrow${expandedFolders.has(node.name) ? ' open' : ''}`}>▶</span>
              📁 {node.name}
            </div>
            {expandedFolders.has(node.name) && node.children && (
              <div>{renderFileTree(node.children, depth + 1)}</div>
            )}
          </>
        ) : (
          <div
            className={`ft-file${activeFile === node.name ? ' active' : ''}`}
            onClick={() => setActiveFile(node.name)}
            style={{ paddingLeft: depth * 16 + 24 }}
          >
            <span className="icon">{node.type === 'tex' ? '📄' : node.type === 'bib' ? '📚' : node.type === 'pdf' ? '📑' : '📋'}</span>
            {node.name}
          </div>
        )}
      </div>
    ));

  const leftPanel = (
    <div className="file-tree">
      <div className="file-tree-header">
        工程文件
        <button>+</button>
      </div>
      <div className="file-tree-body">{renderFileTree(FILE_TREE)}</div>
    </div>
  );

  const centerPanel = (
    <div className="editor-pane">
      <div className="pane-header">
        <span style={{ textTransform: 'none', letterSpacing: 0 }}>{activeFile}</span>
        <select className="template-select" value={template} onChange={(e) => setTemplate(e.target.value as LatexTemplate)}>
          <option value="neurips-2024">NeurIPS 2024</option>
          <option value="icml-2024">ICML 2024</option>
          <option value="arxiv">arXiv</option>
          <option value="ieee-trans">IEEE Trans.</option>
          <option value="elsevier">Elsevier</option>
        </select>
        <div className={`compile-status${compileStatus === 'success' ? ' success' : ''}`}>
          {compileStatus === 'compiling' ? '⏳ 编译中...' : compileStatus === 'success' ? '✓ 编译成功' : compileStatus === 'error' ? '✕ 编译失败' : '就绪'}
        </div>
        <div className="spacer" />
        <button className="compile-btn" onClick={handleCompile} disabled={compileStatus === 'compiling'}>
          {compileStatus === 'compiling' ? '编译中...' : '▶ 编译'}
        </button>
      </div>
      <textarea className="latex-editor" defaultValue={LATEX_CONTENT} spellCheck={false} />
    </div>
  );

  const rightPanel = (
    <div className="paper-right-panel">
      <div className="rp-tabs">
        <button className={`rp-tab${rightView === 'pdf' ? ' active' : ''}`} onClick={() => setRightView('pdf')}>PDF 预览</button>
        <button className={`rp-tab${rightView === 'ai' ? ' active' : ''}`} onClick={() => setRightView('ai')}>AI 助手</button>
      </div>
      <div className="rp-body">
        {rightView === 'pdf' ? (
          <div className="rp-view active">
            <div className="pdf-preview" ref={pdfPreviewRef}>
              <div className="pdf-scaler" style={{ transform: `scale(${pdfScale})`, transformOrigin: 'top center' }}>
                <div className="pdf-render">
                  <h1>Molecular Graph Generation via Graph Neural Networks</h1>
                  <div className="authors">John Smith, Jane Doe — ICML 2024</div>
                  <div className="abstract-title">Abstract</div>
                  <div className="abstract">We propose a novel method for molecular graph generation using graph neural networks and reinforcement learning...</div>
                  <h2>1 Introduction</h2>
                  <p>Molecular design is a fundamental challenge in drug discovery and materials science.</p>
                  <h2>2 Method</h2>
                  <p>Our approach consists of three components: a graph encoder, a decoder, and a reward module.</p>
                  <div className="equation">L = L_recon + β L_KL</div>
                  <h2>3 Experiments</h2>
                  <p>We evaluate on QM9 and ZINC datasets. Our method achieves state-of-the-art performance.</p>
                  <div className="pdf-page-num">1</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rp-view active" style={{ display: 'flex' }}>
            <div className="ai-sub-tabs">
              {([{ id: 'qa', label: '问答' }, { id: 'polish', label: '润色' }, { id: 'draw', label: '绘图' }, { id: 'log', label: '日志' }] as const).map((tab) => (
                <button key={tab.id} className={`ai-sub-tab${aiSubTab === tab.id ? ' active' : ''}`} onClick={() => setAiSubTab(tab.id)}>{tab.label}</button>
              ))}
            </div>
            <div className="ai-content">
              {aiSubTab === 'qa' && (
                <div className="ai-tab active">
                  <h4>AI 问答</h4>
                  <div className="linked-projects">
                    关联项目：
                    <div className="link">✏️ LLM 在药物发现中的应用（随笔）</div>
                    <div className="link">🧪 MolGPT 复现实验</div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>你好！我可以帮你理解论文内容、解释公式、或回答关于方法的问题。</p>
                </div>
              )}
              {aiSubTab === 'polish' && (
                <div className="ai-tab active">
                  <h4>学术润色</h4>
                  <div className="polish-mode">
                    {([{ id: 'academic', label: '学术规范' }, { id: 'concise', label: '简洁精炼' }, { id: 'expand', label: '详细展开' }, { id: 'keepOriginal', label: '保持原意' }] as const).map((mode) => (
                      <button key={mode.id} className={polishMode === mode.id ? 'active' : ''} onClick={() => setPolishMode(mode.id)}>{mode.label}</button>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>选中文本后，点击上方模式进行润色。</p>
                </div>
              )}
              {aiSubTab === 'draw' && (
                <div className="ai-tab active">
                  <div className="draw-preview">
                    <div className="draw-preview-placeholder">
                      <span style={{ fontSize: 32 }}>🎨</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>选中图表描述后，AI 将生成配图建议</span>
                    </div>
                  </div>
                </div>
              )}
              {aiSubTab === 'log' && (
                <div className="ai-tab active">
                  <div className="compile-log">
                    {COMPILE_LOG.map((entry, i) => (
                      <div key={i} className={entry.level}>[{entry.level.toUpperCase()}] {entry.msg}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {aiSubTab === 'qa' && (
              <div className="ai-input-footer">
                <textarea
                  placeholder="输入问题…"
                  rows={1}
                  onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 100) + 'px'; }}
                />
                <button>发送</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ResizableLayout
      storageKey="nr-paper-panels"
      panels={[
        { id: 'tree', content: leftPanel, defaultWidth: 220, minWidth: 200, maxWidth: 320, className: 'file-tree' },
        { id: 'editor', content: centerPanel, defaultWidth: 500, minWidth: 360, className: 'editor-pane', flex: true },
        { id: 'right', content: rightPanel, defaultWidth: 400, minWidth: 300, maxWidth: 500, className: 'paper-right-panel' },
      ]}
    />
  );
}
