/**
 * Shared data context — Web Worker connection, EEG buffers, bands, alerts.
 * All modules consume from this single data source.
 *
 * Demo Atlas: uses an in-browser Web Worker instead of a WebSocket backend.
 */
import { createContext, useContext, useCallback, useState, useRef, useEffect, type ReactNode } from "react";
import { useEEGBuffer } from "../hooks/useEEGBuffer";
import { useBandPower, type BandPowers } from "../hooks/useBandPower";
import { useAlerts } from "../hooks/useAlerts";
import type { ServerMessage, Alert } from "../lib/protocol";
import type { RingBuffer } from "../lib/ringBuffer";

interface DataContextValue {
  // Connection
  connected: boolean;
  streaming: boolean;
  paused: boolean;
  send: (cmd: Record<string, unknown>) => void;

  // Board info
  sampleRate: number;
  channelNames: string[];
  seq: number;
  uptime: number;

  // Data
  buffersRef: React.RefObject<RingBuffer[]>;
  pushSamples: (samples: number[][]) => void;
  getChannelData: (channel: number) => Float64Array;
  clearAll: () => void;
  bands: BandPowers;
  alerts: Alert[];
  alertCount: number;

  // Controls
  threshold: number;
  setThreshold: (v: number) => void;
  startStreaming: () => void;
  stopStreaming: () => void;
  clearAlerts: () => void;
  togglePause: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sampleRate, setSampleRate] = useState(250);
  const [channelNames, setChannelNames] = useState<string[]>([]);
  const [threshold, setThresholdState] = useState(150);
  const [seq, setSeq] = useState(0);
  const [uptime, setUptime] = useState(0);

  const { pushSamples, buffersRef, getChannelData, clearAll } = useEEGBuffer(16);
  const { bands, updateBands } = useBandPower();
  const { alerts, addAlerts, clearAlerts } = useAlerts();
  const workerRef = useRef<Worker | null>(null);
  const pausedRef = useRef(false);

  // Keep pausedRef in sync
  pausedRef.current = paused;

  // Initialize Web Worker
  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/eeg-engine.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (e: MessageEvent<ServerMessage>) => {
      const msg = e.data;
      switch (msg.type) {
        case "config":
          setSampleRate(msg.sample_rate);
          setChannelNames(msg.channel_names);
          break;
        case "status":
          setStreaming(msg.state === "streaming");
          setUptime(msg.uptime);
          break;
        case "eeg":
          if (!pausedRef.current) {
            pushSamples(msg.samples);
            setSeq(msg.seq);
            if (msg.bands) updateBands(msg.bands);
            if (msg.alerts) addAlerts(msg.alerts);
          }
          break;
      }
    };

    workerRef.current = worker;
    setConnected(true);

    return () => {
      worker.terminate();
      setConnected(false);
    };
  }, [pushSamples, updateBands, addAlerts]);

  const send = useCallback((cmd: Record<string, unknown>) => {
    workerRef.current?.postMessage(cmd);
  }, []);

  const startStreaming = useCallback(() => {
    clearAll();
    clearAlerts();
    send({ action: "start" });
  }, [clearAll, clearAlerts, send]);

  const stopStreaming = useCallback(() => {
    send({ action: "stop" });
  }, [send]);

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  const setThreshold = useCallback(
    (v: number) => {
      setThresholdState(v);
      send({ action: "set_threshold", value: v });
    },
    [send],
  );

  return (
    <DataContext.Provider
      value={{
        connected,
        streaming,
        paused,
        send,
        sampleRate,
        channelNames:
          channelNames.length > 0
            ? channelNames
            : Array.from({ length: 16 }, (_, i) => `Ch${i + 1}`),
        seq,
        uptime,
        buffersRef,
        pushSamples,
        getChannelData,
        clearAll,
        bands,
        alerts,
        alertCount: alerts.length,
        threshold,
        setThreshold,
        startStreaming,
        stopStreaming,
        clearAlerts,
        togglePause,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
