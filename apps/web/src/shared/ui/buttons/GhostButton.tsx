/** 幽灵按钮 - 透明背景带边框 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function GhostButton({ children, size = 'md', className = '', ...props }: GhostButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-transparent text-[var(--fg)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
