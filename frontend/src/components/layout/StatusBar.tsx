/**
 * Bottom status bar — connection, streaming, metrics, qinnovate watermark.
 */
interface StatusBarProps {
  connected: boolean;
  streaming: boolean;
  sampleRate: number;
  channels: number;
  seq: number;
  uptime: number;
  onTourClick?: () => void;
}

export function StatusBar({ connected, streaming, sampleRate, channels, seq, uptime, onTourClick }: StatusBarProps) {
  const formatUptime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}m ${sec}s`;
  };

  return (
    <div className="flex items-center gap-6 px-4 py-1.5 bg-[#0d1117] border-t border-[#1f2937] text-[11px] mono text-gray-500">
      <span className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}
        />
        {connected ? "CONNECTED" : "DISCONNECTED"}
      </span>
      <span>{streaming ? "STREAMING" : "IDLE"}</span>
      <span>{sampleRate} Hz</span>
      <span>{channels} CH</span>
      <span>SEQ {seq}</span>

      {/* Tour relaunch */}
      {onTourClick && (
        <button
          onClick={onTourClick}
          className="text-gray-600 hover:text-gray-400 transition-colors"
          title="Relaunch guided tour"
        >
          ?
        </button>
      )}

      {/* Spacer + watermark */}
      <span className="ml-auto flex items-center gap-3">
        <span>{formatUptime(uptime)}</span>
        <span className="text-[9px] text-gray-700">
          qinnovate
        </span>
      </span>
    </div>
  );
}
