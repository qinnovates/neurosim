import { PanelHeader } from "../layout/PanelHeader";
import { type BandPowers, BAND_NAMES, BAND_COLORS } from "../../hooks/useBandPower";

interface SpectrumPanelProps {
  bands: BandPowers;
  channelNames: string[];
  streaming: boolean;
}

export function SpectrumPanel({ bands, channelNames, streaming }: SpectrumPanelProps) {
  // Aggregate band powers across channels
  const aggregated = BAND_NAMES.map((band) => {
    const values = bands[band];
    if (!values.length) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  });

  const maxPower = Math.max(...aggregated, 1);

  return (
    <div className="flex flex-col bg-[#111827] border border-[#1f2937] rounded-lg overflow-hidden">
      <PanelHeader title="Frequency Bands" status={streaming ? "active" : "idle"} />
      <div className="p-3 space-y-2">
        {BAND_NAMES.map((band, i) => {
          const pct = (aggregated[i] / maxPower) * 100;
          return (
            <div key={band} className="flex items-center gap-2">
              <span className="mono text-[10px] text-gray-400 w-10 text-right uppercase">
                {band}
              </span>
              <div className="flex-1 h-4 bg-[#0a0e17] rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-200"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    backgroundColor: BAND_COLORS[band],
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className="mono text-[10px] text-gray-500 w-12 text-right">
                {aggregated[i].toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Per-channel breakdown */}
      {channelNames.length > 0 && bands.alpha.length > 0 && (
        <div className="px-3 pb-3">
          <div className="text-[9px] mono text-gray-600 mb-1 uppercase">Per-Channel Alpha</div>
          <div className="grid grid-cols-8 gap-1">
            {channelNames.map((name, ch) => {
              const val = bands.alpha[ch] ?? 0;
              const norm = Math.min(val / Math.max(...bands.alpha, 1), 1);
              return (
                <div key={name} className="text-center">
                  <div
                    className="h-6 rounded-sm mx-auto w-full"
                    style={{
                      backgroundColor: `rgba(16,185,129,${0.2 + norm * 0.6})`,
                    }}
                  />
                  <span className="mono text-[8px] text-gray-500">{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
