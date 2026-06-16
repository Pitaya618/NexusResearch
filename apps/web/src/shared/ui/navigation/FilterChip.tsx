/** 过滤芯片 - 可切换的筛选标签 */

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function FilterChip({ label, active = false, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-[var(--accent)] text-white'
          : 'bg-[var(--border)] text-[var(--muted)] hover:bg-[var(--border-strong)] hover:text-[var(--fg)]'
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
