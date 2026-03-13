/**
 * Runemate — Neural Protocol Inspector (Wireshark for brain signals).
 * Visualizes the signal processing pipeline from raw electrode data
 * through filtering, feature extraction, and classification.
 *
 * DISCLAIMER: Proposed research tool. NSP is a draft specification,
 * not an adopted standard.
 */
import { useState, useEffect } from "react";
import { ModuleShell } from "../../components/layout/ModuleShell";
import { getModuleById } from "../registry";
import { useData } from "../../contexts/DataContext";

const MODULE = getModuleById("runemate")!;

/* ── Pipeline Stage Model ─────────────────────────────── */

interface PipelineStage {
  id: string;
  name: string;
  layer: string;
  description: string;
  color: string;
  metrics: StageMetric[];
}

interface StageMetric {
  label: string;
  value: string;
  unit?: string;
}

/* ── Packet View ──────────────────────────────────────── */

interface PacketInfo {
  id: number;
  timestamp: number;
  stage: string;
  size: number;
  channels: number;
  sampleRate: number;
  latencyMs: number;
  status: "ok" | "warning" | "error";
}

/* ── Tab Components ───────────────────────────────────── */

type Tab = "pipeline" | "packets" | "layers";

function PipelineTab({ stages, activeStage, onSelect }: {
  stages: PipelineStage[];
  activeStage: string | null;
  onSelect: (id: string) => void;
}) {
  const selected = stages.find((s) => s.id === activeStage);

  return (
    <div className="space-y-4">
      {/* Pipeline Flow */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-4">Signal Processing Pipeline</h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onSelect(stage.id)}
                className={`px-3 py-2 rounded-lg border transition-all text-center min-w-[100px] ${
                  activeStage === stage.id
                    ? "border-opacity-50 scale-105"
                    : "border-[#1f2937] hover:border-[#374151]"
                }`}
                style={{
                  background: activeStage === stage.id ? `${stage.color}15` : "#0a0e17",
                  borderColor: activeStage === stage.id ? `${stage.color}50` : undefined,
                }}
              >
                <div className="mono text-[8px] uppercase tracking-wider" style={{ color: `${stage.color}90` }}>
                  {stage.layer}
                </div>
                <div className="text-[11px] font-semibold text-gray-200 mt-0.5">{stage.name}</div>
              </button>
              {i < stages.length - 1 && (
                <svg width="20" height="12" viewBox="0 0 20 12" className="flex-shrink-0">
                  <path d="M0 6h16M12 2l4 4-4 4" stroke="#374151" strokeWidth="1.5" fill="none" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stage Detail */}
      {selected ? (
        <div className="bg-[#111827] border rounded-xl p-4" style={{ borderColor: `${selected.color}30` }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: selected.color }}
            />
            <div>
              <h3 className="text-sm font-semibold text-gray-200">{selected.name}</h3>
              <span className="mono text-[9px] uppercase" style={{ color: selected.color }}>
                {selected.layer}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">{selected.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {selected.metrics.map((m) => (
              <div key={m.label} className="bg-[#0a0e17] rounded-lg p-2">
                <div className="mono text-[8px] uppercase tracking-wider text-gray-600">{m.label}</div>
                <div className="mono text-sm font-semibold text-gray-300">
                  {m.value}
                  {m.unit && <span className="text-gray-600 text-[9px] ml-0.5">{m.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <p className="text-[11px] text-gray-600 text-center">Click a pipeline stage to inspect</p>
        </div>
      )}

      {/* Latency Breakdown */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">End-to-End Latency</h3>
        <div className="space-y-2">
          {stages.map((stage) => {
            const latency = parseFloat(stage.metrics.find((m) => m.label === "Latency")?.value || "0");
            const maxLatency = 50;
            const pct = Math.min(100, (latency / maxLatency) * 100);
            return (
              <div key={stage.id} className="flex items-center gap-2">
                <span className="mono text-[9px] w-24 text-gray-500">{stage.name}</span>
                <div className="flex-1 h-2 bg-[#0a0e17] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: stage.color }}
                  />
                </div>
                <span className="mono text-[9px] text-gray-400 w-12 text-right">{latency}ms</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 mono text-[8px] text-gray-600">
          <span>Total: {stages.reduce((s, st) => s + parseFloat(st.metrics.find((m) => m.label === "Latency")?.value || "0"), 0).toFixed(1)}ms</span>
          <span>Target: &lt;50ms end-to-end</span>
        </div>
      </div>
    </div>
  );
}

function PacketsTab({ packets }: { packets: PacketInfo[] }) {
  const recent = packets.slice(-50).reverse();
  const statusColors = { ok: "text-emerald-400", warning: "text-amber-400", error: "text-red-400" };

  return (
    <div className="space-y-4">
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">
          Packet Stream ({packets.length} total)
        </h3>
        {recent.length === 0 ? (
          <p className="text-[11px] text-gray-600 text-center py-4">Start streaming to capture packets</p>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            <div className="flex items-center gap-2 px-2 py-1 text-[8px] mono uppercase text-gray-600">
              <span className="w-8">#</span>
              <span className="w-20">Time</span>
              <span className="flex-1">Stage</span>
              <span className="w-14 text-right">Size</span>
              <span className="w-12 text-right">Ch</span>
              <span className="w-14 text-right">Latency</span>
              <span className="w-12 text-right">Status</span>
            </div>
            {recent.map((p) => (
              <div key={p.id} className="flex items-center gap-2 px-2 py-1 bg-[#0a0e17] rounded text-[10px] mono">
                <span className="w-8 text-gray-700">{p.id}</span>
                <span className="w-20 text-gray-500">{new Date(p.timestamp).toLocaleTimeString()}</span>
                <span className="flex-1 text-gray-400">{p.stage}</span>
                <span className="w-14 text-right text-gray-500">{p.size}B</span>
                <span className="w-12 text-right text-gray-500">{p.channels}</span>
                <span className="w-14 text-right text-gray-400">{p.latencyMs.toFixed(1)}ms</span>
                <span className={`w-12 text-right ${statusColors[p.status]}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LayersTab() {
  const layers = [
    {
      name: "Physical Layer (L0)",
      description: "Raw electrode voltages from ADC. Impedance checks, electrode contact quality.",
      protocol: "Analog → Digital (ADC)",
      color: "#ef4444",
      specs: ["16-bit resolution", "250-1000 Hz sample rate", "±3.3V input range"],
    },
    {
      name: "Transport Layer (L1)",
      description: "Serial/BLE/WiFi transport from hardware to host. Framing, checksums, flow control.",
      protocol: "BrainFlow BoardShim",
      color: "#f59e0b",
      specs: ["Ring buffer: 45000 samples", "UDP multicast optional", "CSV streamer available"],
    },
    {
      name: "Filter Layer (L2)",
      description: "Signal conditioning. Bandpass, notch, detrend, artifact rejection.",
      protocol: "BrainFlow DataFilter",
      color: "#10b981",
      specs: ["Butterworth 4th order", "50/60Hz notch", "Wavelet denoising optional"],
    },
    {
      name: "Feature Layer (L3)",
      description: "Feature extraction. Band powers, PSD, ICA, CSP, peak detection.",
      protocol: "BrainFlow DataFilter + Custom",
      color: "#3b82f6",
      specs: ["5-band FFT (δ/θ/α/β/γ)", "Welch PSD", "Z-score anomaly detection"],
    },
    {
      name: "Classification Layer (L4)",
      description: "ML inference. Mindfulness/restfulness scoring, custom ONNX models.",
      protocol: "BrainFlow MLModel",
      color: "#8b5cf6",
      specs: ["Default classifiers", "ONNX runtime", "Real-time inference <10ms"],
    },
    {
      name: "Application Layer (L5)",
      description: "End-user modules. Signal monitor, spectrum, alerts, brain map, TARA.",
      protocol: "Open Neural Atlas",
      color: "#ec4899",
      specs: ["React UI at 30fps", "Web Worker isolation", "IndexedDB session storage"],
    },
  ];

  return (
    <div className="space-y-3">
      {layers.map((layer, i) => (
        <div key={i} className="bg-[#111827] border rounded-xl p-4" style={{ borderColor: `${layer.color}20` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: layer.color }} />
              <h3 className="text-[12px] font-semibold text-gray-200">{layer.name}</h3>
            </div>
            <span className="mono text-[9px] px-2 py-0.5 rounded" style={{ background: `${layer.color}15`, color: layer.color }}>
              {layer.protocol}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mb-2">{layer.description}</p>
          <div className="flex gap-2 flex-wrap">
            {layer.specs.map((spec) => (
              <span key={spec} className="mono text-[9px] px-2 py-0.5 bg-[#0a0e17] rounded text-gray-500 border border-[#1f2937]">
                {spec}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* Disclaimer */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          <strong className="text-amber-400">Proposed protocol stack.</strong> This layer model is a conceptual
          framework for understanding BCI signal processing. NSP specifies a draft protocol for layers L0-L3.
          It is not an adopted standard and has not been independently validated.
        </p>
      </div>
    </div>
  );
}

/* ── Main Module ──────────────────────────────────────── */

export default function RunemateModule() {
  const { streaming, sampleRate, channelNames, seq } = useData();
  const [tab, setTab] = useState<Tab>("pipeline");
  const [activeStage, setActiveStage] = useState<string | null>("raw");
  const [packets, setPackets] = useState<PacketInfo[]>([]);

  // Build live pipeline stages
  const stages: PipelineStage[] = [
    {
      id: "raw",
      name: "Raw ADC",
      layer: "L0 Physical",
      description: "Raw electrode voltages from the analog-to-digital converter. Each sample is a 16-channel vector at the configured sample rate. This is the unprocessed signal straight from the electrodes.",
      color: "#ef4444",
      metrics: [
        { label: "Sample Rate", value: String(sampleRate), unit: "Hz" },
        { label: "Channels", value: String(channelNames.length) },
        { label: "Bit Depth", value: "16", unit: "bit" },
        { label: "Latency", value: "0.1", unit: "ms" },
      ],
    },
    {
      id: "transport",
      name: "Transport",
      layer: "L1 Transport",
      description: "Data framing and transport from the device to the host application. In Demo Atlas, this is a Web Worker postMessage channel. In production, this would be serial, BLE, or WiFi with BrainFlow's ring buffer.",
      color: "#f59e0b",
      metrics: [
        { label: "Buffer", value: "45000", unit: "samples" },
        { label: "Protocol", value: "postMessage" },
        { label: "Packets", value: String(seq) },
        { label: "Latency", value: "0.5", unit: "ms" },
      ],
    },
    {
      id: "filter",
      name: "Filter",
      layer: "L2 Filter",
      description: "Signal conditioning: DC offset removal, bandpass filtering (1-50Hz), power line noise rejection (50/60Hz notch). Artifacts from eye blinks and muscle movement are attenuated here.",
      color: "#10b981",
      metrics: [
        { label: "Bandpass", value: "1-50", unit: "Hz" },
        { label: "Notch", value: "60", unit: "Hz" },
        { label: "Order", value: "4th Butterworth" },
        { label: "Latency", value: "2.0", unit: "ms" },
      ],
    },
    {
      id: "features",
      name: "Features",
      layer: "L3 Feature",
      description: "Feature extraction via FFT-based band power computation. Decomposes the signal into delta, theta, alpha, beta, and gamma frequency bands. Z-score peak detection identifies anomalous amplitude events.",
      color: "#3b82f6",
      metrics: [
        { label: "FFT Size", value: "256", unit: "bins" },
        { label: "Bands", value: "5 (δ/θ/α/β/γ)" },
        { label: "Window", value: "1.0", unit: "sec" },
        { label: "Latency", value: "4.0", unit: "ms" },
      ],
    },
    {
      id: "classification",
      name: "Classify",
      layer: "L4 ML",
      description: "Machine learning inference for state classification. Default models score mindfulness and restfulness. Custom ONNX models can be loaded for application-specific classification tasks.",
      color: "#8b5cf6",
      metrics: [
        { label: "Models", value: "2 default" },
        { label: "Runtime", value: "ONNX" },
        { label: "Features", value: "5-band powers" },
        { label: "Latency", value: "3.0", unit: "ms" },
      ],
    },
    {
      id: "application",
      name: "App Layer",
      layer: "L5 Application",
      description: "End-user modules receive processed data: signal monitor renders waveforms, spectrum shows band powers, alerts fire on threshold violations, brain map updates electrode heatmap.",
      color: "#ec4899",
      metrics: [
        { label: "Render", value: "30", unit: "fps" },
        { label: "Modules", value: "12 registered" },
        { label: "Alerts", value: "real-time" },
        { label: "Latency", value: "8.0", unit: "ms" },
      ],
    },
  ];

  // Generate simulated packets
  useEffect(() => {
    if (!streaming) return;
    const interval = setInterval(() => {
      const stageNames = stages.map((s) => s.name);
      const stage = stageNames[Math.floor(Math.random() * stageNames.length)];
      const newPacket: PacketInfo = {
        id: packets.length + 1,
        timestamp: Date.now(),
        stage,
        size: Math.floor(16 * 8 * (1 + Math.random())),
        channels: channelNames.length,
        sampleRate,
        latencyMs: 0.5 + Math.random() * 15,
        status: Math.random() > 0.95 ? "warning" : "ok",
      };
      setPackets((prev) => [...prev, newPacket].slice(-200));
    }, 500);
    return () => clearInterval(interval);
  }, [streaming, channelNames.length, sampleRate, packets.length]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "pipeline", label: "Pipeline Inspector" },
    { id: "packets", label: `Packets (${packets.length})` },
    { id: "layers", label: "Protocol Layers" },
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

      {tab === "pipeline" && <PipelineTab stages={stages} activeStage={activeStage} onSelect={setActiveStage} />}
      {tab === "packets" && <PacketsTab packets={packets} />}
      {tab === "layers" && <LayersTab />}
    </ModuleShell>
  );
}
