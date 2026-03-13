/**
 * SVG gauge visualization with threshold zones.
 * Shows a semi-circular gauge with normal/elevated/high zones and a needle.
 */

interface GaugeProps {
  value: number;
  min: number;
  max: number;
  thresholds: {
    normal: number;    // below this = green
    elevated: number;  // below this = amber, above = red
  };
  label: string;
  unit?: string;
  size?: number;
}

export function Gauge({ value, min, max, thresholds, label, unit = "", size = 140 }: GaugeProps) {
  const cx = size / 2;
  const cy = size / 2 + 10;
  const radius = size / 2 - 16;

  // Arc from -135° to +135° (270° sweep)
  const startAngle = -135;
  const endAngle = 135;
  const sweep = endAngle - startAngle;

  const clampedValue = Math.min(Math.max(value, min), max);
  const normalizedValue = (clampedValue - min) / (max - min);
  const normalizedNormal = (thresholds.normal - min) / (max - min);
  const normalizedElevated = (thresholds.elevated - min) / (max - min);

  const toPoint = (angle: number, r: number) => ({
    x: cx + r * Math.cos((angle * Math.PI) / 180),
    y: cy + r * Math.sin((angle * Math.PI) / 180),
  });

  const valueToAngle = (norm: number) => startAngle + norm * sweep - 90;

  // Arc path helper
  const arcPath = (startNorm: number, endNorm: number, r: number) => {
    const a1 = valueToAngle(startNorm);
    const a2 = valueToAngle(endNorm);
    const p1 = toPoint(a1, r);
    const p2 = toPoint(a2, r);
    const largeArc = (a2 - a1) > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
  };

  const needleAngle = valueToAngle(normalizedValue);
  const needleTip = toPoint(needleAngle, radius - 8);
  const needleBase1 = toPoint(needleAngle + 90, 3);
  const needleBase2 = toPoint(needleAngle - 90, 3);

  // Zone color
  let zoneColor = "#10b981"; // green
  let zoneLabel = "Normal";
  if (clampedValue >= thresholds.elevated) {
    zoneColor = "#ef4444"; // red
    zoneLabel = "High";
  } else if (clampedValue >= thresholds.normal) {
    zoneColor = "#f59e0b"; // amber
    zoneLabel = "Elevated";
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        {/* Background track */}
        <path d={arcPath(0, 1, radius)} fill="none" stroke="#1f2937" strokeWidth="8" strokeLinecap="round" />

        {/* Normal zone (green) */}
        <path d={arcPath(0, normalizedNormal, radius)} fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round" opacity="0.3" />

        {/* Elevated zone (amber) */}
        <path d={arcPath(normalizedNormal, normalizedElevated, radius)} fill="none" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" opacity="0.3" />

        {/* High zone (red) */}
        <path d={arcPath(normalizedElevated, 1, radius)} fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" opacity="0.3" />

        {/* Active value arc */}
        <path d={arcPath(0, normalizedValue, radius)} fill="none" stroke={zoneColor} strokeWidth="8" strokeLinecap="round" opacity="0.8" />

        {/* Needle */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill={zoneColor}
        />
        <circle cx={cx} cy={cy} r="4" fill={zoneColor} />

        {/* Value text */}
        <text x={cx} y={cy - 10} textAnchor="middle" className="mono" fill={zoneColor} fontSize="16" fontWeight="bold">
          {value.toFixed(1)}
        </text>
        <text x={cx} y={cy + 4} textAnchor="middle" className="mono" fill="#6b7280" fontSize="8">
          {unit}
        </text>

        {/* Min/Max labels */}
        {(() => {
          const minP = toPoint(valueToAngle(0), radius + 12);
          const maxP = toPoint(valueToAngle(1), radius + 12);
          return (
            <>
              <text x={minP.x} y={minP.y} textAnchor="middle" fill="#374151" fontSize="8" className="mono">{min}</text>
              <text x={maxP.x} y={maxP.y} textAnchor="middle" fill="#374151" fontSize="8" className="mono">{max}</text>
            </>
          );
        })()}
      </svg>
      <div className="text-center -mt-1">
        <div className="text-[10px] mono text-gray-400">{label}</div>
        <div className="text-[8px] mono" style={{ color: zoneColor }}>{zoneLabel}</div>
      </div>
    </div>
  );
}
