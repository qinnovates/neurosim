/**
 * Persistent sidebar navigation — collapsed icons, expand on hover to show labels.
 * Icons are grayscale by default, colored when active. Inspired by Grafana/Elastic Security.
 */
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { MODULES, type ModuleDefinition } from "../../modules/registry";
import { useData } from "../../contexts/DataContext";

function SidebarItem({ module, expanded }: { module: ModuleDefinition; expanded: boolean }) {
  const location = useLocation();
  const isActive = location.pathname === module.path;
  const isComingSoon = module.status === "coming-soon";

  return (
    <NavLink
      to={module.path}
      className={`group relative flex items-center gap-3 h-10 rounded-lg transition-all duration-200 px-2.5 ${
        isActive
          ? "bg-white/10 ring-1 ring-white/20"
          : "hover:bg-white/5"
      }`}
      title={isComingSoon ? `${module.name} — Coming Soon` : module.name}
    >
      <module.Icon
        size={18}
        style={{ color: isActive ? module.color : "#6b7280" }}
        className="flex-shrink-0 transition-colors duration-200"
      />
      {expanded && (
        <span className={`text-[11px] whitespace-nowrap overflow-hidden transition-colors duration-200 ${
          isActive ? "text-gray-200 font-medium" : isComingSoon ? "text-gray-600" : "text-gray-400"
        }`}>
          {module.shortName}
        </span>
      )}
      {!expanded && <Tooltip name={module.name} status={isComingSoon ? "Coming Soon" : undefined} />}
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
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`flex flex-col bg-[#0d1117] border-r border-[#1f2937] py-3 gap-1 flex-shrink-0 transition-all duration-200 ${
        expanded ? "w-40" : "w-14"
      }`}
      style={{ overflow: "hidden" }}
    >
      {/* Logo / Home */}
      <NavLink
        to="/"
        className={`flex items-center gap-3 h-10 mb-2 rounded-lg hover:bg-white/5 transition-colors group relative px-2.5 ${
          isHome ? "bg-white/10 ring-1 ring-white/20" : ""
        }`}
        title="Dashboard"
      >
        <svg width="22" height="22" viewBox="0 0 32 32" className="flex-shrink-0">
          <rect width="32" height="32" rx="4" fill="#0a0e17" />
          <path
            d="M8 16 Q12 8 16 16 Q20 24 24 16"
            stroke={isHome ? "#10b981" : "#6b7280"}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            style={{ transition: "stroke 0.2s" }}
          />
          <circle cx="16" cy="16" r="2" fill={isHome ? "#10b981" : "#6b7280"} style={{ transition: "fill 0.2s" }} />
        </svg>
        {expanded && (
          <span className={`text-[11px] font-semibold whitespace-nowrap transition-colors duration-200 ${isHome ? "text-gray-200" : "text-gray-400"}`}>
            Neural Atlas
          </span>
        )}
        {!expanded && <Tooltip name="Dashboard" />}
      </NavLink>

      <div className="w-6 h-px bg-[#1f2937] mb-1 mx-auto" />

      {/* Module nav items */}
      {MODULES.filter((m) => m.id !== "settings").map((mod) => (
        <div key={mod.id} className="relative px-2">
          <SidebarItem module={mod} expanded={expanded} />
          {/* Alert badge on Alerts module */}
          {mod.id === "alerts" && alertCount > 0 && (
            <span className="absolute top-0.5 left-8 w-3.5 h-3.5 bg-amber-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
              {alertCount > 99 ? "!" : alertCount}
            </span>
          )}
        </div>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <div className="px-2">
        {MODULES.filter((m) => m.id === "settings").map((mod) => (
          <SidebarItem key={mod.id} module={mod} expanded={expanded} />
        ))}
      </div>

      {/* Connection indicator */}
      <div className="mt-2 flex flex-col items-center gap-1 px-2">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            streaming ? "bg-emerald-500 animate-pulse" : connected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
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
