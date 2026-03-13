import { getModuleById } from "../registry";
import { ComingSoon } from "../ComingSoon";

const MODULE = getModuleById("runemate")!;

export default function RunemateModule() {
  return (
    <ComingSoon
      module={MODULE}
      concept="Runemate is a proposed neural protocol inspector — a Wireshark for brain signals. It visualizes how neural data flows through the entire processing pipeline: from raw electrode voltages through filtering, artifact rejection, feature extraction, and classification. At each stage, you can inspect what the signal looks like, what transformations were applied, and whether anything unexpected happened. This enables deep debugging of BCI systems and helps identify where in the pipeline an attack or anomaly first appears."
      features={[
        "Pipeline visualization showing each processing stage",
        "Click any stage to see the signal at that point",
        "Side-by-side comparison of signal before/after each transform",
        "Protocol layer inspection (raw → filtered → features → classification)",
        "Latency measurement between pipeline stages",
        "Anomaly highlighting at the stage where it first appears",
        "Packet-level view for LSL stream inspection",
        "Integration with BrainFlow filter chain configuration",
      ]}
    />
  );
}
