/** 标签徽章 */

interface TagBadgeProps {
  label: string;
  color?: string;
  onRemove?: () => void;
}

export function TagBadge({ label, color, onRemove }: TagBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
      style={{
        backgroundColor: color ? `${color}20` : 'var(--border)',
        color: color || 'var(--muted)',
      }}
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70"
          aria-label={`移除标签 ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
