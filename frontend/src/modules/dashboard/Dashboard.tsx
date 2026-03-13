/**
 * Dashboard — Landing page with one-click Quick Start, KPI tiles, module grid.
 * Designed for first-time users to get data flowing in one click.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MODULES, CATEGORIES, type ModuleCategory, type ModuleDefinition } from "../registry";
import { useData } from "../../contexts/DataContext";
import { Sparkline } from "../../components/ui/Sparkline";
import { SeverityBadge } from "../../components/ui/SeverityBadge";

/* ── Helpers ──────────────────────────────────────────────── */

function useTickingHistory(value: number, maxLen = 30) {
  const history = useRef<number[]>([]);

  useEffect(() => {
    const id = setInterval(() => {
      history.current.push(value);
      if (history.current.length > maxLen) history.current = history.current.slice(-maxLen);
    }, 1000);
    return () => clearInterval(id);
  }, [value, maxLen]);

  return history;
}

function formatDelta(current: number, history: React.RefObject<number[]>) {
  const h = history.current;
  if (h.length < 5) return null;
  const delta = current - h[0];
  if (delta === 0) return null;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toLocaleString()}`;
}

function formatTimestamp() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/* ── Status Badge ─────────────────────────────────────────── */

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
    <span className={`mono text-[9px] uppercase px-1.5 py-0.5 rounded border ${styles[status] || styles.active}`}>
      {labels[status] || status}
    </span>
  );
}

/* ── KPI Tile ─────────────────────────────────────────────── */

interface KPITileProps {
  label: string;
  value: string;
  color: string;
  delta?: string | null;
  sparkData?: number[];
  sparkColor?: string;
  updatedAt?: string;
  onClick?: () => void;
}

function KPITile({ label, value, color, delta, sparkData, sparkColor, updatedAt, onClick }: KPITileProps) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-[#111827] border border-[#1f2937] rounded-xl p-3 hover:border-[#374151] hover:bg-[#1a2332] transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-1">
        <span className="text-[10px] mono text-gray-600 uppercase">{label}</span>
        {updatedAt && <span className="text-[8px] mono text-gray-700">{updatedAt}</span>}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className={`text-lg mono font-bold ${color}`}>{value}</div>
          {delta && (
            <span className={`text-[10px] mono ${delta.startsWith("+") ? "text-amber-400" : "text-emerald-400"}`}>
              {delta} in 30s
            </span>
          )}
        </div>
        {sparkData && sparkData.length > 1 && (
          <Sparkline data={sparkData} width={56} height={22} color={sparkColor || "#10b981"} />
        )}
      </div>
    </button>
  );
}

/* ── Module Tile ──────────────────────────────────────────── */

function ModuleTile({ module }: { module: ModuleDefinition }) {
  const navigate = useNavigate();
  const isComingSoon = module.status === "coming-soon";
  const [showToast, setShowToast] = useState(false);

  const handleClick = () => {
    if (isComingSoon) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } else {
      navigate(module.path);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`w-full group text-left p-4 rounded-xl border transition-all duration-200 ${
          isComingSoon
            ? "bg-[#111827]/50 border-[#1f2937]/50 opacity-60 hover:opacity-80 cursor-default"
            : "bg-[#111827] border-[#1f2937] hover:border-[#374151] hover:bg-[#1a2332] cursor-pointer"
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <module.Icon size={28} style={{ color: module.color }} />
          <StatusBadge status={module.status} />
        </div>
        <h3
          className={`text-sm font-semibold mb-1 transition-colors ${
            isComingSoon ? "text-gray-400" : "text-gray-200 group-hover:text-white"
          }`}
        >
          {module.name}
        </h3>
        <p className="text-[11px] text-gray-500 leading-relaxed">{module.description}</p>
      </button>

      {showToast && (
        <div className="absolute top-2 right-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-[10px] text-gray-300 z-50 shadow-lg">
          Coming soon
        </div>
      )}
    </div>
  );
}

/* ── Alert Summary ────────────────────────────────────────── */

function AlertSummary() {
  const { alerts } = useData();
  const navigate = useNavigate();

  if (alerts.length === 0) return null;

  const grouped = alerts.reduce<Record<string, number>>((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="mono text-xs text-gray-400 uppercase tracking-wider">Alert Summary</h2>
        <button
          onClick={() => navigate("/alerts")}
          className="mono text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View All
        </button>
      </div>
      <div className="flex gap-3">
        {["critical", "high", "medium", "low"].map((sev) =>
          grouped[sev] ? (
            <button
              key={sev}
              onClick={() => navigate("/alerts")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#1f2937] hover:border-[#374151] transition-colors"
            >
              <SeverityBadge severity={sev} size="sm" />
              <span className="mono text-sm text-gray-300 font-semibold">{grouped[sev]}</span>
            </button>
          ) : null,
        )}
      </div>
      <div className="mt-3 space-y-1">
        {alerts.slice(0, 3).map((a) => (
          <div key={a.id} className="flex items-center gap-2 text-[11px] mono text-gray-500">
            <SeverityBadge severity={a.severity} showLabel={false} size="sm" />
            <span className="text-gray-600">{new Date(a.ts * 1000).toLocaleTimeString()}</span>
            <span className="text-gray-400">{a.name}</span>
            <span>{a.value.toFixed(1)} uV</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Quick Start Hero ─────────────────────────────────────── */

function QuickStartHero() {
  const { connected, streaming, paused, startStreaming, stopStreaming, togglePause, send } = useData();
  const navigate = useNavigate();
  const [loadingDataset, setLoadingDataset] = useState<string | null>(null);

  const quickStartDataset = useCallback(
    (file: string, label: string) => {
      setLoadingDataset(label);
      send({ action: "load_dataset", file });
      setTimeout(() => {
        setLoadingDataset(null);
        navigate("/signal");
      }, 300);
    },
    [send, navigate],
  );

  // Already streaming — show controls
  if (streaming) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-emerald-400">Data is flowing</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={togglePause}
              className={`mono text-[10px] px-3 py-1.5 rounded-lg border transition-colors ${
                paused
                  ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                  : "text-gray-400 border-[#374151] hover:bg-white/5"
              }`}
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={stopStreaming}
              className="mono text-[10px] px-3 py-1.5 rounded-lg text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors"
            >
              Stop
            </button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { path: "/signal", label: "Signal Monitor", color: "#10b981" },
            { path: "/signal", label: "Spectrum Analyzer", color: "#a855f7" },
            { path: "/alerts", label: "Alert Center", color: "#ef4444" },
            { path: "/tara", label: "TARA Scanner", color: "#f59e0b" },
          ].map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="mono text-[10px] px-3 py-1.5 rounded-lg bg-[#111827] border border-[#1f2937] text-gray-300 hover:border-[#374151] hover:text-white transition-colors"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: link.color }} />
              {link.label}
            </button>
          ))}
        </div>
        {paused && (
          <p className="text-[10px] mono text-cyan-400/60 mt-2">
            Display paused — data continues in background. Click Resume to update.
          </p>
        )}
      </div>
    );
  }

  // Not connected (should not happen in demo mode, but keep as fallback)
  if (!connected) {
    return (
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="text-sm font-semibold text-amber-400">Initializing...</h2>
        </div>
        <p className="text-[12px] text-gray-400 mb-3 leading-relaxed">
          Loading the EEG engine. This should only take a moment.
        </p>
      </div>
    );
  }

  // Connected but not streaming — show Quick Start
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5 mb-6">
      <h2 className="text-sm font-semibold text-gray-200 mb-1">Quick Start</h2>
      <p className="text-[12px] text-gray-500 mb-4">
        Pick a data source and start exploring. No hardware needed.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Synthetic board */}
        <button
          onClick={() => {
            startStreaming();
            setTimeout(() => navigate("/signal"), 300);
          }}
          className="text-left p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all group"
        >
          <div className="text-[11px] font-semibold text-emerald-400 mb-1 group-hover:text-emerald-300">
            Synthetic Board
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            BrainFlow synthetic — continuous generated signals. Good for exploring the interface.
          </p>
        </button>

        {/* Sample datasets */}
        {[
          { file: "resting_eyes_closed.csv", label: "Eyes Closed", desc: "Alpha-dominant resting state", color: "#a855f7" },
          { file: "meditation_theta.csv", label: "Meditation", desc: "Enhanced frontal theta", color: "#8b5cf6" },
          { file: "seizure_simulation.csv", label: "Seizure Sim", desc: "Evolving epileptiform activity", color: "#ef4444" },
        ].map((ds) => (
          <button
            key={ds.file}
            onClick={() => quickStartDataset(ds.file, ds.label)}
            disabled={loadingDataset !== null}
            className="text-left p-3 rounded-xl bg-[#0d1117] border border-[#1f2937] hover:border-[#374151] hover:bg-[#1a2332] transition-all group disabled:opacity-50"
          >
            <div className="text-[11px] font-semibold text-gray-300 mb-1 group-hover:text-white" style={{ color: ds.color }}>
              {loadingDataset === ds.label ? "Loading..." : ds.label}
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">{ds.desc}</p>
          </button>
        ))}
      </div>

      <p className="text-[10px] text-gray-600 mt-3">
        More datasets available in{" "}
        <button onClick={() => navigate("/neurosim")} className="text-cyan-400 hover:text-cyan-300 transition-colors">
          NeuroSIM
        </button>
        . Connect real hardware in{" "}
        <button onClick={() => navigate("/settings")} className="text-cyan-400 hover:text-cyan-300 transition-colors">
          Settings
        </button>
        .
      </p>
    </div>
  );
}

/* ── State-Aware Getting Started ──────────────────────────── */

function GettingStarted() {
  const { connected, streaming } = useData();
  const navigate = useNavigate();

  const steps = [
    {
      label: "Engine ready",
      done: connected,
      action: connected ? undefined : "Initializing...",
    },
    {
      label: "Start streaming data",
      done: streaming,
      action: streaming ? undefined : "Use Quick Start above to load sample data",
    },
    {
      label: "View live signals",
      done: false, // Can't track this from here
      action: "Open Signal Monitor to see waveforms",
      onClick: () => navigate("/signal"),
    },
    {
      label: "Analyze frequency bands",
      done: false,
      action: "Check Spectrum Analyzer tab in Signal Monitor",
      onClick: () => navigate("/signal"),
    },
    {
      label: "Explore the platform",
      done: false,
      action: "Use \u2318K to search across all modules",
    },
  ];

  // Hide if already streaming (user doesn't need guidance anymore)
  if (streaming) return null;

  return (
    <div className="mt-6 mb-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
      <h3 className="text-sm font-semibold text-blue-400 mb-3">Getting Started</h3>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] mono font-bold ${
                step.done
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-[#1f2937] text-gray-500 border border-[#374151]"
              }`}
            >
              {step.done ? "\u2713" : i + 1}
            </div>
            <div>
              <span
                className={`text-[12px] ${step.done ? "text-emerald-400 line-through" : "text-gray-300 font-medium"}`}
              >
                {step.label}
              </span>
              {!step.done && step.action && (
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {step.onClick ? (
                    <button onClick={step.onClick} className="text-blue-400 hover:text-blue-300 transition-colors">
                      {step.action}
                    </button>
                  ) : (
                    step.action
                  )}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Dashboard ───────────────────────────────────────── */

export default function Dashboard() {
  const { connected, streaming, sampleRate, channelNames, seq, alertCount, alerts } = useData();
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);

  const seqHistory = useTickingHistory(seq);
  const alertHistory = useTickingHistory(alertCount);

  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const categories = Object.keys(CATEGORIES) as ModuleCategory[];
  const now = formatTimestamp();
  const critCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;

  return (
    <div className="h-full overflow-auto p-6 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <svg width="28" height="28" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="4" fill="#0a0e17" />
            <path
              d="M8 16 Q12 8 16 16 Q20 24 24 16"
              stroke="#10b981"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="16" cy="16" r="2" fill="#10b981" />
          </svg>
          <h1 className="text-xl font-bold text-gray-100">Open Neural Atlas</h1>
          <span className="mono text-[10px] text-gray-600">v0.2.0</span>
          <span className="mono text-[9px] text-gray-700">by Qinnovate</span>
        </div>
        <p className="text-sm text-gray-500 max-w-2xl">
          Next-gen neural monitoring platform. Connect a brain-computer interface or use synthetic data to
          explore real-time brain signals, analyze frequency patterns, and test security defenses.
        </p>
      </div>

      {/* Quick Start — context-aware hero */}
      <QuickStartHero />

      {/* KPI Tiles */}
      {(connected || streaming) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <KPITile
            label="Connection"
            value={connected ? "Online" : "Offline"}
            color={connected ? "text-emerald-400" : "text-red-400"}
            updatedAt={now}
          />
          <KPITile
            label="Stream"
            value={streaming ? "Active" : "Idle"}
            color={streaming ? "text-emerald-400" : "text-gray-400"}
            updatedAt={now}
          />
          <KPITile label="Sample Rate" value={`${sampleRate} Hz`} color="text-gray-300" />
          <KPITile label="Channels" value={`${channelNames.length}`} color="text-gray-300" />
          <KPITile
            label="Packets"
            value={seq.toLocaleString()}
            color="text-gray-300"
            delta={formatDelta(seq, seqHistory)}
            sparkData={[...seqHistory.current]}
            sparkColor="#10b981"
            updatedAt={now}
            onClick={() => navigate("/signal")}
          />
          <KPITile
            label="Alerts"
            value={alertCount.toString()}
            color={alertCount > 0 ? "text-amber-400" : "text-gray-300"}
            delta={formatDelta(alertCount, alertHistory)}
            sparkData={[...alertHistory.current]}
            sparkColor={critCount > 0 ? "#ef4444" : highCount > 0 ? "#f97316" : "#f59e0b"}
            updatedAt={now}
            onClick={() => navigate("/alerts")}
          />
        </div>
      )}

      {/* Alert summary */}
      <AlertSummary />

      {/* Module grid by category */}
      {categories.map((cat) => {
        const mods = MODULES.filter((m) => m.category === cat && !m.hidden);
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

      {/* Getting Started — state-aware, hides when streaming */}
      <GettingStarted />
    </div>
  );
}
