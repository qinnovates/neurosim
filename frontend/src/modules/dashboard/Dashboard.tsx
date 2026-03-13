/**
 * Dashboard — SIEM-style landing page with KPI tiles, sparklines, module grid.
 * Patterns from Splunk ES, Elastic Security, Microsoft Sentinel.
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MODULES, CATEGORIES, type ModuleCategory, type ModuleDefinition } from "../registry";
import { useData } from "../../contexts/DataContext";
import { Sparkline } from "../../components/ui/Sparkline";
import { SeverityBadge } from "../../components/ui/SeverityBadge";

/* ── Helpers ────────────────────────────────────────────── */

function useTickingHistory(value: number, maxLen = 30) {
  const history = useRef<number[]>([]);
  const prev = useRef(value);

  useEffect(() => {
    const id = setInterval(() => {
      history.current.push(value);
      if (history.current.length > maxLen) history.current = history.current.slice(-maxLen);
      prev.current = value;
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

/* ── Status Badge ───────────────────────────────────────── */

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

/* ── KPI Tile ───────────────────────────────────────────── */

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
        {updatedAt && (
          <span className="text-[8px] mono text-gray-700">{updatedAt}</span>
        )}
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

/* ── Module Tile ────────────────────────────────────────── */

function ModuleTile({ module }: { module: ModuleDefinition }) {
  const navigate = useNavigate();
  const isComingSoon = module.status === "coming-soon";

  return (
    <button
      onClick={() => navigate(module.path)}
      className={`group text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
        isComingSoon
          ? "bg-[#111827]/50 border-[#1f2937]/50 opacity-60 hover:opacity-80 hover:border-[#374151]"
          : "bg-[#111827] border-[#1f2937] hover:border-[#374151] hover:bg-[#1a2332]"
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
  );
}

/* ── Alert Summary (grouped by severity) ────────────────── */

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
          View All →
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
      {/* Latest 3 alerts */}
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

/* ── Quick Actions ──────────────────────────────────────── */

function QuickActions() {
  const { connected, streaming, paused, startStreaming, stopStreaming, togglePause } = useData();

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
          <>
            <button
              onClick={stopStreaming}
              className="mono text-xs px-4 py-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
            >
              Stop Streaming
            </button>
            <button
              onClick={togglePause}
              className={`mono text-xs px-4 py-2 rounded-lg border transition-colors ${
                paused
                  ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/25"
                  : "bg-[#1f2937] text-gray-400 border-[#374151] hover:bg-[#374151]"
              }`}
            >
              {paused ? "▶ Resume" : "⏸ Pause"}
            </button>
          </>
        )}
      </div>
      {paused && (
        <p className="text-[10px] mono text-cyan-400/60 mt-2">
          Display paused — data is still streaming in the background. Click Resume to update.
        </p>
      )}
    </div>
  );
}

/* ── Main Dashboard ─────────────────────────────────────── */

export default function Dashboard() {
  const { connected, streaming, sampleRate, channelNames, seq, alertCount, alerts } = useData();
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);

  // Track metric history for sparklines
  const seqHistory = useTickingHistory(seq);
  const alertHistory = useTickingHistory(alertCount);

  // Force re-render every second so sparklines and deltas update
  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const categories = Object.keys(CATEGORIES) as ModuleCategory[];
  const now = formatTimestamp();

  // Severity counts for KPI
  const critCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;

  return (
    <div className="h-full overflow-auto p-6 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <svg width="28" height="28" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="4" fill="#0a0e17" />
            <path d="M8 16 Q12 8 16 16 Q20 24 24 16" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="16" cy="16" r="2" fill="#10b981" />
          </svg>
          <h1 className="text-xl font-bold text-gray-100">Open Neural Atlas</h1>
          <span className="mono text-[10px] text-gray-600">v0.2.0</span>
          <span className="mono text-[9px] text-gray-700">by Qinnovate</span>
        </div>
        <p className="text-sm text-gray-500 max-w-2xl">
          Next-gen neural monitoring platform. Connect a brain-computer interface (or use synthetic data),
          monitor multi-modal biosignals in real time, analyze brain activity, and explore security defenses.
        </p>
      </div>

      {/* KPI Tiles — clickable, with sparklines and trend deltas */}
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
        <KPITile
          label="Sample Rate"
          value={`${sampleRate} Hz`}
          color="text-gray-300"
        />
        <KPITile
          label="Channels"
          value={`${channelNames.length}`}
          color="text-gray-300"
        />
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

      {/* Alert summary (grouped by severity) */}
      <AlertSummary />

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
          <li>Use <strong className="text-gray-300">⌘K</strong> to search across all modules</li>
          <li>Click the <strong className="text-gray-300">?</strong> button in any module for a detailed explanation</li>
        </ol>
        <p className="text-[11px] text-gray-600 mt-3">
          To connect real hardware (OpenBCI, Muse, etc.), update the board configuration in Settings.
        </p>
      </div>
    </div>
  );
}
