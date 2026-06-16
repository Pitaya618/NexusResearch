/** 进度条 */

interface ProgressBarProps {
  /** 进度百分比 0-100 */
  value: number;
  /** 无障碍标签 */
  'aria-label'?: string;
}

export function ProgressBar({ value, 'aria-label': ariaLabel = '进度' }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]"
    >
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
