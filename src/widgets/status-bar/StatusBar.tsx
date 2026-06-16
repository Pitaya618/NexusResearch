/** 状态栏 — 1:1 还原原始 HTML 结构 */

interface StatusBarProps {
  extra?: React.ReactNode;
}

export function StatusBar({ extra }: StatusBarProps) {
  return (
    <div className="status-bar">
      <span className="status-model">
        <span className="dot" /> 当前模型: Claude 4 Opus
      </span>
      <span>本月费用: $2.35</span>
      {extra}
      <span className="right">NexusResearch v1.0.0</span>
    </div>
  );
}
