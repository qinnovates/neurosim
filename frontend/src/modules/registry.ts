/**
 * Module registry — all Open Neural Atlas modules self-register here.
 * Dashboard reads this to render tiles. Sidebar reads this for nav.
 */
import React, { lazy, type ComponentType, type LazyExoticComponent } from "react";
import {
  IconDashboard, IconSignal, IconAlert, IconNeurowall, IconTara,
  IconNiss, IconRunemate, IconSpectrum, IconBrainMap, IconSession,
  IconSettings, IconIntegrations, IconNeuroSim,
} from "../components/icons/ModuleIcons";

export type ModuleStatus = "active" | "coming-soon" | "beta";
export type ModuleCategory = "monitoring" | "security" | "analysis" | "tools";

export interface ModuleDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string; // Plain language — no jargon
  detailedHelp: string; // Longer explanation for help panel
  icon: string; // Emoji fallback
  Icon: ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>; // SVG icon component
  status: ModuleStatus;
  category: ModuleCategory;
  path: string;
  component: LazyExoticComponent<ComponentType>;
  color: string; // Accent color for the tile
}

export const CATEGORIES: Record<ModuleCategory, { label: string; description: string }> = {
  monitoring: {
    label: "Monitoring",
    description: "Watch brain signals in real time",
  },
  security: {
    label: "Security Operations",
    description: "Detect threats and protect neural interfaces",
  },
  analysis: {
    label: "Analysis",
    description: "Deep dive into signal patterns and data",
  },
  tools: {
    label: "Tools",
    description: "Utilities for recording, playback, and configuration",
  },
};

export const MODULES: ModuleDefinition[] = [
  // === MONITORING ===
  {
    id: "signal",
    name: "Signal Monitor",
    shortName: "Signal",
    description: "Watch live brain signals from all channels in real time — like a heart monitor, but for the brain.",
    detailedHelp:
      "The Signal Monitor displays raw EEG (electroencephalography) data from your connected device. Each horizontal line represents one electrode on the scalp. The wavy patterns you see are electrical activity from neurons firing in the brain. Larger waves mean stronger activity. The monitor updates 30 times per second to show you what's happening right now.",
    icon: "📡",
    Icon: IconSignal,
    status: "active",
    category: "monitoring",
    path: "/signal",
    component: lazy(() => import("./signal/SignalModule")),
    color: "#10b981",
  },
  {
    id: "alerts",
    name: "Alert Center",
    shortName: "Alerts",
    description: "See every anomaly and detection event, with timestamps and severity levels.",
    detailedHelp:
      "The Alert Center is your event log. Every time a signal exceeds normal thresholds or a security rule triggers, an alert appears here. Alerts are color-coded: blue (low) means something unusual, amber (medium) means it needs attention, orange (high) means a significant anomaly, and red (critical) means immediate action may be needed. You can filter, search, and export alerts.",
    icon: "🚨",
    Icon: IconAlert,
    status: "active",
    category: "monitoring",
    path: "/alerts",
    component: lazy(() => import("./alerts/AlertsModule")),
    color: "#ef4444",
  },

  {
    id: "neurosim",
    name: "NeuroSIM",
    shortName: "NeuroSIM",
    description: "BrainFlow integration hub — connect devices, explore the API, load sample datasets, and stream live data.",
    detailedHelp:
      "NeuroSIM is the neural simulator engine inside Open Neural Atlas. It connects to BrainFlow's 40+ supported devices, lets you explore the full API (BoardShim, DataFilter, MLModel), load sample EEG datasets for testing, and manage live data streams. Think of it as the hardware control center: pick a board, configure channels, start streaming, and pipe data to every other module in the platform.",
    icon: "🧪",
    Icon: IconNeuroSim,
    status: "active",
    category: "monitoring",
    path: "/neurosim",
    component: lazy(() => import("./neurosim/NeuroSimModule")),
    color: "#22d3ee",
  },

  // === SECURITY ===
  {
    id: "neurowall",
    name: "Neurowall",
    shortName: "Neurowall",
    description: "A neural firewall that monitors, detects, and blocks suspicious signal patterns before they reach the brain.",
    detailedHelp:
      "Neurowall is a proposed neural firewall — think of it like the firewall on your computer, but for brain-computer interfaces. It sits between the device and the brain, checking every signal against a set of safety rules. If a signal looks abnormal (too strong, wrong frequency, unusual pattern), Neurowall can flag it, reduce it, or block it entirely. This module lets you configure rules, watch detections happen in real time, and see what the firewall is catching.",
    icon: "🛡️",
    Icon: IconNeurowall,
    status: "coming-soon",
    category: "security",
    path: "/neurowall",
    component: lazy(() => import("./neurowall/NeurowallModule")),
    color: "#3b82f6",
  },
  {
    id: "tara",
    name: "TARA Scanner",
    shortName: "TARA",
    description: "Scan, test, and replay attack techniques against brain signals — like Burp Suite for BCI.",
    detailedHelp:
      "TARA Scanner is a penetration testing tool for brain-computer interfaces. Browse the full TARA technique catalog (13 attack types across 6 categories), run automated scan profiles against live or synthetic streams, use the Repeater to inject individual techniques with configurable parameters, and compare clean vs. attacked signals in the Comparer. Think of it as Burp Suite for neural signals — scan for vulnerabilities, review findings, and strengthen your defenses.",
    icon: "⚔️",
    Icon: IconTara,
    status: "active",
    category: "security",
    path: "/tara",
    component: lazy(() => import("./tara/TaraModule")),
    color: "#f59e0b",
  },
  {
    id: "niss",
    name: "NISS Scoring",
    shortName: "NISS",
    description: "Measure the potential impact of an attack on neural signal integrity using a standardized scoring system.",
    detailedHelp:
      "NISS is a proposed scoring system that measures how much an attack disrupts neural signals. Think of it like a Richter scale for brain signal interference: a low score means minimal disruption, while a high score means the signal has been significantly altered. NISS measures physical signal properties (amplitude, frequency, coherence) — it does not claim to measure thoughts, emotions, or cognitive states. This is a research metric that has not been independently validated.",
    icon: "📊",
    Icon: IconNiss,
    status: "coming-soon",
    category: "security",
    path: "/niss",
    component: lazy(() => import("./niss/NissModule")),
    color: "#8b5cf6",
  },
  {
    id: "runemate",
    name: "Runemate",
    shortName: "Runemate",
    description: "A proposed neural protocol inspector — see how signals are encoded, routed, and processed at each layer.",
    detailedHelp:
      "Runemate is a proposed neural sensory protocol (NSP) inspector. Just like Wireshark lets you inspect network packets, Runemate would let you inspect neural signals at each processing layer — from raw electrode data through filtering, encoding, and classification. This module visualizes the signal pipeline, showing how data transforms at each stage. Currently in research/concept phase.",
    icon: "🔮",
    Icon: IconRunemate,
    status: "coming-soon",
    category: "security",
    path: "/runemate",
    component: lazy(() => import("./runemate/RunemateModule")),
    color: "#06b6d4",
  },

  // === ANALYSIS ===
  {
    id: "spectrum",
    name: "Spectrum Analyzer",
    shortName: "Spectrum",
    description: "Break down brain signals into frequency bands to see which types of brain activity are dominant.",
    detailedHelp:
      "Brain signals contain multiple frequencies mixed together, like instruments in an orchestra. The Spectrum Analyzer separates them into bands: Delta (0.5-4 Hz, deep sleep), Theta (4-8 Hz, drowsiness/meditation), Alpha (8-13 Hz, relaxed/eyes closed), Beta (13-30 Hz, active thinking), and Gamma (30-100 Hz, complex processing). The bars show how much power is in each band. This is the same analysis neuroscientists use in research labs.",
    icon: "🌈",
    Icon: IconSpectrum,
    status: "active",
    category: "analysis",
    path: "/spectrum",
    component: lazy(() => import("./spectrum/SpectrumModule")),
    color: "#a855f7",
  },
  {
    id: "brainmap",
    name: "Brain Map",
    shortName: "Brain Map",
    description: "See brain activity mapped onto a head diagram — which regions are most active right now.",
    detailedHelp:
      "The Brain Map shows electrode positions on a diagram of the head using the international 10-20 system (a standard way to place electrodes). Each position lights up based on signal strength — green means normal, amber means elevated, red means very high activity. This gives you an intuitive spatial view of where brain activity is happening. Note: electrode positions measure scalp-level electrical activity, which is an aggregate of many neurons — it does not pinpoint specific brain structures.",
    icon: "🧠",
    Icon: IconBrainMap,
    status: "coming-soon",
    category: "analysis",
    path: "/brainmap",
    component: lazy(() => import("./brainmap/BrainMapModule")),
    color: "#ec4899",
  },

  // === TOOLS ===
  {
    id: "integrations",
    name: "Integrations",
    shortName: "Integrations",
    description: "Connect to APIs, data feeds, and the QIF knowledge base — query 62 tables with KQL.",
    detailedHelp:
      "The Integrations hub connects Open Neural Atlas to external data sources and the QIF knowledge base. Browse available APIs (BrainFlow, Crossref, PubMed, NVD), subscribe to security feeds (CISA, FDA, arXiv), and query the full QIF data lake using Kusto Query Language (KQL). The data lake contains 62 tables with 3,500+ rows covering TARA techniques, brain anatomy, device inventory, market data, and research citations. This is the same data engine that powers qinnovate.com dashboards.",
    icon: "🔌",
    Icon: IconIntegrations,
    status: "active",
    category: "tools",
    path: "/integrations",
    component: lazy(() => import("./integrations/IntegrationsModule")),
    color: "#6366f1",
  },
  {
    id: "session",
    name: "Session Recorder",
    shortName: "Session",
    description: "Record, replay, and export brain signal sessions for later analysis or sharing.",
    detailedHelp:
      "The Session Recorder lets you capture everything — raw signals, detections, alerts — into a session file. You can replay sessions to review what happened, compare different sessions, or export data for analysis in other tools (MNE-Python, MATLAB, etc.). Sessions are saved locally and can be shared as standard EEG data files.",
    icon: "⏺️",
    Icon: IconSession,
    status: "coming-soon",
    category: "tools",
    path: "/session",
    component: lazy(() => import("./session/SessionModule")),
    color: "#14b8a6",
  },
  {
    id: "settings",
    name: "Settings",
    shortName: "Settings",
    description: "Configure your board connection, display preferences, and detection thresholds.",
    detailedHelp:
      "Settings lets you configure which BCI device to connect to, adjust display options (channel count, time window, color scheme), set detection thresholds, and manage your Open Neural Atlas preferences.",
    icon: "⚙️",
    Icon: IconSettings,
    status: "active",
    category: "tools",
    path: "/settings",
    component: lazy(() => import("./settings/SettingsModule")),
    color: "#6b7280",
  },
];

export function getModuleById(id: string): ModuleDefinition | undefined {
  return MODULES.find((m) => m.id === id);
}

export function getModulesByCategory(category: ModuleCategory): ModuleDefinition[] {
  return MODULES.filter((m) => m.category === category);
}

export function getActiveModules(): ModuleDefinition[] {
  return MODULES.filter((m) => m.status === "active");
}
