import { useState, lazy, Suspense } from "react";
import { ModuleShell } from "../../components/layout/ModuleShell";
import { SignalMonitor } from "../../components/signal/SignalMonitor";
import { StreamControls } from "../../components/controls/StreamControls";
import { getModuleById } from "../registry";
import { useData } from "../../contexts/DataContext";
import { SpectrumContent } from "../spectrum/SpectrumModule";

const MODULE = getModuleById("signal")!;

type SignalTab = "monitor" | "spectrum";

export default function SignalModule() {
  const { buffersRef, channelNames, streaming, connected, startStreaming, stopStreaming, threshold, setThreshold } = useData();
  const [activeTab, setActiveTab] = useState<SignalTab>("monitor");

  const tabs: { id: SignalTab; label: string; badge?: string }[] = [
    { id: "monitor", label: "Signal Monitor" },
    { id: "spectrum", label: "Spectrum Analyzer" },
  ];

  return (
    <ModuleShell
      module={MODULE}
      actions={
        <StreamControls
          streaming={streaming}
          connected={connected}
          onStart={startStreaming}
          onStop={stopStreaming}
          threshold={threshold}
          onThresholdChange={setThreshold}
        />
      }
    >
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-[#1f2937] pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`mono text-[11px] px-3 py-1.5 rounded-t transition-colors ${
              activeTab === t.id
                ? "bg-[#111827] text-gray-200 border border-[#1f2937] border-b-transparent"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "monitor" && (
        <SignalMonitor buffersRef={buffersRef} channelNames={channelNames} streaming={streaming} />
      )}
      {activeTab === "spectrum" && <SpectrumContent />}
    </ModuleShell>
  );
}
