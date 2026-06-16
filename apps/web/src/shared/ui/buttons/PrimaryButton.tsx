/** 主要按钮 - 强调色背景 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
}

export function PrimaryButton({ children, size = 'md', className = '', ...props }: PrimaryButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] font-medium text-white transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
