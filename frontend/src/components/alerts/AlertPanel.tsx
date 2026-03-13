/**
 * Alert log panel — grouped by severity, shape-redundant badges.
 * Never relies on color alone (WCAG AA).
 */
import { useState } from "react";
import { PanelHeader } from "../layout/PanelHeader";
import { SeverityBadge } from "../ui/SeverityBadge";
import type { Alert } from "../../lib/protocol";

interface AlertPanelProps {
  alerts: Alert[];
}

type SeverityFilter = "all" | "critical" | "high" | "medium" | "low";

export function AlertPanel({ alerts }: AlertPanelProps) {
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const hasAlerts = alerts.length > 0;

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);

  // Group counts
  const counts: Record<string, number> = {};
  for (const a of alerts) {
    counts[a.severity] = (counts[a.severity] || 0) + 1;
  }

  return (
    <div className="flex flex-col bg-[#111827] border border-[#1f2937] rounded-lg overflow-hidden">
      <PanelHeader
        title="Alert Log"
        status={hasAlerts ? "alert" : "idle"}
        badge={alerts.length}
      />

      {/* Severity filter bar */}
      {hasAlerts && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1f2937]">
          <button
            onClick={() => setFilter("all")}
            className={`mono text-[10px] px-2 py-0.5 rounded transition-colors ${
              filter === "all" ? "bg-white/10 text-gray-300" : "text-gray-600 hover:text-gray-400"
            }`}
          >
            All ({alerts.length})
          </button>
          {(["critical", "high", "medium", "low"] as const).map((sev) =>
            counts[sev] ? (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`flex items-center gap-1 mono text-[10px] px-2 py-0.5 rounded transition-colors ${
                  filter === sev ? "bg-white/10 text-gray-300" : "text-gray-600 hover:text-gray-400"
                }`}
              >
                <SeverityBadge severity={sev} showLabel={false} size="sm" />
                <span>{counts[sev]}</span>
              </button>
            ) : null,
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto max-h-64 p-1">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-600 text-xs py-8 mono">
            {hasAlerts ? `No ${filter} alerts` : "No anomalies detected"}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-2 px-2 py-1 rounded text-[11px] mono hover:bg-[#1f2937]/50"
              >
                <SeverityBadge severity={alert.severity} showLabel={false} size="sm" />
                <span className="text-gray-500 w-16 flex-shrink-0">
                  {new Date(alert.ts * 1000).toLocaleTimeString()}
                </span>
                <span className="text-gray-300 w-8 flex-shrink-0">{alert.name}</span>
                <span className="text-gray-400 flex-1">
                  {alert.value.toFixed(1)} uV
                </span>
                <SeverityBadge severity={alert.severity} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
