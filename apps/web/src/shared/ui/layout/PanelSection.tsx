/** 面板区块 - 带标题的内容区域 */
import type { ReactNode } from 'react';

interface PanelSectionProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

export function PanelSection({ title, children, action }: PanelSectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  );
}
