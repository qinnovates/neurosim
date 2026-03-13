interface PanelHeaderProps {
  title: string;
  status?: "active" | "idle" | "alert";
  badge?: number;
}

const STATUS_COLORS = {
  active: "bg-emerald-500",
  idle: "bg-gray-500",
  alert: "bg-red-500 animate-pulse",
};

export function PanelHeader({ title, status = "idle", badge }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f2937]">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
        <span className="mono text-xs font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="mono text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
    </div>
  );
}
