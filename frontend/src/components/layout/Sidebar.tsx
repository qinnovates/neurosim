/**
 * Persistent sidebar navigation — collapsed icons, expand on hover.
 * Inspired by Grafana/Sentinel left nav.
 */
import { NavLink } from "react-router-dom";
import { MODULES, type ModuleDefinition } from "../../modules/registry";
import { useData } from "../../contexts/DataContext";

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  "coming-soon": "bg-gray-600",
  beta: "bg-amber-500",
};

function SidebarItem({ module }: { module: ModuleDefinition }) {
  const isDisabled = module.status === "coming-soon";

  if (isDisabled) {
    return (
      <div
        className="group relative flex items-center justify-center w-10 h-10 rounded-lg opacity-30 cursor-not-allowed"
        title={`${module.name} — Coming Soon`}
      >
        <span className="text-lg">{module.icon}</span>
        <Tooltip name={module.name} status="Coming Soon" />
      </div>
    );
  }

  return (
    <NavLink
      to={module.path}
      className={({ isActive }) =>
        `group relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
          isActive
            ? "bg-white/10 ring-1 ring-white/20"
            : "hover:bg-white/5"
        }`
      }
      title={module.name}
    >
      <span className="text-lg">{module.icon}</span>
      <Tooltip name={module.name} />
    </NavLink>
  );
}

function Tooltip({ name, status }: { name: string; status?: string }) {
  return (
    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
      {name}
      {status && <span className="text-gray-500 ml-1">({status})</span>}
    </div>
  );
}

export function Sidebar() {
  const { connected, streaming, alertCount } = useData();

  return (
    <aside className="flex flex-col items-center w-14 bg-[#0d1117] border-r border-[#1f2937] py-3 gap-1 flex-shrink-0">
      {/* Logo / Home */}
      <NavLink
        to="/"
        className="flex items-center justify-center w-10 h-10 mb-2 rounded-lg hover:bg-white/5 transition-colors group relative"
        title="Dashboard"
      >
        <svg width="22" height="22" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="4" fill="#0a0e17" />
          <path
            d="M8 16 Q12 8 16 16 Q20 24 24 16"
            stroke="#10b981"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="16" cy="16" r="2" fill="#ef4444" />
        </svg>
        <Tooltip name="Dashboard" />
      </NavLink>

      <div className="w-6 h-px bg-[#1f2937] mb-1" />

      {/* Module nav items */}
      {MODULES.filter((m) => m.id !== "settings").map((mod) => (
        <div key={mod.id} className="relative">
          <SidebarItem module={mod} />
          {/* Alert badge on Alerts module */}
          {mod.id === "alerts" && alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
              {alertCount > 99 ? "!" : alertCount}
            </span>
          )}
        </div>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      {MODULES.filter((m) => m.id === "settings").map((mod) => (
        <SidebarItem key={mod.id} module={mod} />
      ))}

      {/* Connection indicator */}
      <div className="mt-2 flex flex-col items-center gap-1">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            streaming ? "bg-emerald-500 animate-pulse" : connected ? "bg-emerald-500" : "bg-red-500 animate-pulse"
          }`}
          title={streaming ? "Streaming" : connected ? "Connected" : "Disconnected"}
        />
        <span className="text-[8px] mono text-gray-600">
          {streaming ? "LIVE" : connected ? "IDLE" : "OFF"}
        </span>
      </div>
    </aside>
  );
}
