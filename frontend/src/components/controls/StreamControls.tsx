interface StreamControlsProps {
  streaming: boolean;
  connected: boolean;
  onStart: () => void;
  onStop: () => void;
  threshold: number;
  onThresholdChange: (v: number) => void;
}

export function StreamControls({
  streaming,
  connected,
  onStart,
  onStop,
  threshold,
  onThresholdChange,
}: StreamControlsProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-[#111827] border border-[#1f2937] rounded-lg">
      <button
        onClick={streaming ? onStop : onStart}
        disabled={!connected}
        className={`mono text-xs px-3 py-1.5 rounded font-semibold transition-colors ${
          streaming
            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
        } disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        {streaming ? "STOP" : "START"}
      </button>

      <div className="h-4 w-px bg-[#1f2937]" />

      <label className="flex items-center gap-2 text-[11px] mono text-gray-400">
        <span>THRESHOLD</span>
        <input
          type="range"
          min={10}
          max={500}
          step={10}
          value={threshold}
          onChange={(e) => onThresholdChange(Number(e.target.value))}
          className="w-24 accent-amber-500"
        />
        <span className="text-gray-300 w-12 text-right">{threshold} uV</span>
      </label>
    </div>
  );
}
