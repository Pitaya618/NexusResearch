/** 下拉选择框 */
import type { SelectHTMLAttributes, ReactNode } from 'react';

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function SelectInput({ label, id, children, className = '', ...props }: SelectInputProps) {
  const inputId = id || label?.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[var(--muted)]">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
