import { PanelHeader } from "../layout/PanelHeader";
import type { Alert } from "../../lib/protocol";
import { SEVERITY_COLORS } from "../../lib/theme";

interface AlertPanelProps {
  alerts: Alert[];
}

export function AlertPanel({ alerts }: AlertPanelProps) {
  const hasAlerts = alerts.length > 0;

  return (
    <div className="flex flex-col bg-[#111827] border border-[#1f2937] rounded-lg overflow-hidden">
      <PanelHeader
        title="Alert Log"
        status={hasAlerts ? "alert" : "idle"}
        badge={alerts.length}
      />
      <div className="flex-1 overflow-y-auto max-h-64 p-1">
        {alerts.length === 0 ? (
          <div className="text-center text-gray-600 text-xs py-8 mono">
            No anomalies detected
          </div>
        ) : (
          <div className="space-y-0.5">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-2 px-2 py-1 rounded text-[11px] mono hover:bg-[#1f2937]/50"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: SEVERITY_COLORS[alert.severity] }}
                />
                <span className="text-gray-500 w-16 flex-shrink-0">
                  {new Date(alert.ts * 1000).toLocaleTimeString()}
                </span>
                <span className="text-gray-300 w-8 flex-shrink-0">{alert.name}</span>
                <span className="text-gray-400 flex-1">
                  {alert.value.toFixed(1)} uV
                </span>
                <span
                  className="text-[9px] uppercase px-1 py-0.5 rounded"
                  style={{
                    color: SEVERITY_COLORS[alert.severity],
                    backgroundColor: `${SEVERITY_COLORS[alert.severity]}15`,
                  }}
                >
                  {alert.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
