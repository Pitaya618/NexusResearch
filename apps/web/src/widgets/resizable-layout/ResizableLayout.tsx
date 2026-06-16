/** 可调整大小的多面板布局 — 1:1 还原原始 HTML 结构 */
import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { usePersistedState } from 'shared/hooks';

interface PanelConfig {
  id: string;
  content: ReactNode;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth: number;
  className?: string;
  /** 是否 flex:1 自动填充剩余空间 */
  flex?: boolean;
}

interface ResizableLayoutProps {
  panels: PanelConfig[];
  storageKey: string;
}

export function ResizableLayout({ panels, storageKey }: ResizableLayoutProps) {
  const [widths, setWidths] = usePersistedState<Record<string, number>>(
    storageKey,
    Object.fromEntries(panels.map((p) => [p.id, p.defaultWidth])),
  );

  const [resizing, setResizing] = useState<{
    /** 被调整宽度的面板索引 */
    panelIndex: number;
    startX: number;
    startWidth: number;
    /** 拖拽方向：1 = 向右拖拽（面板变宽），-1 = 向左拖拽（面板变窄） */
    direction: 1 | -1;
  } | null>(null);

  /**
   * handle(index) 位于 panels[index] 和 panels[index+1] 之间
   * 拖拽时需要确定调整哪个面板的宽度：
   * - 如果 panels[index] 不是 flex → 调整它
   * - 如果 panels[index] 是 flex → 调整 panels[index+1]
   */
  const handleMouseDown = useCallback(
    (handleIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      const leftPanel = panels[handleIndex];
      const rightPanel = panels[handleIndex + 1];
      if (!leftPanel || !rightPanel) return;

      // 确定要调整的面板：优先调整非 flex 面板
      const targetIndex = leftPanel.flex ? handleIndex + 1 : handleIndex;
      const targetPanel = panels[targetIndex];
      if (!targetPanel || targetPanel.flex) return; // 两个都是 flex 则不处理

      setResizing({
        panelIndex: targetIndex,
        startX: e.clientX,
        startWidth: widths[targetPanel.id] ?? targetPanel.defaultWidth,
        direction: targetIndex === handleIndex ? 1 : -1,
      });
    },
    [panels, widths],
  );

  useEffect(() => {
    if (!resizing) return;

    document.body.classList.add('is-resizing');

    const handleMouseMove = (e: MouseEvent) => {
      const panel = panels[resizing.panelIndex];
      if (!panel) return;
      const diff = (e.clientX - resizing.startX) * resizing.direction;
      const newWidth = Math.min(
        panel.maxWidth ?? 600,
        Math.max(panel.minWidth ?? 180, resizing.startWidth + diff),
      );
      setWidths((prev) => ({ ...prev, [panel.id]: newWidth }));
    };

    const handleMouseUp = () => {
      document.body.classList.remove('is-resizing');
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.body.classList.remove('is-resizing');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, panels, setWidths]);

  const items: ReactNode[] = [];
  panels.forEach((panel, index) => {
    const isLast = index === panels.length - 1;
    const w = widths[panel.id] ?? panel.defaultWidth;

    const style: React.CSSProperties = panel.flex
      ? { flex: 1, minWidth: panel.minWidth ?? 280, height: '100%' }
      : { width: w, minWidth: panel.minWidth ?? 180, flexShrink: 0, flex: 'none', height: '100%' };

    items.push(
      <div key={panel.id} className={panel.className} style={style}>
        {panel.content}
      </div>,
    );

    if (!isLast) {
      items.push(
        <div
          key={`handle-${panel.id}`}
          className="resize-handle"
          onMouseDown={(e) => handleMouseDown(index, e)}
          role="separator"
          aria-orientation="vertical"
          tabIndex={0}
        />,
      );
    }
  });

  return <>{items}</>;
}
