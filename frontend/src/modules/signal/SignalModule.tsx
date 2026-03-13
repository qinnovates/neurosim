import { ModuleShell } from "../../components/layout/ModuleShell";
import { SignalMonitor } from "../../components/signal/SignalMonitor";
import { StreamControls } from "../../components/controls/StreamControls";
import { getModuleById } from "../registry";
import { useData } from "../../contexts/DataContext";

const MODULE = getModuleById("signal")!;

export default function SignalModule() {
  const { buffersRef, channelNames, streaming, connected, startStreaming, stopStreaming, threshold, setThreshold } = useData();

  return (
    <ModuleShell
      module={MODULE}
      actions={
        <StreamControls
          streaming={streaming}
          connected={connected}
          onStart={startStreaming}
          onStop={stopStreaming}
          threshold={threshold}
          onThresholdChange={setThreshold}
        />
      }
    >
      <SignalMonitor buffersRef={buffersRef} channelNames={channelNames} streaming={streaming} />
    </ModuleShell>
  );
}
