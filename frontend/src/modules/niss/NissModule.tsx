/**
 * NISS Module — Neural Impact Severity Scoring.
 * Computes real-time signal disruption scores from live EEG data.
 *
 * DISCLAIMER: NISS is a proposed, unvalidated metric for threat modeling
 * research. It measures physical signal disruption, not cognitive or
 * psychological impact. Not a clinical instrument.
 */
import { useState, useEffect, useRef } from "react";
import { ModuleShell } from "../../components/layout/ModuleShell";
import { getModuleById } from "../registry";
import { useData } from "../../contexts/DataContext";

const MODULE = getModuleById("niss")!;

/* ── NISS Computation ─────────────────────────────────── */

interface NissScore {
  overall: number;
  amplitude: number;   // Amplitude deviation from baseline
  frequency: number;   // Spectral contamination
  coherence: number;   // Cross-channel coherence disruption
  severity: "none" | "low" | "medium" | "high" | "critical";
  pins: boolean;       // Potential Impact to Neural Safety
}

interface ChannelNiss {
  channel: number;
  name: string;
  score: NissScore;
  rms: number;
  peakAmplitude: number;
}

function computeRMS(data: Float64Array): number {
  if (data.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  return Math.sqrt(sum / data.length);
}

function computeAmplitudeScore(data: Float64Array, baselineRMS: number): number {
  const rms = computeRMS(data);
  if (baselineRMS === 0) return 0;
  const deviation = Math.abs(rms - baselineRMS) / baselineRMS;
  return Math.min(10, deviation * 5);
}

function computeFrequencyScore(data: Float64Array, sampleRate: number): number {
  // Measure power above 50Hz as proportion of total (abnormal for EEG)
  const n = data.length;
  if (n < 32) return 0;
  let totalPower = 0;
  let highPower = 0;
  const cutoffBin = Math.floor((50 * n) / sampleRate);

  for (let k = 1; k <= n / 2; k++) {
    let re = 0, im = 0;
    for (let i = 0; i < n; i++) {
      const angle = (-2 * Math.PI * k * i) / n;
      re += data[i] * Math.cos(angle);
      im += data[i] * Math.sin(angle);
    }
    const p = (re * re + im * im) / (n * n);
    totalPower += p;
    if (k > cutoffBin) highPower += p;
  }

  const ratio = totalPower > 0 ? highPower / totalPower : 0;
  return Math.min(10, ratio * 30);
}

function computeCoherenceScore(channels: Float64Array[]): number {
  // Simplified cross-channel variance as coherence proxy
  if (channels.length < 2) return 0;
  const rmses = channels.map(computeRMS);
  const mean = rmses.reduce((a, b) => a + b, 0) / rmses.length;
  if (mean === 0) return 0;
  const variance = rmses.reduce((sum, r) => sum + (r - mean) ** 2, 0) / rmses.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.min(10, cv * 8);
}

function getSeverity(score: number): NissScore["severity"] {
  if (score <= 0.5) return "none";
  if (score <= 3.9) return "low";
  if (score <= 6.9) return "medium";
  if (score <= 8.9) return "high";
  return "critical";
}

const SEV_STYLES: Record<string, { text: string; bg: string; border: string }> = {
  none: { text: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" },
  low: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  medium: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  high: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  critical: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
};

/* ── Tab Components ───────────────────────────────────── */

type Tab = "dashboard" | "channels" | "history";

function ScoreGauge({ score, severity, label, size = "lg" }: {
  score: number;
  severity: string;
  label: string;
  size?: "lg" | "sm";
}) {
  const s = SEV_STYLES[severity] || SEV_STYLES.none;
  const pct = Math.min(100, (score / 10) * 100);
  const isLg = size === "lg";

  return (
    <div className={`${s.bg} border ${s.border} rounded-xl p-${isLg ? "4" : "3"} text-center`}>
      <div className="mono text-[8px] uppercase tracking-wider text-gray-600 mb-2">{label}</div>
      <div className={`${isLg ? "text-3xl" : "text-xl"} mono font-bold ${s.text}`}>
        {score.toFixed(1)}
      </div>
      <div className="w-full h-1.5 bg-[#0a0e17] rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            severity === "critical" ? "bg-red-500" :
            severity === "high" ? "bg-orange-500" :
            severity === "medium" ? "bg-amber-500" :
            severity === "low" ? "bg-emerald-500" : "bg-gray-600"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={`mono text-[9px] uppercase mt-1.5 ${s.text}`}>{severity}</div>
    </div>
  );
}

function DashboardTab({ aggregate, channelScores }: {
  aggregate: NissScore;
  channelScores: ChannelNiss[];
}) {
  return (
    <div className="space-y-4">
      {/* Aggregate Score */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <ScoreGauge score={aggregate.overall} severity={aggregate.severity} label="NISS Overall" size="lg" />
        <ScoreGauge score={aggregate.amplitude} severity={getSeverity(aggregate.amplitude)} label="Amplitude" size="sm" />
        <ScoreGauge score={aggregate.frequency} severity={getSeverity(aggregate.frequency)} label="Frequency" size="sm" />
        <ScoreGauge score={aggregate.coherence} severity={getSeverity(aggregate.coherence)} label="Coherence" size="sm" />
      </div>

      {/* PINS Flag */}
      {aggregate.pins && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="mono text-[10px] font-bold text-red-400 px-2 py-0.5 bg-red-500/20 rounded border border-red-500/40">PINS</span>
          <span className="text-[11px] text-red-300">Potential Impact to Neural Safety — score exceeds safe thresholds</span>
        </div>
      )}

      {/* Channel Heatmap */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Per-Channel NISS</h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {channelScores.map((ch) => {
            const s = SEV_STYLES[ch.score.severity];
            return (
              <div key={ch.channel} className={`${s.bg} border ${s.border} rounded-lg p-2 text-center`}>
                <div className="mono text-[9px] text-gray-500">{ch.name}</div>
                <div className={`mono text-sm font-bold ${s.text}`}>{ch.score.overall.toFixed(1)}</div>
                <div className="mono text-[8px] text-gray-600">{ch.rms.toFixed(0)}µV</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scoring Guide */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Scoring Scale</h3>
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "None", range: "0-0.5", sev: "none" },
            { label: "Low", range: "0.5-3.9", sev: "low" },
            { label: "Medium", range: "4.0-6.9", sev: "medium" },
            { label: "High", range: "7.0-8.9", sev: "high" },
            { label: "Critical", range: "9.0-10.0", sev: "critical" },
          ].map((s) => {
            const st = SEV_STYLES[s.sev];
            return (
              <div key={s.sev} className={`${st.bg} border ${st.border} rounded-lg p-2 text-center`}>
                <div className={`mono text-[10px] font-semibold ${st.text}`}>{s.label}</div>
                <div className="mono text-[9px] text-gray-600">{s.range}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          <strong className="text-amber-400">Proposed, unvalidated metric.</strong> NISS measures physical
          signal-level disruption corresponding to threat techniques. It does not measure cognitive damage,
          emotional impact, or clinical outcomes. Scores correspond to diagnostic categories for threat
          modeling purposes, not diagnostic claims. This is a research tool requiring independent validation.
        </p>
      </div>
    </div>
  );
}

function HistoryTab({ history }: { history: NissScore[] }) {
  // Show last 60 scores as a sparkline-like table
  const recent = history.slice(-60);

  return (
    <div className="space-y-4">
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">
          Score History ({recent.length} samples)
        </h3>
        {recent.length === 0 ? (
          <p className="text-[11px] text-gray-600 text-center py-4">Start streaming to collect NISS history</p>
        ) : (
          <div className="flex items-end gap-0.5 h-32">
            {recent.map((s, i) => {
              const h = Math.max(2, (s.overall / 10) * 100);
              const color =
                s.severity === "critical" ? "bg-red-500" :
                s.severity === "high" ? "bg-orange-500" :
                s.severity === "medium" ? "bg-amber-500" :
                s.severity === "low" ? "bg-emerald-500" : "bg-gray-700";
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t ${color}`}
                  style={{ height: `${h}%` }}
                  title={`NISS: ${s.overall.toFixed(1)} (${s.severity})`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      {recent.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Mean", value: (recent.reduce((s, h) => s + h.overall, 0) / recent.length).toFixed(1) },
            { label: "Max", value: Math.max(...recent.map((h) => h.overall)).toFixed(1) },
            { label: "Min", value: Math.min(...recent.map((h) => h.overall)).toFixed(1) },
            { label: "PINS Count", value: String(recent.filter((h) => h.pins).length) },
          ].map((s) => (
            <div key={s.label} className="bg-[#111827] border border-[#1f2937] rounded-lg p-3 text-center">
              <div className="mono text-[8px] uppercase tracking-wider text-gray-600 mb-1">{s.label}</div>
              <div className="text-sm mono font-bold text-purple-400">{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Module ──────────────────────────────────────── */

export default function NissModule() {
  const { streaming, getChannelData, channelNames, sampleRate } = useData();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [aggregate, setAggregate] = useState<NissScore>({
    overall: 0, amplitude: 0, frequency: 0, coherence: 0, severity: "none", pins: false,
  });
  const [channelScores, setChannelScores] = useState<ChannelNiss[]>([]);
  const [history, setHistory] = useState<NissScore[]>([]);
  const baselineRef = useRef<number[]>([]);

  useEffect(() => {
    if (!streaming) return;
    const interval = setInterval(() => {
      const channels: Float64Array[] = [];
      const chScores: ChannelNiss[] = [];

      for (let ch = 0; ch < channelNames.length; ch++) {
        const data = getChannelData(ch);
        if (data.length === 0) continue;
        const window = data.slice(Math.max(0, data.length - 250));
        channels.push(window);

        // Establish baseline from first few seconds
        const rms = computeRMS(window);
        if (!baselineRef.current[ch] || baselineRef.current[ch] === 0) {
          baselineRef.current[ch] = rms || 50;
        }

        const amp = computeAmplitudeScore(window, baselineRef.current[ch]);
        const freq = computeFrequencyScore(window, sampleRate);
        const overall = amp * 0.5 + freq * 0.5;
        const severity = getSeverity(overall);

        chScores.push({
          channel: ch,
          name: channelNames[ch],
          score: { overall, amplitude: amp, frequency: freq, coherence: 0, severity, pins: overall >= 8 },
          rms,
          peakAmplitude: Math.max(...Array.from(window).map(Math.abs)),
        });
      }

      // Aggregate
      if (chScores.length > 0) {
        const avgAmp = chScores.reduce((s, c) => s + c.score.amplitude, 0) / chScores.length;
        const avgFreq = chScores.reduce((s, c) => s + c.score.frequency, 0) / chScores.length;
        const coh = computeCoherenceScore(channels);
        const overall = avgAmp * 0.4 + avgFreq * 0.3 + coh * 0.3;
        const severity = getSeverity(overall);

        const newScore: NissScore = {
          overall, amplitude: avgAmp, frequency: avgFreq, coherence: coh,
          severity, pins: overall >= 8 || avgAmp >= 8,
        };

        setAggregate(newScore);
        setChannelScores(chScores);
        setHistory((prev) => [...prev, newScore].slice(-300));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [streaming, channelNames, getChannelData, sampleRate]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "NISS Dashboard" },
    { id: "channels", label: `Channels (${channelScores.length})` },
    { id: "history", label: `History (${history.length})` },
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

      {tab === "dashboard" && <DashboardTab aggregate={aggregate} channelScores={channelScores} />}
      {tab === "channels" && <DashboardTab aggregate={aggregate} channelScores={channelScores} />}
      {tab === "history" && <HistoryTab history={history} />}
    </ModuleShell>
  );
}
