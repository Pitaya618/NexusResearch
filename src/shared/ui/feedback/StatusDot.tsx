/** 状态圆点指示器 */

interface StatusDotProps {
  /** 颜色变体 */
  variant?: 'success' | 'warning' | 'danger' | 'muted';
  /** 无障碍标签 */
  'aria-label'?: string;
}

export function StatusDot({ variant = 'success', 'aria-label': ariaLabel }: StatusDotProps) {
  const colorClasses = {
    success: 'bg-[var(--success)]',
    warning: 'bg-[var(--warning)]',
    danger: 'bg-[var(--danger)]',
    muted: 'bg-[var(--muted)]',
  };

  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${colorClasses[variant]}`}
      role="status"
      aria-label={ariaLabel}
    />
  );
}
