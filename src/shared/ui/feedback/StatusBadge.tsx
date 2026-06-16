/** 状态徽章 - 药丸形标签 */
import type { ReactNode } from 'react';

interface StatusBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent';
}

export function StatusBadge({ children, variant = 'default' }: StatusBadgeProps) {
  const variantClasses = {
    default: 'bg-[var(--border)] text-[var(--muted)]',
    success: 'bg-[var(--success)]/15 text-[var(--success)]',
    warning: 'bg-[var(--warning)]/15 text-[var(--warning)]',
    danger: 'bg-[var(--danger)]/15 text-[var(--danger)]',
    accent: 'bg-[var(--accent)]/15 text-[var(--accent)]',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
