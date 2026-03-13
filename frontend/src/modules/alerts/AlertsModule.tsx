import { ModuleShell } from "../../components/layout/ModuleShell";
import { AlertPanel } from "../../components/alerts/AlertPanel";
import { getModuleById } from "../registry";
import { useData } from "../../contexts/DataContext";

const MODULE = getModuleById("alerts")!;

export default function AlertsModule() {
  const { alerts, clearAlerts } = useData();

  return (
    <ModuleShell
      module={MODULE}
      actions={
        alerts.length > 0 ? (
          <button
            onClick={clearAlerts}
            className="mono text-[10px] px-2 py-1 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded transition-colors"
          >
            Clear All
          </button>
        ) : null
      }
    >
      <AlertPanel alerts={alerts} />
    </ModuleShell>
  );
}
