/** 空状态占位 */
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="text-4xl" aria-hidden="true">{icon}</span>
      <h3 className="text-sm font-medium text-[var(--fg)]">{title}</h3>
      {description && <p className="text-xs text-[var(--muted)]">{description}</p>}
      {action}
    </div>
  );
}
