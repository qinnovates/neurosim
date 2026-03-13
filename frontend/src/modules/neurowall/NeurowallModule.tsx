import { getModuleById } from "../registry";
import { ComingSoon } from "../ComingSoon";

const MODULE = getModuleById("neurowall")!;

export default function NeurowallModule() {
  return (
    <ComingSoon
      module={MODULE}
      concept="Neurowall sits between your BCI device and the signal processing pipeline. Like a network firewall inspects packets, Neurowall inspects every sample window of neural data against configurable security rules. When it detects a violation — amplitude spike, rogue frequency injection, abnormal phase shift — it can alert, attenuate, or block the signal in real time."
      features={[
        "Configurable rule engine with drag-and-drop rule builder",
        "Real-time detection overlay on the signal monitor",
        "Block / attenuate / alert actions per rule",
        "Amplitude bounds, frequency guards, rate limiting",
        "Phase coherence monitoring across channel pairs",
        "Detection latency metrics and false positive tracking",
        "Rule import/export for sharing configurations",
        "Integration with TARA attack catalog for rule templates",
      ]}
    />
  );
}
