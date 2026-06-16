/** 文本输入框 */
import type { InputHTMLAttributes } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function TextInput({ label, error, id, className = '', ...props }: TextInputProps) {
  const inputId = id || label?.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[var(--muted)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`rounded-lg border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] ${
          error ? 'border-[var(--danger)]' : 'border-[var(--border)]'
        } ${className}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} role="alert" className="text-xs text-[var(--danger)]">
          {error}
        </span>
      )}
    </div>
  );
}
