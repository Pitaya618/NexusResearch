/** 图标按钮 - 纯图标无文字 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** 无障碍标签 - 必填 */
  'aria-label': string;
  size?: 'sm' | 'md';
}

export function IconButton({ children, size = 'md', className = '', ...props }: IconButtonProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--border)] hover:text-[var(--fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
