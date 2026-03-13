/**
 * Ring buffer manager for multi-channel EEG data.
 * Stored in refs to avoid React re-renders on every sample.
 */
import { useRef, useCallback } from "react";
import { RingBuffer } from "../lib/ringBuffer";

const BUFFER_SECONDS = 4;
const DEFAULT_SAMPLE_RATE = 250;

export function useEEGBuffer(numChannels: number = 16) {
  const buffersRef = useRef<RingBuffer[]>([]);

  // Initialize buffers on first call or channel count change
  if (buffersRef.current.length !== numChannels) {
    const capacity = BUFFER_SECONDS * DEFAULT_SAMPLE_RATE;
    buffersRef.current = Array.from({ length: numChannels }, () => new RingBuffer(capacity));
  }

  const pushSamples = useCallback((samples: number[][]) => {
    const buffers = buffersRef.current;
    const numCh = Math.min(samples.length, buffers.length);
    for (let ch = 0; ch < numCh; ch++) {
      buffers[ch].pushBatch(samples[ch]);
    }
  }, []);

  const getChannelData = useCallback((channel: number): Float64Array => {
    return buffersRef.current[channel]?.getOrdered() ?? new Float64Array(0);
  }, []);

  const clearAll = useCallback(() => {
    buffersRef.current.forEach((b) => b.clear());
  }, []);

  return { buffersRef, pushSamples, getChannelData, clearAll };
}
