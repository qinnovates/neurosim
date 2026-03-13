import { ModuleShell } from "../../components/layout/ModuleShell";
import { getModuleById } from "../registry";
import { useData } from "../../contexts/DataContext";

const MODULE = getModuleById("settings")!;

export default function SettingsModule() {
  const { connected, streaming, sampleRate, channelNames, threshold, setThreshold } = useData();

  return (
    <ModuleShell module={MODULE}>
      <div className="max-w-2xl space-y-6">
        {/* Connection */}
        <Section title="Connection">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Status" value={connected ? "Connected" : "Disconnected"} color={connected ? "text-emerald-400" : "text-red-400"} />
            <InfoRow label="Stream" value={streaming ? "Active" : "Idle"} color={streaming ? "text-emerald-400" : "text-gray-400"} />
            <InfoRow label="Sample Rate" value={`${sampleRate} Hz`} />
            <InfoRow label="Channels" value={`${channelNames.length}`} />
          </div>
        </Section>

        {/* Board config */}
        <Section title="Board Configuration">
          <p className="text-[11px] text-gray-500 mb-3">
            Open Neural Atlas currently uses BrainFlow's synthetic board for demonstration.
            To connect real hardware, update the backend configuration.
          </p>
          <div className="bg-[#0a0e17] border border-[#1f2937] rounded-lg p-3">
            <p className="mono text-[11px] text-gray-400">Supported boards:</p>
            <ul className="mono text-[11px] text-gray-500 mt-1 space-y-0.5">
              <li>BrainFlow Synthetic Board (default)</li>
              <li>OpenBCI Cyton (8 or 16 channels)</li>
              <li>OpenBCI Ganglion (4 channels)</li>
              <li>Muse 2 (4 channels)</li>
              <li>Any BrainFlow-supported device</li>
            </ul>
          </div>
        </Section>

        {/* Detection */}
        <Section title="Detection Thresholds">
          <label className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400 w-32">Amplitude Threshold</span>
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="flex-1 accent-amber-500"
            />
            <span className="mono text-[11px] text-gray-300 w-16 text-right">{threshold} uV</span>
          </label>
          <p className="text-[10px] text-gray-600 mt-1">
            Signals exceeding this amplitude will trigger alerts. Lower values = more sensitive.
          </p>
        </Section>

        {/* Channel names */}
        <Section title="Channel Map">
          <div className="grid grid-cols-4 gap-2">
            {channelNames.map((name, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1 bg-[#0a0e17] rounded text-[11px] mono">
                <span className="text-gray-600">{i + 1}</span>
                <span className="text-gray-300">{name}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </ModuleShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
      <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value, color = "text-gray-300" }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[10px] mono text-gray-600 uppercase">{label}</div>
      <div className={`text-sm mono font-semibold ${color}`}>{value}</div>
    </div>
  );
}
