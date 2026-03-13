/**
 * TARA Scanner — Burp Suite-style attack simulation and detection testing for BCI.
 * Browse techniques, configure scans, inject into live/synthetic streams, review findings.
 */
import { useState, useCallback } from "react";
import { ModuleShell } from "../../components/layout/ModuleShell";
import { getModuleById } from "../registry";
import { SeverityBadge } from "../../components/ui/SeverityBadge";

const MODULE = getModuleById("tara")!;

/* ── TARA Technique Catalog ─────────────────────────────── */

type AttackCategory = "injection" | "disruption" | "replay" | "adversarial" | "exfiltration" | "denial";

interface TaraTechnique {
  id: string;
  name: string;
  category: AttackCategory;
  severity: "critical" | "high" | "medium" | "low";
  targetBands: string[];
  targetChannels: string[];
  description: string;
  mechanism: string;
  defenseCheck: string;
  nissVector: string;
}

const TECHNIQUES: TaraTechnique[] = [
  {
    id: "TARA-INJ-001",
    name: "DC Offset Injection",
    category: "injection",
    severity: "high",
    targetBands: ["All"],
    targetChannels: ["All"],
    description: "Inject a sustained DC voltage offset to shift baseline across channels",
    mechanism: "Adds constant voltage to selected channels, pushing signals toward rail voltage",
    defenseCheck: "Neurowall: baseline drift detector, detrend filter",
    nissVector: "A:H/F:L/C:N/I:H",
  },
  {
    id: "TARA-INJ-002",
    name: "Sinusoidal Signal Injection",
    category: "injection",
    severity: "high",
    targetBands: ["Alpha", "Beta"],
    targetChannels: ["C3", "C4", "Pz"],
    description: "Overlay a synthetic sinusoidal signal at a target frequency to mask or mimic brain activity",
    mechanism: "Generates sine wave at chosen frequency (e.g., 10Hz alpha) and adds to channel data",
    defenseCheck: "Neurowall: spectral anomaly detector, coherence check",
    nissVector: "A:H/F:H/C:N/I:H",
  },
  {
    id: "TARA-INJ-003",
    name: "Noise Floor Elevation",
    category: "injection",
    severity: "medium",
    targetBands: ["All"],
    targetChannels: ["All"],
    description: "Raise the ambient noise floor to degrade SNR across all channels",
    mechanism: "Adds broadband Gaussian noise scaled to a configurable amplitude",
    defenseCheck: "Neurowall: SNR monitor, noise floor tracker",
    nissVector: "A:M/F:L/C:N/I:M",
  },
  {
    id: "TARA-DIS-001",
    name: "Alpha Rhythm Suppression",
    category: "disruption",
    severity: "high",
    targetBands: ["Alpha"],
    targetChannels: ["O1", "O2", "Oz", "Pz"],
    description: "Suppress alpha band (8-13Hz) power via destructive interference",
    mechanism: "Generates anti-phase alpha signal calibrated to cancel detected alpha peaks",
    defenseCheck: "Neurowall: band power sudden-change detector",
    nissVector: "A:L/F:H/C:N/I:H",
  },
  {
    id: "TARA-DIS-002",
    name: "Frequency Band Jamming",
    category: "disruption",
    severity: "critical",
    targetBands: ["Beta", "Gamma"],
    targetChannels: ["F3", "F4", "C3", "C4"],
    description: "Overwhelm specific frequency bands with high-amplitude noise to prevent classification",
    mechanism: "Bandpass-filtered noise burst at target frequency range with amplitude >> signal",
    defenseCheck: "Neurowall: amplitude ceiling, spectral entropy monitor",
    nissVector: "A:H/F:H/C:N/I:H",
  },
  {
    id: "TARA-DIS-003",
    name: "Coherence Disruption",
    category: "disruption",
    severity: "critical",
    targetBands: ["All"],
    targetChannels: ["All"],
    description: "Break inter-channel coherence patterns by injecting uncorrelated noise per channel",
    mechanism: "Independent noise streams per channel destroy spatial correlation structure",
    defenseCheck: "Neurowall: coherence matrix deviation detector",
    nissVector: "A:M/F:H/C:H/I:H",
  },
  {
    id: "TARA-RPL-001",
    name: "Session Replay Attack",
    category: "replay",
    severity: "critical",
    targetBands: ["All"],
    targetChannels: ["All"],
    description: "Replace live stream with previously recorded session data to spoof identity or state",
    mechanism: "Substitutes real-time buffer with pre-recorded signal file, matching timestamp cadence",
    defenseCheck: "Neurowall: liveness check, timestamp jitter analysis, entropy monitor",
    nissVector: "A:H/F:H/C:H/I:H",
  },
  {
    id: "TARA-RPL-002",
    name: "Event Marker Spoofing",
    category: "replay",
    severity: "medium",
    targetBands: ["N/A"],
    targetChannels: ["Marker"],
    description: "Inject false event markers to corrupt stimulus-response correlation",
    mechanism: "Writes fabricated marker values into the marker channel at incorrect timestamps",
    defenseCheck: "Neurowall: marker validation, stimulus correlation check",
    nissVector: "A:L/F:L/C:M/I:M",
  },
  {
    id: "TARA-ADV-001",
    name: "Adversarial Feature Perturbation",
    category: "adversarial",
    severity: "high",
    targetBands: ["Alpha", "Beta", "Theta"],
    targetChannels: ["All"],
    description: "Minimally perturb band power features to cause ML classifier misclassification",
    mechanism: "Compute gradient of classifier loss w.r.t. input, add epsilon-scaled perturbation",
    defenseCheck: "Neurowall: feature drift detector, model confidence monitor",
    nissVector: "A:L/F:H/C:H/I:M",
  },
  {
    id: "TARA-ADV-002",
    name: "P300 Speller Manipulation",
    category: "adversarial",
    severity: "critical",
    targetBands: ["Broadband"],
    targetChannels: ["Pz", "Cz", "P3", "P4"],
    description: "Inject synthetic P300 waveforms to influence BCI speller output",
    mechanism: "Adds Gaussian-shaped positive deflection ~300ms post-stimulus at parietal channels",
    defenseCheck: "Neurowall: P300 template matching, amplitude bound, latency jitter check",
    nissVector: "A:M/F:H/C:H/I:H",
  },
  {
    id: "TARA-EXF-001",
    name: "Side-Channel Signal Leakage",
    category: "exfiltration",
    severity: "high",
    targetBands: ["All"],
    targetChannels: ["All"],
    description: "Encode data into subtle signal modulations for covert exfiltration",
    mechanism: "Low-amplitude data encoding via frequency-shift keying below noise floor",
    defenseCheck: "Neurowall: spectral entropy monitor, watermark detection",
    nissVector: "A:L/F:L/C:H/I:L",
  },
  {
    id: "TARA-DOS-001",
    name: "Buffer Overflow Flood",
    category: "denial",
    severity: "high",
    targetBands: ["N/A"],
    targetChannels: ["All"],
    description: "Send data at rate exceeding ring buffer capacity to cause sample drops",
    mechanism: "Exceeds BoardShim ring buffer size causing oldest samples to be overwritten",
    defenseCheck: "Neurowall: packet sequence gap detector, buffer utilization monitor",
    nissVector: "A:H/F:L/C:N/I:H",
  },
  {
    id: "TARA-DOS-002",
    name: "Rail Voltage Saturation",
    category: "denial",
    severity: "critical",
    targetBands: ["All"],
    targetChannels: ["All"],
    description: "Drive channels to rail voltage, saturating the ADC and flatlining output",
    mechanism: "Injects maximum amplitude signal to push ADC to its voltage limit",
    defenseCheck: "Neurowall: railed percentage monitor (BrainFlow get_railed_percentage)",
    nissVector: "A:H/F:H/C:N/I:H",
  },
];

/* ── Scan Profile Types ─────────────────────────────────── */

interface ScanProfile {
  id: string;
  name: string;
  description: string;
  techniqueIds: string[];
  estimatedTime: string;
}

const SCAN_PROFILES: ScanProfile[] = [
  {
    id: "quick",
    name: "Quick Scan",
    description: "Top 5 high-severity techniques. Fast surface-level assessment.",
    techniqueIds: ["TARA-DIS-002", "TARA-RPL-001", "TARA-ADV-002", "TARA-DOS-002", "TARA-DIS-003"],
    estimatedTime: "~30 seconds",
  },
  {
    id: "standard",
    name: "Standard Scan",
    description: "All critical and high-severity techniques. Recommended for regular testing.",
    techniqueIds: TECHNIQUES.filter((t) => t.severity === "critical" || t.severity === "high").map((t) => t.id),
    estimatedTime: "~2 minutes",
  },
  {
    id: "full",
    name: "Full Scan",
    description: "Every technique in the TARA catalog. Comprehensive assessment.",
    techniqueIds: TECHNIQUES.map((t) => t.id),
    estimatedTime: "~5 minutes",
  },
  {
    id: "injection",
    name: "Injection Only",
    description: "Signal injection techniques. Tests input validation and filtering.",
    techniqueIds: TECHNIQUES.filter((t) => t.category === "injection").map((t) => t.id),
    estimatedTime: "~45 seconds",
  },
  {
    id: "adversarial",
    name: "Adversarial ML",
    description: "ML classifier evasion and manipulation techniques.",
    techniqueIds: TECHNIQUES.filter((t) => t.category === "adversarial").map((t) => t.id),
    estimatedTime: "~30 seconds",
  },
];

/* ── Scan Finding ───────────────────────────────────────── */

interface Finding {
  techniqueId: string;
  status: "detected" | "undetected" | "partial";
  nissScore: number;
  signalDelta: number;
  detectionLatency: string;
  notes: string;
}

/* ── Tab: Catalog ───────────────────────────────────────── */

function CatalogTab() {
  const [catFilter, setCatFilter] = useState<"all" | AttackCategory>("all");
  const [sevFilter, setSevFilter] = useState<"all" | string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = TECHNIQUES.filter((t) =>
    (catFilter === "all" || t.category === catFilter) &&
    (sevFilter === "all" || t.severity === sevFilter)
  );

  const categories: { id: "all" | AttackCategory; label: string; count: number }[] = [
    { id: "all", label: "All", count: TECHNIQUES.length },
    { id: "injection", label: "Injection", count: TECHNIQUES.filter((t) => t.category === "injection").length },
    { id: "disruption", label: "Disruption", count: TECHNIQUES.filter((t) => t.category === "disruption").length },
    { id: "replay", label: "Replay", count: TECHNIQUES.filter((t) => t.category === "replay").length },
    { id: "adversarial", label: "Adversarial", count: TECHNIQUES.filter((t) => t.category === "adversarial").length },
    { id: "exfiltration", label: "Exfiltration", count: TECHNIQUES.filter((t) => t.category === "exfiltration").length },
    { id: "denial", label: "Denial", count: TECHNIQUES.filter((t) => t.category === "denial").length },
  ];

  const catColors: Record<string, string> = {
    injection: "bg-red-500/15 text-red-400 border-red-500/30",
    disruption: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    replay: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    adversarial: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    exfiltration: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    denial: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCatFilter(c.id)}
            className={`mono text-[10px] px-3 py-1.5 rounded-lg border transition-colors ${
              catFilter === c.id
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : "text-gray-500 border-[#1f2937] hover:text-gray-300"
            }`}
          >
            {c.label} ({c.count})
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {["all", "critical", "high", "medium", "low"].map((s) => (
          <button
            key={s}
            onClick={() => setSevFilter(s)}
            className={`mono text-[10px] px-2 py-1 rounded border transition-colors capitalize ${
              sevFilter === s
                ? "bg-white/10 text-gray-200 border-white/20"
                : "text-gray-600 border-[#1f2937] hover:text-gray-400"
            }`}
          >
            {s === "all" ? "All Severities" : s}
          </button>
        ))}
      </div>

      {/* Technique list */}
      <div className="space-y-2">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="bg-[#111827] border border-[#1f2937] rounded-lg overflow-hidden hover:border-[#374151] transition-colors"
          >
            <button
              onClick={() => setExpanded(expanded === t.id ? null : t.id)}
              className="w-full text-left px-4 py-3 flex items-center gap-3"
            >
              <SeverityBadge severity={t.severity} showLabel={false} size="sm" />
              <code className="mono text-[10px] text-gray-600 w-28 flex-shrink-0">{t.id}</code>
              <span className="text-[12px] text-gray-200 font-medium flex-1">{t.name}</span>
              <span className={`mono text-[8px] uppercase px-1.5 py-0.5 rounded border ${catColors[t.category]}`}>
                {t.category}
              </span>
              <svg
                width="12" height="12" viewBox="0 0 12 12"
                className={`text-gray-600 transition-transform ${expanded === t.id ? "rotate-180" : ""}`}
              >
                <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </button>

            {expanded === t.id && (
              <div className="px-4 pb-4 border-t border-[#1f2937] pt-3 space-y-3">
                <p className="text-[11px] text-gray-400 leading-relaxed">{t.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#0a0e17] rounded-lg p-3">
                    <div className="text-[9px] mono text-gray-600 uppercase mb-1">Mechanism</div>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{t.mechanism}</p>
                  </div>
                  <div className="bg-[#0a0e17] rounded-lg p-3">
                    <div className="text-[9px] mono text-gray-600 uppercase mb-1">Defense Check</div>
                    <p className="text-[10px] text-emerald-400 leading-relaxed">{t.defenseCheck}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[10px] mono">
                  <span className="text-gray-600">Target Bands: <span className="text-purple-400">{t.targetBands.join(", ")}</span></span>
                  <span className="text-gray-600">Target Channels: <span className="text-cyan-400">{t.targetChannels.join(", ")}</span></span>
                  <span className="text-gray-600">NISS: <span className="text-amber-400">{t.nissVector}</span></span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Tab: Scanner ───────────────────────────────────────── */

function ScannerTab() {
  const [selectedProfile, setSelectedProfile] = useState<string>("quick");
  const [scanState, setScanState] = useState<"idle" | "running" | "complete">("idle");
  const [progress, setProgress] = useState(0);
  const [findings, setFindings] = useState<Finding[]>([]);

  const profile = SCAN_PROFILES.find((p) => p.id === selectedProfile)!;

  const runScan = useCallback(() => {
    setScanState("running");
    setFindings([]);
    setProgress(0);

    const techniques = TECHNIQUES.filter((t) => profile.techniqueIds.includes(t.id));
    let idx = 0;

    const interval = setInterval(() => {
      if (idx >= techniques.length) {
        clearInterval(interval);
        setScanState("complete");
        setProgress(100);
        return;
      }

      const tech = techniques[idx];
      // Simulated finding — in production this would inject into the live stream
      const statuses: Finding["status"][] = ["detected", "undetected", "partial"];
      const status = statuses[Math.floor(Math.random() * 3)];

      setFindings((prev) => [
        ...prev,
        {
          techniqueId: tech.id,
          status,
          nissScore: Math.round((Math.random() * 8 + 2) * 10) / 10,
          signalDelta: Math.round(Math.random() * 150 + 10),
          detectionLatency: `${Math.round(Math.random() * 200 + 50)}ms`,
          notes: status === "detected"
            ? "Neurowall rule triggered within threshold"
            : status === "partial"
            ? "Detected after delay — rule sensitivity may need tuning"
            : "No detection — defense gap identified",
        },
      ]);

      idx++;
      setProgress(Math.round((idx / techniques.length) * 100));
    }, 800);

    return () => clearInterval(interval);
  }, [profile]);

  const detected = findings.filter((f) => f.status === "detected").length;
  const partial = findings.filter((f) => f.status === "partial").length;
  const undetected = findings.filter((f) => f.status === "undetected").length;

  return (
    <div className="space-y-4">
      {/* Scan profiles */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Scan Profiles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SCAN_PROFILES.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedProfile(p.id); setScanState("idle"); setFindings([]); }}
              className={`text-left p-3 rounded-lg border transition-colors ${
                selectedProfile === p.id
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-[#0a0e17] border-[#1f2937] hover:border-[#374151]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-semibold text-gray-200">{p.name}</span>
                <span className="mono text-[9px] text-gray-600">{p.estimatedTime}</span>
              </div>
              <p className="text-[10px] text-gray-500">{p.description}</p>
              <div className="mt-1 mono text-[9px] text-amber-400">{p.techniqueIds.length} techniques</div>
            </button>
          ))}
        </div>
      </div>

      {/* Scan controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={runScan}
          disabled={scanState === "running"}
          className={`mono text-xs px-5 py-2.5 rounded-lg border transition-colors font-semibold ${
            scanState === "running"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30 opacity-50 cursor-not-allowed"
              : "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
          }`}
        >
          {scanState === "running" ? "Scanning..." : scanState === "complete" ? "Re-scan" : `Run ${profile.name}`}
        </button>

        {scanState !== "idle" && (
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="mono text-[10px] text-gray-500">
                {scanState === "running" ? "Injecting techniques..." : "Scan complete"}
              </span>
              <span className="mono text-[10px] text-gray-600">{progress}%</span>
            </div>
            <div className="h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  scanState === "complete" ? "bg-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results summary */}
      {findings.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#111827] border border-emerald-500/20 rounded-xl p-3 text-center">
            <div className="text-lg mono font-bold text-emerald-400">{detected}</div>
            <div className="text-[9px] mono text-gray-600 uppercase">Detected</div>
          </div>
          <div className="bg-[#111827] border border-amber-500/20 rounded-xl p-3 text-center">
            <div className="text-lg mono font-bold text-amber-400">{partial}</div>
            <div className="text-[9px] mono text-gray-600 uppercase">Partial</div>
          </div>
          <div className="bg-[#111827] border border-red-500/20 rounded-xl p-3 text-center">
            <div className="text-lg mono font-bold text-red-400">{undetected}</div>
            <div className="text-[9px] mono text-gray-600 uppercase">Undetected</div>
          </div>
        </div>
      )}

      {/* Findings table */}
      {findings.length > 0 && (
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-[#1f2937]">
            <h3 className="mono text-xs text-gray-400 uppercase tracking-wider">Findings</h3>
          </div>
          <div className="divide-y divide-[#1f2937]">
            {findings.map((f, i) => {
              const tech = TECHNIQUES.find((t) => t.id === f.techniqueId)!;
              const statusStyles = {
                detected: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                partial: "bg-amber-500/15 text-amber-400 border-amber-500/30",
                undetected: "bg-red-500/15 text-red-400 border-red-500/30",
              };
              return (
                <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-[11px]">
                  <SeverityBadge severity={tech.severity} showLabel={false} size="sm" />
                  <code className="mono text-[9px] text-gray-600 w-24 flex-shrink-0">{f.techniqueId}</code>
                  <span className="text-gray-300 flex-1">{tech.name}</span>
                  <span className={`mono text-[9px] uppercase px-1.5 py-0.5 rounded border ${statusStyles[f.status]}`}>
                    {f.status}
                  </span>
                  <span className="mono text-[10px] text-amber-400 w-12 text-right">{f.nissScore}</span>
                  <span className="mono text-[10px] text-gray-500 w-16 text-right">{f.signalDelta} uV</span>
                  <span className="mono text-[10px] text-gray-600 w-14 text-right">{f.detectionLatency}</span>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-2 bg-[#0d1117] flex items-center gap-4 text-[9px] mono text-gray-600">
            <span>NISS = signal disruption score (proposed metric)</span>
            <span>Delta = amplitude change in uV</span>
            <span>Latency = time to detection</span>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          <strong className="text-blue-400">Research tool.</strong> This scanner simulates attack injection against
          synthetic or live BCI streams for defensive testing purposes only. All techniques reference the QIF
          TARA catalog. NISS scores are a proposed metric and have not been independently validated. Findings
          represent simulated results — real-world detection accuracy depends on Neurowall rule configuration
          and signal conditions.
        </p>
      </div>
    </div>
  );
}

/* ── Tab: Repeater ──────────────────────────────────────── */

function RepeaterTab() {
  const [selectedTechnique, setSelectedTechnique] = useState(TECHNIQUES[0].id);
  const [intensity, setIntensity] = useState(50);
  const [duration, setDuration] = useState(5);
  const [targetChannels, setTargetChannels] = useState("All");

  const tech = TECHNIQUES.find((t) => t.id === selectedTechnique)!;

  return (
    <div className="space-y-4">
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Technique Repeater</h3>
        <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
          Select a single technique, configure parameters, and inject it into the live stream.
          Observe the Signal Monitor and Alert Center to evaluate detection. Tweak and repeat.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Technique selector */}
          <div>
            <label className="text-[10px] mono text-gray-600 uppercase block mb-1">Technique</label>
            <select
              value={selectedTechnique}
              onChange={(e) => setSelectedTechnique(e.target.value)}
              className="w-full bg-[#0a0e17] border border-[#1f2937] rounded-lg text-[11px] mono text-gray-300 px-3 py-2"
            >
              {TECHNIQUES.map((t) => (
                <option key={t.id} value={t.id}>{t.id}: {t.name}</option>
              ))}
            </select>
          </div>

          {/* Target channels */}
          <div>
            <label className="text-[10px] mono text-gray-600 uppercase block mb-1">Target Channels</label>
            <select
              value={targetChannels}
              onChange={(e) => setTargetChannels(e.target.value)}
              className="w-full bg-[#0a0e17] border border-[#1f2937] rounded-lg text-[11px] mono text-gray-300 px-3 py-2"
            >
              <option value="All">All Channels</option>
              <option value="Frontal">Frontal (Fp1, Fp2, F3, F4, F7, F8)</option>
              <option value="Central">Central (C3, C4)</option>
              <option value="Parietal">Parietal (P3, P4, Pz)</option>
              <option value="Occipital">Occipital (O1, O2, Oz)</option>
              <option value="Temporal">Temporal (T3, T4)</option>
            </select>
          </div>

          {/* Intensity */}
          <div>
            <label className="text-[10px] mono text-gray-600 uppercase block mb-1">
              Intensity: <span className="text-amber-400">{intensity}%</span>
            </label>
            <input
              type="range" min={10} max={100} step={5}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[8px] mono text-gray-700">
              <span>Subtle</span><span>Moderate</span><span>Maximum</span>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-[10px] mono text-gray-600 uppercase block mb-1">
              Duration: <span className="text-amber-400">{duration}s</span>
            </label>
            <input
              type="range" min={1} max={30} step={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[8px] mono text-gray-700">
              <span>1s</span><span>15s</span><span>30s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected technique detail */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <SeverityBadge severity={tech.severity} size="sm" />
          <span className="text-sm font-semibold text-gray-200">{tech.name}</span>
          <code className="mono text-[9px] text-gray-600">{tech.id}</code>
        </div>
        <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">{tech.description}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0a0e17] rounded-lg p-3">
            <div className="text-[9px] mono text-gray-600 uppercase mb-1">Mechanism</div>
            <p className="text-[10px] text-gray-400">{tech.mechanism}</p>
          </div>
          <div className="bg-[#0a0e17] rounded-lg p-3">
            <div className="text-[9px] mono text-gray-600 uppercase mb-1">Defense Check</div>
            <p className="text-[10px] text-emerald-400">{tech.defenseCheck}</p>
          </div>
        </div>
      </div>

      {/* Inject button */}
      <button
        disabled
        className="w-full mono text-sm px-6 py-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 opacity-50 cursor-not-allowed font-semibold"
      >
        Inject Technique (requires backend integration)
      </button>
      <p className="text-[10px] mono text-gray-600 text-center">
        Signal injection engine will be connected in a future release. Configure parameters now to prepare scan profiles.
      </p>
    </div>
  );
}

/* ── Tab: Comparer ──────────────────────────────────────── */

function ComparerTab() {
  return (
    <div className="space-y-4">
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Signal Comparer</h3>
        <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
          Compare clean vs. attacked signal side by side. Select a baseline recording and an attack recording
          to see the signal delta, frequency shift, and NISS impact score. Like Burp Suite's Comparer tool
          but for neural signals instead of HTTP responses.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-[#0a0e17] border border-emerald-500/20 rounded-xl p-4 text-center">
            <div className="text-[9px] mono text-emerald-400 uppercase mb-2">Baseline (Clean)</div>
            <div className="h-20 flex items-center justify-center">
              <svg width="200" height="40" viewBox="0 0 200 40">
                <path
                  d="M0,20 Q10,10 20,20 Q30,30 40,20 Q50,10 60,20 Q70,30 80,20 Q90,10 100,20 Q110,30 120,20 Q130,10 140,20 Q150,30 160,20 Q170,10 180,20 Q190,30 200,20"
                  stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0.6"
                />
              </svg>
            </div>
            <span className="mono text-[10px] text-gray-600">Select baseline session...</span>
          </div>
          <div className="bg-[#0a0e17] border border-red-500/20 rounded-xl p-4 text-center">
            <div className="text-[9px] mono text-red-400 uppercase mb-2">Attack (Modified)</div>
            <div className="h-20 flex items-center justify-center">
              <svg width="200" height="40" viewBox="0 0 200 40">
                <path
                  d="M0,20 Q10,5 20,25 Q30,35 40,15 Q50,5 60,30 Q70,35 80,10 Q90,5 100,25 Q110,35 120,15 Q130,0 140,35 Q150,40 160,10 Q170,5 180,30 Q190,35 200,15"
                  stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.6"
                />
              </svg>
            </div>
            <span className="mono text-[10px] text-gray-600">Select attack session...</span>
          </div>
        </div>

        {/* Planned metrics */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Amplitude Delta", value: "--", unit: "uV" },
            { label: "Frequency Shift", value: "--", unit: "Hz" },
            { label: "Coherence Change", value: "--", unit: "%" },
            { label: "NISS Score", value: "--", unit: "/10" },
          ].map((m) => (
            <div key={m.label} className="bg-[#0a0e17] rounded-lg p-3 text-center">
              <div className="text-sm mono font-bold text-gray-500">{m.value}<span className="text-[9px] text-gray-700 ml-0.5">{m.unit}</span></div>
              <div className="text-[8px] mono text-gray-600 uppercase">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          <strong className="text-blue-400">Coming soon.</strong> The Comparer will load two session recordings
          (from the Session Recorder module), align them temporally, compute per-channel signal deltas,
          and produce a comprehensive before/after report with NISS impact scores.
        </p>
      </div>
    </div>
  );
}

/* ── Main Module ────────────────────────────────────────── */

type Tab = "catalog" | "scanner" | "repeater" | "comparer";

export default function TaraModule() {
  const [tab, setTab] = useState<Tab>("catalog");

  const tabs: { id: Tab; label: string; burpAnalog: string }[] = [
    { id: "catalog", label: "Technique Catalog", burpAnalog: "Target" },
    { id: "scanner", label: "Scanner", burpAnalog: "Scanner" },
    { id: "repeater", label: "Repeater", burpAnalog: "Repeater" },
    { id: "comparer", label: "Comparer", burpAnalog: "Comparer" },
  ];

  return (
    <ModuleShell module={MODULE}>
      {/* Tab bar */}
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
            <span className="text-[8px] text-gray-700 ml-1">({t.burpAnalog})</span>
          </button>
        ))}
      </div>

      {tab === "catalog" && <CatalogTab />}
      {tab === "scanner" && <ScannerTab />}
      {tab === "repeater" && <RepeaterTab />}
      {tab === "comparer" && <ComparerTab />}
    </ModuleShell>
  );
}
