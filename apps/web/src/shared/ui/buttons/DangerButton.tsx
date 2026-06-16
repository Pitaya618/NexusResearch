/** 危险按钮 - 用于删除等破坏性操作 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface DangerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function DangerButton({ children, size = 'md', className = '', ...props }: DangerButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--danger)] text-[var(--danger)] transition-colors hover:bg-[var(--danger)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
