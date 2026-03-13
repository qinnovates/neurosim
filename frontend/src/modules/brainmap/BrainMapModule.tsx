/**
 * Brain Map — 2D topographic electrode map using 10-20 system.
 * Shows real-time signal amplitude per electrode on a head diagram.
 *
 * Note: Electrode positions measure scalp-level electrical activity,
 * which is an aggregate of many neurons. It does not pinpoint specific
 * brain structures.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { ModuleShell } from "../../components/layout/ModuleShell";
import { getModuleById } from "../registry";
import { useData } from "../../contexts/DataContext";

const MODULE = getModuleById("brainmap")!;

/* ── 10-20 Electrode Positions ────────────────────────── */

interface Electrode {
  name: string;
  /** Normalized x position (0-1, center = 0.5) */
  x: number;
  /** Normalized y position (0-1, front = 0, back = 1) */
  y: number;
  /** Brain region */
  region: string;
  /** Channel index in the data array */
  channelIndex: number;
}

// Standard 10-20 system positions mapped to our 16-channel layout
const ELECTRODES: Electrode[] = [
  { name: "Fp1", x: 0.35, y: 0.12, region: "Prefrontal L", channelIndex: 0 },
  { name: "Fp2", x: 0.65, y: 0.12, region: "Prefrontal R", channelIndex: 1 },
  { name: "F3",  x: 0.30, y: 0.30, region: "Frontal L", channelIndex: 2 },
  { name: "F4",  x: 0.70, y: 0.30, region: "Frontal R", channelIndex: 3 },
  { name: "C3",  x: 0.25, y: 0.50, region: "Central L", channelIndex: 4 },
  { name: "C4",  x: 0.75, y: 0.50, region: "Central R", channelIndex: 5 },
  { name: "P3",  x: 0.30, y: 0.70, region: "Parietal L", channelIndex: 6 },
  { name: "P4",  x: 0.70, y: 0.70, region: "Parietal R", channelIndex: 7 },
  { name: "O1",  x: 0.35, y: 0.88, region: "Occipital L", channelIndex: 8 },
  { name: "O2",  x: 0.65, y: 0.88, region: "Occipital R", channelIndex: 9 },
  { name: "F7",  x: 0.15, y: 0.28, region: "Anterior Temporal L", channelIndex: 10 },
  { name: "F8",  x: 0.85, y: 0.28, region: "Anterior Temporal R", channelIndex: 11 },
  { name: "T3",  x: 0.10, y: 0.50, region: "Mid Temporal L", channelIndex: 12 },
  { name: "T4",  x: 0.90, y: 0.50, region: "Mid Temporal R", channelIndex: 13 },
  { name: "Pz",  x: 0.50, y: 0.70, region: "Parietal Midline", channelIndex: 14 },
  { name: "Oz",  x: 0.50, y: 0.88, region: "Occipital Midline", channelIndex: 15 },
];

/* ── Band Filter ──────────────────────────────────────── */

type BandFilter = "all" | "delta" | "theta" | "alpha" | "beta" | "gamma";

const BAND_COLORS: Record<BandFilter, string> = {
  all: "text-gray-300",
  delta: "text-purple-400",
  theta: "text-cyan-400",
  alpha: "text-emerald-400",
  beta: "text-amber-400",
  gamma: "text-red-400",
};

/* ── Canvas Head Map ──────────────────────────────────── */

function HeadMap({
  amplitudes,
  selectedElectrode,
  onSelect,
}: {
  amplitudes: number[];
  selectedElectrode: number | null;
  onSelect: (idx: number | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 400;
  const H = 440;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    // Head outline
    const cx = W / 2;
    const cy = H / 2 + 10;
    const headR = 170;

    // Head fill
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.ellipse(cx, cy, headR, headR * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head border
    ctx.strokeStyle = "rgba(100,140,200,0.2)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, headR, headR * 1.05, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Nose indicator
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - headR * 1.05 + 5);
    ctx.lineTo(cx, cy - headR * 1.05 - 12);
    ctx.lineTo(cx + 12, cy - headR * 1.05 + 5);
    ctx.strokeStyle = "rgba(100,140,200,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ears
    ctx.beginPath();
    ctx.ellipse(cx - headR - 5, cy, 8, 20, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx + headR + 5, cy, 8, 20, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Midline crosshair
    ctx.strokeStyle = "rgba(100,140,200,0.08)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - headR);
    ctx.lineTo(cx, cy + headR);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - headR, cy);
    ctx.lineTo(cx + headR, cy);
    ctx.stroke();

    // Heatmap interpolation (bilinear across electrode positions)
    const mapR = headR * 0.92;
    for (let py = -mapR; py <= mapR; py += 4) {
      for (let px = -mapR; px <= mapR; px += 4) {
        const dist = Math.sqrt(px * px + py * py);
        if (dist > mapR) continue;

        // Weighted interpolation from nearby electrodes
        let weightedSum = 0;
        let weightTotal = 0;
        for (let i = 0; i < ELECTRODES.length; i++) {
          const ex = (ELECTRODES[i].x - 0.5) * headR * 2;
          const ey = (ELECTRODES[i].y - 0.5) * headR * 2 + 10;
          const d = Math.sqrt((px - ex) ** 2 + (py - ey) ** 2);
          const w = 1 / (1 + d * d * 0.001);
          weightedSum += (amplitudes[i] || 0) * w;
          weightTotal += w;
        }

        const val = weightTotal > 0 ? weightedSum / weightTotal : 0;
        const normalized = Math.min(1, val / 200); // Normalize to ~200µV

        // Color: blue → green → yellow → red
        let r: number, g: number, b: number;
        if (normalized < 0.25) {
          r = 20; g = 40 + normalized * 400; b = 100 + normalized * 400;
        } else if (normalized < 0.5) {
          const t = (normalized - 0.25) * 4;
          r = 20 + t * 60; g = 140 + t * 80; b = 200 - t * 100;
        } else if (normalized < 0.75) {
          const t = (normalized - 0.5) * 4;
          r = 80 + t * 170; g = 220 - t * 40; b = 100 - t * 80;
        } else {
          const t = (normalized - 0.75) * 4;
          r = 250; g = 180 - t * 140; b = 20;
        }

        ctx.fillStyle = `rgba(${r},${g},${b},0.35)`;
        ctx.fillRect(cx + px - 2, cy + py - 2, 4, 4);
      }
    }

    // Draw electrodes
    for (let i = 0; i < ELECTRODES.length; i++) {
      const e = ELECTRODES[i];
      const ex = cx + (e.x - 0.5) * headR * 2;
      const ey = cy + (e.y - 0.5) * headR * 2;
      const amp = amplitudes[i] || 0;
      const isSelected = selectedElectrode === i;

      // Amplitude-based color
      const normalized = Math.min(1, amp / 200);
      const hue = (1 - normalized) * 120; // 120=green, 0=red

      // Electrode dot
      ctx.beginPath();
      ctx.arc(ex, ey, isSelected ? 10 : 7, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${isSelected ? 1 : 0.8})`;
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#fff" : "rgba(255,255,255,0.3)";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = "rgba(200,210,240,0.8)";
      ctx.font = `${isSelected ? "bold " : ""}10px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(e.name, ex, ey - 12);

      // Amplitude value
      ctx.fillStyle = "rgba(200,210,240,0.5)";
      ctx.font = "8px monospace";
      ctx.fillText(`${amp.toFixed(0)}µV`, ex, ey + 18);
    }

    // Labels
    ctx.fillStyle = "rgba(100,140,200,0.4)";
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Front", cx, 18);
    ctx.fillText("Back", cx, H - 8);
    ctx.fillText("L", 16, cy);
    ctx.fillText("R", W - 16, cy);
  }, [amplitudes, selectedElectrode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = W / 2;
    const cy = H / 2 + 10;
    const headR = 170;

    for (let i = 0; i < ELECTRODES.length; i++) {
      const ex = cx + (ELECTRODES[i].x - 0.5) * headR * 2;
      const ey = cy + (ELECTRODES[i].y - 0.5) * headR * 2;
      if (Math.sqrt((mx - ex) ** 2 + (my - ey) ** 2) < 14) {
        onSelect(selectedElectrode === i ? null : i);
        return;
      }
    }
    onSelect(null);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{ borderRadius: "0.75rem", border: "1px solid rgba(100,140,200,0.15)", cursor: "pointer" }}
    />
  );
}

/* ── Main Module ──────────────────────────────────────── */

export default function BrainMapModule() {
  const { streaming, getChannelData, channelNames, bands } = useData();
  const [amplitudes, setAmplitudes] = useState<number[]>(new Array(16).fill(0));
  const [selectedElectrode, setSelectedElectrode] = useState<number | null>(null);
  const [bandFilter, setBandFilter] = useState<BandFilter>("all");

  // Compute per-channel RMS amplitude
  useEffect(() => {
    if (!streaming) return;
    const interval = setInterval(() => {
      const amps = new Array(16).fill(0);
      for (let ch = 0; ch < Math.min(16, channelNames.length); ch++) {
        const data = getChannelData(ch);
        if (data.length === 0) continue;
        const window = data.slice(Math.max(0, data.length - 125)); // ~500ms
        let sum = 0;
        for (let i = 0; i < window.length; i++) sum += window[i] * window[i];
        amps[ch] = Math.sqrt(sum / window.length);
      }
      setAmplitudes(amps);
    }, 200);
    return () => clearInterval(interval);
  }, [streaming, channelNames, getChannelData]);

  const selected = selectedElectrode !== null ? ELECTRODES[selectedElectrode] : null;

  return (
    <ModuleShell module={MODULE}>
      <div className="space-y-4">
        {/* Band filter */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "delta", "theta", "alpha", "beta", "gamma"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBandFilter(b)}
              className={`mono text-[10px] px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                bandFilter === b
                  ? `bg-[#111827] ${BAND_COLORS[b]} border-[#374151]`
                  : "text-gray-500 border-[#1f2937] hover:text-gray-300"
              }`}
            >
              {b === "all" ? "All Bands" : b}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Head map */}
          <div className="flex-shrink-0">
            <HeadMap
              amplitudes={amplitudes}
              selectedElectrode={selectedElectrode}
              onSelect={setSelectedElectrode}
            />
          </div>

          {/* Side panel */}
          <div className="flex-1 space-y-3">
            {/* Selected electrode detail */}
            {selected ? (
              <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
                <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">
                  Electrode Detail — {selected.name}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mono text-[9px] text-gray-600 uppercase">Position</div>
                    <div className="text-sm text-gray-300">{selected.region}</div>
                  </div>
                  <div>
                    <div className="mono text-[9px] text-gray-600 uppercase">RMS Amplitude</div>
                    <div className="text-sm mono font-bold text-emerald-400">
                      {amplitudes[selected.channelIndex].toFixed(1)} µV
                    </div>
                  </div>
                  <div>
                    <div className="mono text-[9px] text-gray-600 uppercase">Channel</div>
                    <div className="text-sm mono text-gray-400">{channelNames[selected.channelIndex]}</div>
                  </div>
                  <div>
                    <div className="mono text-[9px] text-gray-600 uppercase">10-20 Label</div>
                    <div className="text-sm mono text-gray-400">{selected.name}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
                <p className="text-[11px] text-gray-600 text-center">Click an electrode to view details</p>
              </div>
            )}

            {/* Band power summary */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
              <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Band Power</h3>
              <div className="space-y-2">
                {[
                  { band: "delta", label: "Delta (0.5-4Hz)", values: bands.delta, color: "bg-purple-500" },
                  { band: "theta", label: "Theta (4-8Hz)", values: bands.theta, color: "bg-cyan-500" },
                  { band: "alpha", label: "Alpha (8-13Hz)", values: bands.alpha, color: "bg-emerald-500" },
                  { band: "beta", label: "Beta (13-30Hz)", values: bands.beta, color: "bg-amber-500" },
                  { band: "gamma", label: "Gamma (30-100Hz)", values: bands.gamma, color: "bg-red-500" },
                ].map((b) => {
                  const avg = b.values.length > 0 ? b.values.reduce((s, v) => s + v, 0) / b.values.length : 0;
                  const maxPower = 50;
                  const pct = Math.min(100, (avg / maxPower) * 100);
                  return (
                    <div key={b.band} className="flex items-center gap-2">
                      <span className="mono text-[9px] text-gray-500 w-28">{b.label}</span>
                      <div className="flex-1 h-2 bg-[#0a0e17] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${b.color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="mono text-[9px] text-gray-400 w-12 text-right">
                        {avg.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Amplitude ranking */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
              <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Amplitude Ranking</h3>
              <div className="space-y-1">
                {ELECTRODES
                  .map((e, i) => ({ ...e, amp: amplitudes[i] }))
                  .sort((a, b) => b.amp - a.amp)
                  .slice(0, 6)
                  .map((e) => {
                    const pct = Math.min(100, (e.amp / 200) * 100);
                    const hue = (1 - Math.min(1, e.amp / 200)) * 120;
                    return (
                      <div key={e.name} className="flex items-center gap-2">
                        <span className="mono text-[10px] text-gray-400 w-8">{e.name}</span>
                        <div className="flex-1 h-1.5 bg-[#0a0e17] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: `hsl(${hue}, 70%, 55%)` }}
                          />
                        </div>
                        <span className="mono text-[9px] text-gray-500 w-14 text-right">
                          {e.amp.toFixed(0)} µV
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
