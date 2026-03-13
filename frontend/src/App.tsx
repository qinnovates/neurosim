/**
 * NeuroSIM — Neural Security Operations Simulator
 * Main dashboard layout: Signal Monitor + Spectrum + Alerts
 */
import { useState, useCallback, useRef } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { useEEGBuffer } from "./hooks/useEEGBuffer";
import { useBandPower } from "./hooks/useBandPower";
import { useAlerts } from "./hooks/useAlerts";
import { SignalMonitor } from "./components/signal/SignalMonitor";
import { SpectrumPanel } from "./components/spectrum/SpectrumPanel";
import { AlertPanel } from "./components/alerts/AlertPanel";
import { StreamControls } from "./components/controls/StreamControls";
import { StatusBar } from "./components/layout/StatusBar";
import type { ServerMessage } from "./lib/protocol";

const WS_URL = `ws://${window.location.hostname}:8765/ws`;

export default function App() {
  const [streaming, setStreaming] = useState(false);
  const [sampleRate, setSampleRate] = useState(250);
  const [channelNames, setChannelNames] = useState<string[]>([]);
  const [threshold, setThreshold] = useState(150);
  const [seq, setSeq] = useState(0);
  const [uptime, setUptime] = useState(0);

  const { pushSamples, buffersRef, clearAll } = useEEGBuffer(16);
  const { bands, updateBands } = useBandPower();
  const { alerts, addAlerts, clearAlerts } = useAlerts();

  const onMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "config":
          setSampleRate(msg.sample_rate);
          setChannelNames(msg.channel_names);
          break;
        case "status":
          setStreaming(msg.state === "streaming");
          setUptime(msg.uptime);
          break;
        case "eeg":
          pushSamples(msg.samples);
          setSeq(msg.seq);
          if (msg.bands) updateBands(msg.bands);
          if (msg.alerts) addAlerts(msg.alerts);
          break;
      }
    },
    [pushSamples, updateBands, addAlerts],
  );

  const { connected, send } = useWebSocket({ url: WS_URL, onMessage });

  const handleStart = () => {
    clearAll();
    clearAlerts();
    send({ action: "start" });
  };
  const handleStop = () => send({ action: "stop" });
  const handleThreshold = (v: number) => {
    setThreshold(v);
    send({ action: "set_threshold", value: v });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-[#1f2937]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 32 32">
              <rect width="32" height="32" rx="4" fill="#0a0e17" />
              <path
                d="M8 16 Q12 8 16 16 Q20 24 24 16"
                stroke="#10b981"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="16" cy="16" r="2" fill="#ef4444" />
            </svg>
            <span className="mono text-sm font-bold text-gray-200">NeuroSIM</span>
          </div>
          <span className="mono text-[10px] text-gray-600">v0.1.0</span>
        </div>
        <StreamControls
          streaming={streaming}
          connected={connected}
          onStart={handleStart}
          onStop={handleStop}
          threshold={threshold}
          onThresholdChange={handleThreshold}
        />
      </header>

      {/* Dashboard Grid */}
      <main className="flex-1 grid grid-cols-[1fr_320px] grid-rows-[1fr_auto] gap-2 p-2 overflow-hidden">
        {/* Left: Signal Monitor (full height) */}
        <div className="row-span-2 overflow-hidden">
          <SignalMonitor
            buffersRef={buffersRef}
            channelNames={channelNames.length ? channelNames : Array.from({ length: 16 }, (_, i) => `Ch${i + 1}`)}
            streaming={streaming}
          />
        </div>

        {/* Right top: Spectrum */}
        <SpectrumPanel bands={bands} channelNames={channelNames} streaming={streaming} />

        {/* Right bottom: Alerts */}
        <AlertPanel alerts={alerts} />
      </main>

      {/* Status Bar */}
      <StatusBar
        connected={connected}
        streaming={streaming}
        sampleRate={sampleRate}
        channels={channelNames.length || 16}
        seq={seq}
        uptime={uptime}
      />
    </div>
  );
}
