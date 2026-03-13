/**
 * Persistent sidebar navigation — expanded with labels by default.
 * Coming-soon modules show a toast instead of dead navigation.
 * Icons color when active, grayscale when inactive.
 */
import { useState, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { MODULES, type ModuleDefinition } from "../../modules/registry";
import { useData } from "../../contexts/DataContext";

function SidebarItem({ module, expanded }: { module: ModuleDefinition; expanded: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === module.path;
  const isComingSoon = module.status === "coming-soon";
  const [showToast, setShowToast] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isComingSoon) {
        e.preventDefault();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      } else {
        navigate(module.path);
      }
    },
    [isComingSoon, module.path, navigate],
  );

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`w-full group relative flex items-center gap-3 h-10 rounded-lg transition-all duration-200 px-2.5 ${
          isActive
            ? "bg-white/10 ring-1 ring-white/20"
            : isComingSoon
              ? "opacity-40 hover:opacity-60 cursor-default"
              : "hover:bg-white/5 cursor-pointer"
        }`}
        title={isComingSoon ? `${module.name} — Coming Soon` : module.name}
      >
        <module.Icon
          size={18}
          style={{ color: isActive ? module.color : "#6b7280" }}
          className="flex-shrink-0 transition-colors duration-200"
        />
        {expanded && (
          <span
            className={`text-[11px] whitespace-nowrap overflow-hidden transition-colors duration-200 ${
              isActive
                ? "text-gray-200 font-medium"
                : isComingSoon
                  ? "text-gray-600"
                  : "text-gray-400"
            }`}
          >
            {module.shortName}
          </span>
        )}
        {!expanded && <Tooltip name={module.name} status={isComingSoon ? "Coming Soon" : undefined} />}
        {isComingSoon && expanded && (
          <span className="ml-auto text-[8px] mono text-gray-600 flex-shrink-0">Soon</span>
        )}
      </button>

      {/* Coming Soon toast */}
      {showToast && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-[10px] text-gray-300 whitespace-nowrap z-50 animate-fade-in shadow-lg">
          <span className="font-semibold">{module.name}</span>{" "}
          <span className="text-gray-500">is coming soon</span>
        </div>
      )}
    </div>
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
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const expanded = !collapsed;

  return (
    <aside
      className={`flex flex-col bg-[#0d1117] border-r border-[#1f2937] py-3 gap-1 flex-shrink-0 transition-all duration-200 ${
        expanded ? "w-44" : "w-14"
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
          <circle
            cx="16"
            cy="16"
            r="2"
            fill={isHome ? "#10b981" : "#6b7280"}
            style={{ transition: "fill 0.2s" }}
          />
        </svg>
        {expanded && (
          <span
            className={`text-[11px] font-semibold whitespace-nowrap transition-colors duration-200 ${isHome ? "text-gray-200" : "text-gray-400"}`}
          >
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
            <span className="absolute top-0.5 left-8 w-3.5 h-3.5 bg-amber-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold pointer-events-none">
              {alertCount > 99 ? "!" : alertCount}
            </span>
          )}
        </div>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Collapse toggle */}
      <div className="px-2 mb-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center h-8 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Settings */}
      <div className="px-2">
        {MODULES.filter((m) => m.id === "settings").map((mod) => (
          <SidebarItem key={mod.id} module={mod} expanded={expanded} />
        ))}
      </div>

      {/* Connection indicator */}
      <div className="mt-2 flex items-center gap-2 px-4 py-1">
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            streaming
              ? "bg-emerald-500 animate-pulse"
              : connected
                ? "bg-emerald-500"
                : "bg-amber-500 animate-pulse"
          }`}
        />
        {expanded && (
          <span className="text-[9px] mono text-gray-600">
            {streaming ? "STREAMING" : connected ? "CONNECTED" : "OFFLINE"}
          </span>
        )}
        {!expanded && (
          <span className="text-[8px] mono text-gray-600">
            {streaming ? "LIVE" : connected ? "OK" : "OFF"}
          </span>
        )}
      </div>
    </aside>
  );
}
