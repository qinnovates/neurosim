import { getModuleById } from "../registry";
import { ComingSoon } from "../ComingSoon";

const MODULE = getModuleById("brainmap")!;

export default function BrainMapModule() {
  return (
    <ComingSoon
      module={MODULE}
      concept="The Brain Map shows electrode positions on a diagram of the head using the international 10-20 system. Each electrode lights up based on real-time signal strength — giving you an intuitive spatial view of brain activity. Combined with the Signal Monitor (temporal view) and Spectrum Analyzer (frequency view), the Brain Map provides the spatial dimension that completes the picture."
      features={[
        "2D topographic head map with 10-20 electrode positions",
        "Real-time heatmap overlay showing signal amplitude per electrode",
        "Frequency-band-specific maps (show only alpha, only beta, etc.)",
        "Click an electrode to zoom into that channel's signal",
        "Montage selection: 10-20, 10-10, or custom electrode layouts",
        "Anomaly highlighting: flash electrodes that trigger alerts",
        "3D brain view with approximate source localization (research feature)",
        "Export topographic snapshots for reports",
      ]}
    />
  );
}
