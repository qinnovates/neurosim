/**
 * Tracks a numeric value over time for sparkline rendering.
 * Stores the last N samples at a configurable interval.
 */
import { useRef, useEffect, useCallback } from "react";

export interface MetricSample {
  value: number;
  ts: number;
}

interface UseMetricHistoryOptions {
  maxSamples?: number;
  intervalMs?: number;
}

export function useMetricHistory(
  currentValue: number,
  { maxSamples = 30, intervalMs = 1000 }: UseMetricHistoryOptions = {},
) {
  const historyRef = useRef<MetricSample[]>([]);
  const prevValueRef = useRef(currentValue);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      historyRef.current.push({ value: currentValue, ts: now });
      if (historyRef.current.length > maxSamples) {
        historyRef.current = historyRef.current.slice(-maxSamples);
      }
      prevValueRef.current = currentValue;
    }, intervalMs);
    return () => clearInterval(id);
  }, [currentValue, maxSamples, intervalMs]);

  const getHistory = useCallback(() => historyRef.current, []);

  const getDelta = useCallback(() => {
    const h = historyRef.current;
    if (h.length < 2) return 0;
    return h[h.length - 1].value - h[0].value;
  }, []);

  const getRate = useCallback(() => {
    const h = historyRef.current;
    if (h.length < 2) return 0;
    const dt = (h[h.length - 1].ts - h[0].ts) / 1000;
    if (dt === 0) return 0;
    return (h[h.length - 1].value - h[0].value) / dt;
  }, []);

  return { getHistory, getDelta, getRate };
}
