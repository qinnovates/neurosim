/**
 * Severity badge with shape + color + text label.
 * Never relies on color alone (WCAG AA).
 */

type Severity = "critical" | "high" | "medium" | "low" | "info";

const SEVERITY_CONFIG: Record<Severity, { color: string; label: string; shape: "diamond" | "triangle" | "square" | "circle" | "hexagon" }> = {
  critical: { color: "#ef4444", label: "CRITICAL", shape: "diamond" },
  high:     { color: "#f97316", label: "HIGH",     shape: "triangle" },
  medium:   { color: "#f59e0b", label: "MEDIUM",   shape: "square" },
  low:      { color: "#3b82f6", label: "LOW",       shape: "circle" },
  info:     { color: "#6b7280", label: "INFO",      shape: "hexagon" },
};

function SeverityShape({ shape, color, size = 8 }: { shape: string; color: string; size?: number }) {
  const s = size;
  const h = s / 2;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {shape === "diamond" && (
        <polygon points={`${h},0 ${s},${h} ${h},${s} 0,${h}`} fill={color} />
      )}
      {shape === "triangle" && (
        <polygon points={`${h},0 ${s},${s} 0,${s}`} fill={color} />
      )}
      {shape === "square" && (
        <rect x={1} y={1} width={s - 2} height={s - 2} rx={1} fill={color} />
      )}
      {shape === "circle" && (
        <circle cx={h} cy={h} r={h - 0.5} fill={color} />
      )}
      {shape === "hexagon" && (
        <polygon points={`${h},0 ${s},${s * 0.25} ${s},${s * 0.75} ${h},${s} 0,${s * 0.75} 0,${s * 0.25}`} fill={color} />
      )}
    </svg>
  );
}

interface SeverityBadgeProps {
  severity: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function SeverityBadge({ severity, showLabel = true, size = "sm" }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity as Severity] || SEVERITY_CONFIG.info;
  const textSize = size === "sm" ? "text-[9px]" : "text-[11px]";
  const shapeSize = size === "sm" ? 6 : 8;
  const px = size === "sm" ? "px-1 py-0.5" : "px-1.5 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1 ${px} rounded mono ${textSize} uppercase font-medium`}
      style={{ color: config.color, backgroundColor: `${config.color}15` }}
    >
      <SeverityShape shape={config.shape} color={config.color} size={shapeSize} />
      {showLabel && config.label}
    </span>
  );
}
