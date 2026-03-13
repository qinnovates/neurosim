/**
 * Tiny inline SVG sparkline — renders an array of numbers as a polyline.
 */
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
}

export function Sparkline({
  data,
  width = 60,
  height = 20,
  color = "#10b981",
  fillOpacity = 0.15,
}: SparklineProps) {
  if (data.length < 2) {
    return (
      <svg width={width} height={height} className="opacity-30">
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth={1} strokeDasharray="2,2" />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const h = height - pad * 2;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = pad + h - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const fillPoints = `0,${height} ${polyline} ${width},${height}`;

  return (
    <svg width={width} height={height}>
      <polygon points={fillPoints} fill={color} opacity={fillOpacity} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
