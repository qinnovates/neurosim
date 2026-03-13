/**
 * Band power state — updates at ~4Hz, safe for React state.
 */
import { useState, useCallback } from "react";

export interface BandPowers {
  delta: number[];
  theta: number[];
  alpha: number[];
  beta: number[];
  gamma: number[];
}

const EMPTY: BandPowers = {
  delta: [],
  theta: [],
  alpha: [],
  beta: [],
  gamma: [],
};

export const BAND_NAMES = ["delta", "theta", "alpha", "beta", "gamma"] as const;

export const BAND_COLORS: Record<string, string> = {
  delta: "#3b82f6",
  theta: "#8b5cf6",
  alpha: "#10b981",
  beta: "#f59e0b",
  gamma: "#ef4444",
};

export function useBandPower() {
  const [bands, setBands] = useState<BandPowers>(EMPTY);

  const updateBands = useCallback((newBands: Record<string, number[]>) => {
    setBands({
      delta: newBands.delta ?? [],
      theta: newBands.theta ?? [],
      alpha: newBands.alpha ?? [],
      beta: newBands.beta ?? [],
      gamma: newBands.gamma ?? [],
    });
  }, []);

  return { bands, updateBands };
}
