import { PanelHeader } from "../layout/PanelHeader";
import { EEGCanvas } from "./EEGCanvas";
import type { RingBuffer } from "../../lib/ringBuffer";

interface SignalMonitorProps {
  buffersRef: React.RefObject<RingBuffer[]>;
  channelNames: string[];
  streaming: boolean;
}

export function SignalMonitor({ buffersRef, channelNames, streaming }: SignalMonitorProps) {
  return (
    <div className="flex flex-col bg-[#111827] border border-[#1f2937] rounded-lg overflow-hidden">
      <PanelHeader title="Signal Monitor" status={streaming ? "active" : "idle"} />
      <div className="flex-1 p-1">
        <EEGCanvas
          buffersRef={buffersRef}
          channelNames={channelNames}
          height={Math.max(400, channelNames.length * 38)}
        />
      </div>
    </div>
  );
}
