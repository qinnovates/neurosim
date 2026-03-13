import { getModuleById } from "../registry";
import { ComingSoon } from "../ComingSoon";

const MODULE = getModuleById("niss")!;

export default function NissModule() {
  return (
    <ComingSoon
      module={MODULE}
      concept="NISS measures how much an attack disrupts neural signal integrity. It scores physical disruption — amplitude deviation, frequency contamination, coherence loss — not cognitive or psychological impact. Think of it as a severity meter that quantifies the 'blast radius' of an attack technique on the signal itself. This is a proposed, unvalidated metric designed for threat modeling research."
      features={[
        "Real-time NISS score computed during attack simulation",
        "Per-channel and aggregate impact visualization",
        "Score breakdown: amplitude component, frequency component, coherence component",
        "Historical NISS scores per session for trend analysis",
        "Comparison mode: overlay two sessions to see relative impact",
        "Threshold configuration for severity classification",
        "Export NISS reports as PDF or JSON",
      ]}
    />
  );
}
