/**
 * WebSocket message protocol — decode msgpack frames from backend.
 */
import { decode, encode } from "@msgpack/msgpack";

export interface ConfigMessage {
  type: "config";
  sample_rate: number;
  num_channels: number;
  channel_names: string[];
}

export interface StatusMessage {
  type: "status";
  state: "streaming" | "stopped";
  uptime: number;
}

export interface Alert {
  id: number;
  channel: number;
  name: string;
  value: number;
  threshold: number;
  ts: number;
  severity: "critical" | "high" | "medium" | "low";
}

export interface EEGMessage {
  type: "eeg";
  seq: number;
  ts: number;
  samples: number[][]; // channels x samples
  bands?: Record<string, number[]>;
  alerts?: Alert[];
}

export type ServerMessage = ConfigMessage | StatusMessage | EEGMessage;

export function decodeMessage(data: ArrayBuffer): ServerMessage {
  return decode(new Uint8Array(data)) as ServerMessage;
}

export function encodeCommand(cmd: Record<string, unknown>): Uint8Array {
  return encode(cmd);
}
