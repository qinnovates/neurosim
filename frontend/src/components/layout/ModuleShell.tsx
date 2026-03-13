/**
 * Common wrapper for all modules — header with title, description, help toggle.
 */
import { useState, type ReactNode } from "react";
import type { ModuleDefinition } from "../../modules/registry";

interface ModuleShellProps {
  module: ModuleDefinition;
  children: ReactNode;
  actions?: ReactNode; // Optional controls in the header
}

export function ModuleShell({ module, children, actions }: ModuleShellProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Module header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-[#1f2937] bg-[#0d1117] flex-shrink-0">
        <div className="flex items-center gap-3">
          <module.Icon size={22} style={{ color: module.color }} />
          <div>
            <h1 className="text-sm font-semibold text-gray-200">{module.name}</h1>
            <p className="text-[11px] text-gray-500">{module.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`mono text-xs px-2 py-1 rounded transition-colors ${
              showHelp
                ? "bg-blue-500/20 text-blue-400"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
            title="Toggle help"
          >
            ?
          </button>
        </div>
      </header>

      {/* Help panel (collapsible) */}
      {showHelp && (
        <div className="px-4 py-3 bg-blue-500/5 border-b border-blue-500/20 text-[12px] text-gray-400 leading-relaxed flex-shrink-0">
          <div className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">ℹ</span>
            <div>
              <p>{module.detailedHelp}</p>
              {module.status !== "active" && (
                <p className="mt-2 text-amber-400/80">
                  This module is currently {module.status === "coming-soon" ? "in development" : "in beta"}. Some features may not be available yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Module content */}
      <div className="flex-1 overflow-auto p-3">{children}</div>
    </div>
  );
}
