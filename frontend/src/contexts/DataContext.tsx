/**
 * Shared data context — WebSocket connection, EEG buffers, bands, alerts.
 * All modules consume from this single data source.
 */
import { createContext, useContext, useCallback, useState, useRef, type ReactNode } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useEEGBuffer } from "../hooks/useEEGBuffer";
import { useBandPower, type BandPowers } from "../hooks/useBandPower";
import { useAlerts } from "../hooks/useAlerts";
import type { ServerMessage, Alert } from "../lib/protocol";
import type { RingBuffer } from "../lib/ringBuffer";

interface DataContextValue {
  // Connection
  connected: boolean;
  streaming: boolean;
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
}

const DataContext = createContext<DataContextValue | null>(null);

const WS_URL = `ws://${window.location.hostname}:${window.location.port || 8765}/ws`;

export function DataProvider({ children }: { children: ReactNode }) {
  const [streaming, setStreaming] = useState(false);
  const [sampleRate, setSampleRate] = useState(250);
  const [channelNames, setChannelNames] = useState<string[]>([]);
  const [threshold, setThresholdState] = useState(150);
  const [seq, setSeq] = useState(0);
  const [uptime, setUptime] = useState(0);

  const { pushSamples, buffersRef, getChannelData, clearAll } = useEEGBuffer(16);
  const { bands, updateBands } = useBandPower();
  const { alerts, addAlerts, clearAlerts } = useAlerts();

  const onMessage = useCallback(
    (msg: ServerMessage) => {
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
          pushSamples(msg.samples);
          setSeq(msg.seq);
          if (msg.bands) updateBands(msg.bands);
          if (msg.alerts) addAlerts(msg.alerts);
          break;
      }
    },
    [pushSamples, updateBands, addAlerts],
  );

  const { connected, send } = useWebSocket({ url: WS_URL, onMessage });

  const startStreaming = useCallback(() => {
    clearAll();
    clearAlerts();
    send({ action: "start" });
  }, [clearAll, clearAlerts, send]);

  const stopStreaming = useCallback(() => {
    send({ action: "stop" });
  }, [send]);

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
