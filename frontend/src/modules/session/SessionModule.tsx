import { getModuleById } from "../registry";
import { ComingSoon } from "../ComingSoon";

const MODULE = getModuleById("session")!;

export default function SessionModule() {
  return (
    <ComingSoon
      module={MODULE}
      concept="The Session Recorder captures everything that happens during a monitoring session — raw signals, frequency analysis, detections, alerts, and any attack simulations. You can replay sessions to review what happened, compare different sessions side by side, or export data in standard formats (EDF, CSV, JSON) for analysis in MNE-Python, MATLAB, or other tools."
      features={[
        "One-click record/stop for full session capture",
        "Session timeline with event markers (attacks, detections, anomalies)",
        "Replay sessions at variable speed (1x, 2x, 0.5x)",
        "Compare two sessions side by side",
        "Export as EDF (European Data Format), CSV, or JSON",
        "Session metadata: board config, duration, alert count, NISS scores",
        "Auto-save option for continuous monitoring",
        "Session library with search and filtering",
      ]}
    />
  );
}
