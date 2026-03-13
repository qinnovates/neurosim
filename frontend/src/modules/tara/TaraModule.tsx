import { getModuleById } from "../registry";
import { ComingSoon } from "../ComingSoon";

const MODULE = getModuleById("tara")!;

export default function TaraModule() {
  return (
    <ComingSoon
      module={MODULE}
      concept="TARA is a research catalog of attack techniques that could target brain-computer interfaces. The TARA Console lets you select a technique, configure its parameters (intensity, duration, target channels), and inject it into a live or synthetic signal stream. Watch the Signal Monitor and Neurowall react in real time. This is a controlled testing environment — like a penetration test for neural devices."
      features={[
        "Browse the full TARA technique catalog with search and filters",
        "Select attack techniques by category: injection, disruption, replay, adversarial",
        "Configure attack parameters: intensity, duration, target channels, ramp profile",
        "Inject attacks into the live stream and see before/after comparison",
        "Chain multiple techniques for complex attack scenarios",
        "NISS impact scoring per attack (proposed metric)",
        "Session recording of attack + detection for review",
        "Export attack reports with timeline and metrics",
      ]}
    />
  );
}
