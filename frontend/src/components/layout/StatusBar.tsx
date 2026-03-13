interface StatusBarProps {
  connected: boolean;
  streaming: boolean;
  sampleRate: number;
  channels: number;
  seq: number;
  uptime: number;
}

export function StatusBar({ connected, streaming, sampleRate, channels, seq, uptime }: StatusBarProps) {
  const formatUptime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}m ${sec}s`;
  };

  return (
    <div className="flex items-center gap-6 px-4 py-1.5 bg-[#0d1117] border-t border-[#1f2937] text-[11px] mono text-gray-500">
      <span className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`}
        />
        {connected ? "CONNECTED" : "DISCONNECTED"}
      </span>
      <span>{streaming ? "STREAMING" : "IDLE"}</span>
      <span>{sampleRate} Hz</span>
      <span>{channels} CH</span>
      <span>SEQ {seq}</span>
      <span className="ml-auto">{formatUptime(uptime)}</span>
    </div>
  );
}
