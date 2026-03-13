import { ModuleShell } from "../../components/layout/ModuleShell";
import { SpectrumPanel } from "../../components/spectrum/SpectrumPanel";
import { getModuleById } from "../registry";
import { useData } from "../../contexts/DataContext";

const MODULE = getModuleById("spectrum")!;

export default function SpectrumModule() {
  const { bands, channelNames, streaming } = useData();

  return (
    <ModuleShell module={MODULE}>
      <div className="max-w-2xl">
        <SpectrumPanel bands={bands} channelNames={channelNames} streaming={streaming} />
      </div>
    </ModuleShell>
  );
}
