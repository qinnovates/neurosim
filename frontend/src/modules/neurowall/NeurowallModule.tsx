/**
 * Neurowall — Neural Firewall for BCI signal protection.
 * Monitors live EEG data against configurable security rules,
 * detects violations, and shows real-time enforcement status.
 *
 * DISCLAIMER: Proposed research tool, not a validated security product.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { ModuleShell } from "../../components/layout/ModuleShell";
import { getModuleById } from "../registry";
import { useData } from "../../contexts/DataContext";

const MODULE = getModuleById("neurowall")!;

/* ── Rule Engine ──────────────────────────────────────── */

type RuleAction = "alert" | "attenuate" | "block";
type RuleSeverity = "critical" | "high" | "medium" | "low";

interface FirewallRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: "amplitude" | "frequency" | "coherence" | "rate" | "pattern";
  severity: RuleSeverity;
  action: RuleAction;
  /** Check function returns violation magnitude 0-1 (0 = no violation) */
  check: (channelData: Float64Array, sampleRate: number) => number;
}

function makeAmplitudeRule(maxUV: number): (data: Float64Array) => number {
  return (data) => {
    let maxVal = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > maxVal) maxVal = abs;
    }
    return maxVal > maxUV ? Math.min(1, (maxVal - maxUV) / maxUV) : 0;
  };
}

function makeFrequencyGuard(
  minHz: number,
  maxHz: number,
  powerThreshold: number,
): (data: Float64Array, sr: number) => number {
  return (data, sr) => {
    // Simple DFT power in the guarded band
    const n = data.length;
    if (n < 16) return 0;
    let power = 0;
    const binMin = Math.floor((minHz * n) / sr);
    const binMax = Math.ceil((maxHz * n) / sr);
    for (let k = binMin; k <= Math.min(binMax, n / 2); k++) {
      let re = 0, im = 0;
      for (let i = 0; i < n; i++) {
        const angle = (-2 * Math.PI * k * i) / n;
        re += data[i] * Math.cos(angle);
        im += data[i] * Math.sin(angle);
      }
      power += (re * re + im * im) / (n * n);
    }
    return power > powerThreshold ? Math.min(1, power / (powerThreshold * 3)) : 0;
  };
}

function makeRateLimitRule(maxSpikesPerSec: number, spikeThresholdUV: number): (data: Float64Array, sr: number) => number {
  return (data, sr) => {
    let spikes = 0;
    for (let i = 1; i < data.length; i++) {
      if (Math.abs(data[i] - data[i - 1]) > spikeThresholdUV) spikes++;
    }
    const spikesPerSec = spikes * (sr / data.length);
    return spikesPerSec > maxSpikesPerSec ? Math.min(1, (spikesPerSec - maxSpikesPerSec) / maxSpikesPerSec) : 0;
  };
}

const DEFAULT_RULES: FirewallRule[] = [
  {
    id: "amp-absolute",
    name: "Amplitude Ceiling",
    description: "Block signals exceeding safe amplitude bounds (±500µV)",
    enabled: true,
    category: "amplitude",
    severity: "critical",
    action: "block",
    check: makeAmplitudeRule(500),
  },
  {
    id: "amp-warning",
    name: "Amplitude Warning",
    description: "Alert on signals exceeding normal range (±200µV)",
    enabled: true,
    category: "amplitude",
    severity: "medium",
    action: "alert",
    check: makeAmplitudeRule(200),
  },
  {
    id: "freq-injection",
    name: "Frequency Injection Guard",
    description: "Detect power injection outside normal EEG bands (>80Hz)",
    enabled: true,
    category: "frequency",
    severity: "high",
    action: "attenuate",
    check: makeFrequencyGuard(80, 125, 50),
  },
  {
    id: "freq-dc",
    name: "DC Offset Guard",
    description: "Detect abnormal DC drift (<0.1Hz high power)",
    enabled: true,
    category: "frequency",
    severity: "low",
    action: "alert",
    check: makeFrequencyGuard(0, 0.1, 200),
  },
  {
    id: "rate-limit",
    name: "Spike Rate Limiter",
    description: "Detect excessive rapid transitions (>50/sec) suggesting injection",
    enabled: true,
    category: "rate",
    severity: "high",
    action: "attenuate",
    check: makeRateLimitRule(50, 100),
  },
  {
    id: "pattern-saturation",
    name: "Saturation Detector",
    description: "Detect sustained rail (max/min amplitude for >100ms)",
    enabled: true,
    category: "pattern",
    severity: "critical",
    action: "block",
    check: (data) => {
      let railCount = 0;
      for (let i = 0; i < data.length; i++) {
        if (Math.abs(data[i]) > 490) railCount++;
      }
      const railFraction = railCount / data.length;
      return railFraction > 0.1 ? railFraction : 0;
    },
  },
];

/* ── Detection Event ──────────────────────────────────── */

interface Detection {
  id: number;
  ruleId: string;
  ruleName: string;
  severity: RuleSeverity;
  action: RuleAction;
  channel: number;
  channelName: string;
  magnitude: number;
  timestamp: number;
}

/* ── Severity Helpers ─────────────────────────────────── */

const SEV_COLORS: Record<RuleSeverity, string> = {
  critical: "text-red-400 bg-red-500/15 border-red-500/30",
  high: "text-orange-400 bg-orange-500/15 border-orange-500/30",
  medium: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  low: "text-gray-400 bg-gray-500/15 border-gray-500/30",
};

const ACTION_COLORS: Record<RuleAction, string> = {
  block: "text-red-400",
  attenuate: "text-orange-400",
  alert: "text-blue-400",
};

const CAT_COLORS: Record<string, string> = {
  amplitude: "text-red-400",
  frequency: "text-purple-400",
  coherence: "text-cyan-400",
  rate: "text-amber-400",
  pattern: "text-pink-400",
};

/* ── Tab Components ───────────────────────────────────── */

type Tab = "monitor" | "rules" | "detections";

function MonitorTab({
  rules,
  detections,
  stats,
}: {
  rules: FirewallRule[];
  detections: Detection[];
  stats: { passed: number; blocked: number; attenuated: number; alerted: number };
}) {
  const { streaming, channelNames } = useData();
  const enabledCount = rules.filter((r) => r.enabled).length;
  const recentDetections = detections.slice(-20).reverse();

  return (
    <div className="space-y-4">
      {/* Status Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-3 text-center">
          <div className="mono text-[8px] uppercase tracking-wider text-gray-600 mb-1">Status</div>
          <div className={`text-sm mono font-bold ${streaming ? "text-emerald-400" : "text-gray-500"}`}>
            {streaming ? "ACTIVE" : "STANDBY"}
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-3 text-center">
          <div className="mono text-[8px] uppercase tracking-wider text-gray-600 mb-1">Rules</div>
          <div className="text-sm mono font-bold text-blue-400">{enabledCount} / {rules.length}</div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-3 text-center">
          <div className="mono text-[8px] uppercase tracking-wider text-gray-600 mb-1">Passed</div>
          <div className="text-sm mono font-bold text-emerald-400">{stats.passed.toLocaleString()}</div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-3 text-center">
          <div className="mono text-[8px] uppercase tracking-wider text-gray-600 mb-1">Blocked</div>
          <div className="text-sm mono font-bold text-red-400">{stats.blocked}</div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-3 text-center">
          <div className="mono text-[8px] uppercase tracking-wider text-gray-600 mb-1">Alerts</div>
          <div className="text-sm mono font-bold text-amber-400">{stats.alerted}</div>
        </div>
      </div>

      {/* Per-Channel Status Grid */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Channel Protection Status</h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {channelNames.map((name, i) => {
            const channelDetections = recentDetections.filter((d) => d.channel === i);
            const hasBlock = channelDetections.some((d) => d.action === "block");
            const hasAlert = channelDetections.some((d) => d.action === "alert" || d.action === "attenuate");
            const color = hasBlock ? "border-red-500/50 bg-red-500/10" : hasAlert ? "border-amber-500/50 bg-amber-500/10" : "border-emerald-500/30 bg-emerald-500/5";
            const dot = hasBlock ? "bg-red-400" : hasAlert ? "bg-amber-400" : "bg-emerald-400";

            return (
              <div key={i} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border mono text-[10px] ${color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className="text-gray-300">{name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Detections Feed */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">
          Detection Feed {recentDetections.length > 0 && <span className="text-amber-400">({recentDetections.length})</span>}
        </h3>
        {recentDetections.length === 0 ? (
          <p className="text-[11px] text-gray-600 text-center py-4">
            {streaming ? "No detections — all signals within safe bounds" : "Start streaming to begin monitoring"}
          </p>
        ) : (
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {recentDetections.map((d) => (
              <div key={d.id} className="flex items-center gap-2 px-2 py-1.5 bg-[#0a0e17] rounded text-[10px] mono">
                <span className={`px-1.5 py-0.5 rounded border text-[8px] uppercase ${SEV_COLORS[d.severity]}`}>
                  {d.severity}
                </span>
                <span className={ACTION_COLORS[d.action]}>{d.action}</span>
                <span className="text-gray-500">{d.channelName}</span>
                <span className="text-gray-400 flex-1">{d.ruleName}</span>
                <span className="text-gray-600">{(d.magnitude * 100).toFixed(0)}%</span>
                <span className="text-gray-700">{new Date(d.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RulesTab({
  rules,
  onToggle,
}: {
  rules: FirewallRule[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className={`bg-[#111827] border rounded-lg p-3 transition-colors ${
            rule.enabled ? "border-[#1f2937]" : "border-[#1f2937] opacity-50"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggle(rule.id)}
                className={`w-8 h-4 rounded-full transition-colors relative ${
                  rule.enabled ? "bg-emerald-500/30" : "bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                    rule.enabled ? "left-4 bg-emerald-400" : "left-0.5 bg-gray-500"
                  }`}
                />
              </button>
              <span className="text-[12px] font-semibold text-gray-200">{rule.name}</span>
              <span className={`mono text-[8px] uppercase px-1.5 py-0.5 rounded border ${SEV_COLORS[rule.severity]}`}>
                {rule.severity}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`mono text-[9px] uppercase ${CAT_COLORS[rule.category]}`}>{rule.category}</span>
              <span className={`mono text-[9px] uppercase font-bold ${ACTION_COLORS[rule.action]}`}>
                {rule.action}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500">{rule.description}</p>
        </div>
      ))}

      {/* Disclaimer */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          <strong className="text-amber-400">Research simulation.</strong> These rules demonstrate the concept of
          neural signal firewalling. In a production system, rules would be validated against clinical safety
          standards and real-world BCI hardware characteristics. This is a proposed, unvalidated security tool.
        </p>
      </div>
    </div>
  );
}

function DetectionsTab({ detections }: { detections: Detection[] }) {
  const sevCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  detections.forEach((d) => sevCounts[d.severity]++);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {(["critical", "high", "medium", "low"] as const).map((sev) => (
          <div key={sev} className="bg-[#111827] border border-[#1f2937] rounded-lg p-3 text-center">
            <div className={`text-lg mono font-bold ${SEV_COLORS[sev].split(" ")[0]}`}>{sevCounts[sev]}</div>
            <div className="mono text-[8px] uppercase tracking-wider text-gray-600 mt-1">{sev}</div>
          </div>
        ))}
      </div>

      {/* Full log */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">
          All Detections ({detections.length})
        </h3>
        {detections.length === 0 ? (
          <p className="text-[11px] text-gray-600 text-center py-4">No detections recorded this session</p>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {[...detections].reverse().map((d) => (
              <div key={d.id} className="flex items-center gap-2 px-2 py-1.5 bg-[#0a0e17] rounded text-[10px] mono">
                <span className={`px-1.5 py-0.5 rounded border text-[8px] uppercase ${SEV_COLORS[d.severity]}`}>
                  {d.severity}
                </span>
                <span className={`w-16 ${ACTION_COLORS[d.action]}`}>{d.action}</span>
                <span className="text-gray-500 w-8">{d.channelName}</span>
                <span className="text-gray-400 flex-1">{d.ruleName}</span>
                <span className="text-gray-600 w-10 text-right">{(d.magnitude * 100).toFixed(0)}%</span>
                <span className="text-gray-700 w-20 text-right">{new Date(d.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Module ──────────────────────────────────────── */

export default function NeurowallModule() {
  const { streaming, getChannelData, channelNames, sampleRate } = useData();
  const [tab, setTab] = useState<Tab>("monitor");
  const [rules, setRules] = useState<FirewallRule[]>(DEFAULT_RULES);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [stats, setStats] = useState({ passed: 0, blocked: 0, attenuated: 0, alerted: 0 });
  const detectionId = useRef(0);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }, []);

  // Run firewall checks on live data
  useEffect(() => {
    if (!streaming) return;
    const interval = setInterval(() => {
      const enabledRules = rules.filter((r) => r.enabled);
      let passed = 0;
      const newDetections: Detection[] = [];

      for (let ch = 0; ch < channelNames.length; ch++) {
        const data = getChannelData(ch);
        if (data.length === 0) continue;

        // Take last 250 samples (~1 second)
        const window = data.slice(Math.max(0, data.length - 250));
        let channelClean = true;

        for (const rule of enabledRules) {
          const magnitude = rule.check(window, sampleRate);
          if (magnitude > 0) {
            channelClean = false;
            newDetections.push({
              id: detectionId.current++,
              ruleId: rule.id,
              ruleName: rule.name,
              severity: rule.severity,
              action: rule.action,
              channel: ch,
              channelName: channelNames[ch],
              magnitude,
              timestamp: Date.now(),
            });
          }
        }
        if (channelClean) passed++;
      }

      if (newDetections.length > 0) {
        setDetections((prev) => [...prev, ...newDetections].slice(-500));
      }

      setStats((prev) => ({
        passed: prev.passed + passed,
        blocked: prev.blocked + newDetections.filter((d) => d.action === "block").length,
        attenuated: prev.attenuated + newDetections.filter((d) => d.action === "attenuate").length,
        alerted: prev.alerted + newDetections.filter((d) => d.action === "alert").length,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [streaming, rules, channelNames, getChannelData, sampleRate]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "monitor", label: "Firewall Monitor" },
    { id: "rules", label: `Rules (${rules.filter((r) => r.enabled).length})` },
    { id: "detections", label: `Detections (${detections.length})` },
  ];

  return (
    <ModuleShell module={MODULE}>
      <div className="flex gap-1 mb-4 border-b border-[#1f2937] pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`mono text-[11px] px-3 py-1.5 rounded-t transition-colors ${
              tab === t.id
                ? "bg-[#111827] text-gray-200 border border-[#1f2937] border-b-transparent"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "monitor" && <MonitorTab rules={rules} detections={detections} stats={stats} />}
      {tab === "rules" && <RulesTab rules={rules} onToggle={toggleRule} />}
      {tab === "detections" && <DetectionsTab detections={detections} />}
    </ModuleShell>
  );
}
