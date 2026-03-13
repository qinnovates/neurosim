/**
 * Dashboard — SIEM-style landing page with module tiles and system status.
 */
import { useNavigate } from "react-router-dom";
import { MODULES, CATEGORIES, type ModuleCategory, type ModuleDefinition } from "../registry";
import { useData } from "../../contexts/DataContext";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    "coming-soon": "bg-gray-500/15 text-gray-400 border-gray-500/30",
    beta: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };
  const labels: Record<string, string> = {
    active: "Active",
    "coming-soon": "Coming Soon",
    beta: "Beta",
  };
  return (
    <span
      className={`mono text-[9px] uppercase px-1.5 py-0.5 rounded border ${styles[status] || styles.active}`}
    >
      {labels[status] || status}
    </span>
  );
}

function ModuleTile({ module }: { module: ModuleDefinition }) {
  const navigate = useNavigate();
  const isActive = module.status === "active" || module.status === "beta";

  return (
    <button
      onClick={() => isActive && navigate(module.path)}
      disabled={!isActive}
      className={`group text-left p-4 rounded-xl border transition-all duration-200 ${
        isActive
          ? "bg-[#111827] border-[#1f2937] hover:border-[#374151] hover:bg-[#1a2332] cursor-pointer"
          : "bg-[#111827]/50 border-[#1f2937]/50 cursor-not-allowed opacity-60"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{module.icon}</span>
        <StatusBadge status={module.status} />
      </div>
      <h3
        className={`text-sm font-semibold mb-1 transition-colors ${
          isActive ? "text-gray-200 group-hover:text-white" : "text-gray-400"
        }`}
      >
        {module.name}
      </h3>
      <p className="text-[11px] text-gray-500 leading-relaxed">{module.description}</p>
    </button>
  );
}

function SystemStatus() {
  const { connected, streaming, sampleRate, channelNames, seq, alertCount } = useData();

  const stats = [
    { label: "Connection", value: connected ? "Online" : "Offline", color: connected ? "text-emerald-400" : "text-red-400" },
    { label: "Stream", value: streaming ? "Active" : "Idle", color: streaming ? "text-emerald-400" : "text-gray-400" },
    { label: "Sample Rate", value: `${sampleRate} Hz`, color: "text-gray-300" },
    { label: "Channels", value: `${channelNames.length}`, color: "text-gray-300" },
    { label: "Packets", value: seq.toLocaleString(), color: "text-gray-300" },
    { label: "Alerts", value: alertCount.toString(), color: alertCount > 0 ? "text-amber-400" : "text-gray-300" },
  ];

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 mb-6">
      <h2 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">System Status</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-[10px] mono text-gray-600 uppercase">{s.label}</div>
            <div className={`text-sm mono font-semibold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActions() {
  const { connected, streaming, startStreaming, stopStreaming } = useData();

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 mb-6">
      <h2 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h2>
      <div className="flex gap-2">
        {!streaming ? (
          <button
            onClick={startStreaming}
            disabled={!connected}
            className="mono text-xs px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Start Streaming
          </button>
        ) : (
          <button
            onClick={stopStreaming}
            className="mono text-xs px-4 py-2 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors"
          >
            Stop Streaming
          </button>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const categories = Object.keys(CATEGORIES) as ModuleCategory[];

  return (
    <div className="h-full overflow-auto p-6 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <svg width="28" height="28" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="4" fill="#0a0e17" />
            <path d="M8 16 Q12 8 16 16 Q20 24 24 16" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="16" cy="16" r="2" fill="#ef4444" />
          </svg>
          <h1 className="text-xl font-bold text-gray-100">NeuroSIM</h1>
          <span className="mono text-[10px] text-gray-600">v0.1.0</span>
        </div>
        <p className="text-sm text-gray-500 max-w-2xl">
          Neural Security Operations Simulator. Connect a brain-computer interface (or use synthetic data),
          monitor signals in real time, simulate attack scenarios, and test neural firewall defenses.
        </p>
      </div>

      {/* System status bar */}
      <SystemStatus />

      {/* Quick actions */}
      <QuickActions />

      {/* Module grid by category */}
      {categories.map((cat) => {
        const mods = MODULES.filter((m) => m.category === cat);
        const catInfo = CATEGORIES[cat];
        return (
          <div key={cat} className="mb-6">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-gray-300">{catInfo.label}</h2>
              <p className="text-[11px] text-gray-600">{catInfo.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mods.map((mod) => (
                <ModuleTile key={mod.id} module={mod} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Getting started */}
      <div className="mt-8 mb-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">Getting Started</h3>
        <ol className="text-[12px] text-gray-400 space-y-1.5 list-decimal list-inside">
          <li>The backend streams synthetic brain signals by default — no hardware needed</li>
          <li>Click <strong className="text-gray-300">Start Streaming</strong> above to begin</li>
          <li>Open the <strong className="text-gray-300">Signal Monitor</strong> to see live waveforms</li>
          <li>Check the <strong className="text-gray-300">Spectrum Analyzer</strong> to see frequency band activity</li>
          <li>Watch the <strong className="text-gray-300">Alert Center</strong> for anomaly detections</li>
          <li>Click the <strong className="text-gray-300">?</strong> button in any module for a detailed explanation</li>
        </ol>
        <p className="text-[11px] text-gray-600 mt-3">
          To connect real hardware (OpenBCI, Muse, etc.), update the board configuration in Settings.
        </p>
      </div>
    </div>
  );
}
