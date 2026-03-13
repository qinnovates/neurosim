/** SIEM color palette for canvas rendering. */
export const SIEM = {
  bg: "#0a0e17",
  panel: "#111827",
  border: "#1f2937",
  borderHover: "#374151",
  text: "#e5e7eb",
  muted: "#9ca3af",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  grid: "rgba(255,255,255,0.05)",
  gridStrong: "rgba(255,255,255,0.1)",
} as const;

/** 16-color palette for EEG channels — distinguishable on dark backgrounds. */
export const CHANNEL_COLORS = [
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#a855f7", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#10b981", // emerald
  "#14b8a6", // teal
  "#22d3ee", // light cyan
  "#60a5fa", // light blue
  "#c084fc", // light purple
  "#fb923c", // light orange
  "#34d399", // light emerald
] as const;

/**
 * Severity scale — 6-level, ISO 22324 aligned.
 * Shape + color + text for WCAG AA accessibility.
 * Red is reserved EXCLUSIVELY for critical/alert states.
 */
export const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444", // Red — immediate action required
  high: "#f97316",     // Orange — requires action soon
  medium: "#f59e0b",   // Amber — attention needed
  low: "#3b82f6",      // Blue — informational, not urgent
  info: "#6b7280",     // Gray — passive notification
};

export const SEVERITY_SHAPES: Record<string, string> = {
  critical: "diamond",
  high: "triangle",
  medium: "square",
  low: "circle",
  info: "hexagon",
};

export const SEVERITY_ORDER = ["critical", "high", "medium", "low", "info"] as const;
