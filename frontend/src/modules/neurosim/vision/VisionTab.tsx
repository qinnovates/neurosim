/**
 * VisionTab — Vision Sensor module adapted as a NeuroSIM tab.
 *
 * Orchestrates three panels:
 *   1. RF Environment (Three.js) — room with WiFi/BLE wave propagation
 *   2. Phosphene Grid (Canvas 2D) — what the patient sees
 *   3. Visual Cortex Diagram (SVG) — V1-V5 hierarchy with active regions
 *
 * The novel pipeline (no published work connects these):
 *   WiFi CSI → scene inference → phosphene rendering → V1 stimulation mapping
 *
 * All parameters from published sources. See phosphene-model.ts for citations.
 */

import { useState, useEffect, Suspense } from "react";
import PhospheneGrid from "./PhospheneGrid";
import VisualCortexDiagram from "./VisualCortexDiagram";
import { ELECTRODE_CONFIGS, RF_LIMITS } from "./phosphene-model";

// Lazy-load RFEnvironment (Three.js is heavy)
import { lazy } from "react";
const RFEnvironment = lazy(() => import("./RFEnvironment"));

export default function VisionTab() {
  const [configId, setConfigId] = useState("cortivis");
  const [sequential, setSequential] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);

  // Animation loop
  useEffect(() => {
    if (!playing) return;
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      setTime((t) => t + (now - last) / 1000);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Simulated scene objects (would come from RF sensing in a real system)
  const sceneObjects = [
    { x: 0.4, y: 0.35, radius: 0.25, intensity: 0.95 },
    { x: 0.7, y: 0.55, radius: 0.18, intensity: 0.7 },
    { x: 0.25, y: 0.7, radius: 0.15, intensity: 0.5 },
  ];

  const activeRegions = ["v1", "v2"];

  return (
    <div className="space-y-4">
      {/* Pipeline visualization */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0f1420] rounded-lg overflow-x-auto mono text-[11px]">
        <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 whitespace-nowrap">
          WiFi CSI
        </span>
        <span className="text-gray-600">+</span>
        <span className="px-2 py-1 rounded bg-cyan-500/15 text-cyan-400 whitespace-nowrap">
          BLE AoA
        </span>
        <span className="text-gray-600">&rarr;</span>
        <span className="px-2 py-1 rounded bg-blue-500/15 text-blue-400 whitespace-nowrap">
          ML Scene Inference
        </span>
        <span className="text-gray-600">&rarr;</span>
        <span className="px-2 py-1 rounded bg-pink-500/15 text-pink-400 whitespace-nowrap">
          Phosphene Encoding
        </span>
        <span className="text-gray-600">&rarr;</span>
        <span className="px-2 py-1 rounded bg-purple-500/15 text-purple-400 whitespace-nowrap">
          V1 Stimulation
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap items-center">
        <select
          value={configId}
          onChange={(e) => setConfigId(e.target.value)}
          className="mono text-[11px] px-3 py-1.5 rounded-lg bg-[#111827] border border-[#1f2937] text-gray-300"
        >
          {ELECTRODE_CONFIGS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.electrodeCount}ch)
            </option>
          ))}
        </select>
        <button
          onClick={() => setSequential(!sequential)}
          className={`mono text-[10px] px-3 py-1.5 rounded-lg border transition-colors ${
            sequential
              ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
              : "text-gray-500 border-[#1f2937] hover:text-gray-300"
          }`}
        >
          {sequential ? "Sequential (Skywriting)" : "Simultaneous"}
        </button>
        <button
          onClick={() => setPlaying(!playing)}
          className={`mono text-[10px] px-3 py-1.5 rounded-lg border transition-colors ${
            playing
              ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
              : "text-gray-500 border-[#1f2937] hover:text-gray-300"
          }`}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => setTime(0)}
          className="mono text-[10px] px-3 py-1.5 rounded-lg border text-gray-500 border-[#1f2937] hover:text-gray-300 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Three panels */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_200px] gap-3">
        <div>
          <div className="mono text-[9px] uppercase tracking-wider text-gray-600 mb-2">
            RF Environment
          </div>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-[300px] bg-[#0a0e1a] rounded-xl border border-[#1f2937]">
                <span className="mono text-[10px] text-gray-600">Loading 3D scene...</span>
              </div>
            }
          >
            <RFEnvironment width={380} height={300} />
          </Suspense>
        </div>
        <div>
          <div className="mono text-[9px] uppercase tracking-wider text-gray-600 mb-2">
            Phosphene Perception (Patient View)
          </div>
          <PhospheneGrid
            width={380}
            height={300}
            configId={configId}
            sceneObjects={sceneObjects}
            sequential={sequential}
            time={time}
          />
        </div>
        <div>
          <div className="mono text-[9px] uppercase tracking-wider text-gray-600 mb-2">
            Visual Cortex
          </div>
          <VisualCortexDiagram
            width={200}
            height={300}
            activeRegions={activeRegions}
          />
        </div>
      </div>

      {/* Signal Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-3">
          <div className="mono text-[8px] uppercase tracking-wider text-gray-600 mb-1">
            WiFi 5GHz CSI
          </div>
          <div className="text-sm mono font-semibold text-blue-400">-42 dBm</div>
          <div className="text-[9px] mono text-gray-600">
            {RF_LIMITS.wifi_5ghz.bandwidth_mhz}MHz BW | ~{RF_LIMITS.wifi_5ghz.rangeResolutionM}m res
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-3">
          <div className="mono text-[8px] uppercase tracking-wider text-gray-600 mb-1">
            BLE 5.1 AoA
          </div>
          <div className="text-sm mono font-semibold text-blue-400">3 beacons</div>
          <div className="text-[9px] mono text-gray-600">
            ~{RF_LIMITS.ble_5_1.positionAccuracyM}m accuracy
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-3">
          <div className="mono text-[8px] uppercase tracking-wider text-gray-600 mb-1">
            Scene Objects
          </div>
          <div className="text-sm mono font-semibold text-blue-400">
            {sceneObjects.length} detected
          </div>
          <div className="text-[9px] mono text-gray-600">
            RF-Pose: {RF_LIMITS.wifi_5ghz.poseAccuracy}
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-3">
          <div className="mono text-[8px] uppercase tracking-wider text-gray-600 mb-1">
            Stimulation
          </div>
          <div className="text-sm mono font-semibold text-blue-400">
            {ELECTRODE_CONFIGS.find((c) => c.id === configId)?.thresholdUA ?? 0}µA
          </div>
          <div className="text-[9px] mono text-gray-600">
            {sequential ? "Sequential 200ms/electrode" : "Simultaneous multi-electrode"}
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-3">
          <div className="mono text-[8px] uppercase tracking-wider text-gray-600 mb-1">
            Sim Time
          </div>
          <div className="text-sm mono font-semibold text-blue-400">{time.toFixed(1)}s</div>
          <div className="text-[9px] mono text-gray-600">{playing ? "Running" : "Paused"}</div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <p className="text-[11px] text-gray-400 leading-relaxed">
          <strong className="text-amber-400">Research simulation for threat modeling purposes.</strong>{" "}
          This visualization demonstrates a proposed pipeline connecting RF environment sensing to
          cortical visual prosthetic stimulation. No published work connects these systems. WiFi CSI
          achieves pose estimation through ML inference over learned statistical associations, not
          direct imaging. Phosphene appearance is patient-specific and depends on individual cortical
          geometry and electrode placement. Consumer WiFi chipsets do not expose CSI data; real RF
          sensing requires specialized hardware. All electrode parameters from published clinical data
          (Fernández 2021 JCI, Cortigent 2026, Troyk/IIT 2024).
        </p>
      </div>
    </div>
  );
}
