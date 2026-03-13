/**
 * Integrations module — APIs, data feeds, KQL query engine, and tool connections.
 * Central hub for connecting Open Neural Atlas to external data sources and QIF data lake.
 */
import { useState } from "react";
import { ModuleShell } from "../../components/layout/ModuleShell";
import { getModuleById } from "../registry";

const MODULE = getModuleById("integrations")!;

// === Data Source Registry ===
interface DataSource {
  id: string;
  name: string;
  type: "api" | "feed" | "database" | "file" | "tool";
  description: string;
  status: "connected" | "available" | "coming-soon";
  url?: string;
  details: string;
}

const DATA_SOURCES: DataSource[] = [
  // APIs
  {
    id: "brainflow",
    name: "BrainFlow SDK",
    type: "api",
    description: "Universal BCI data acquisition — 30+ supported boards",
    status: "connected",
    details: "Streaming synthetic EEG at 250Hz. Supports OpenBCI Cyton/Ganglion, Muse 2, Neurosity Crown, and more. Switch boards in Settings.",
  },
  {
    id: "crossref",
    name: "Crossref API",
    type: "api",
    description: "DOI resolution and citation metadata verification",
    status: "available",
    url: "https://api.crossref.org",
    details: "Verifies research citations. Used by the QIF research pipeline to validate DOIs before adding to the research registry.",
  },
  {
    id: "semantic-scholar",
    name: "Semantic Scholar",
    type: "api",
    description: "AI-powered academic paper search and citation graphs",
    status: "available",
    url: "https://api.semanticscholar.org",
    details: "Semantic search across 200M+ papers. Citation graph traversal for literature discovery. Used for QIF research agent protocol.",
  },
  {
    id: "pubmed",
    name: "PubMed / NCBI",
    type: "api",
    description: "Biomedical literature — neuroscience, clinical BCI trials",
    status: "available",
    url: "https://pubmed.ncbi.nlm.nih.gov",
    details: "30M+ biomedical citations. Primary source for clinical BCI research, neurostimulation studies, and adverse event reports.",
  },
  {
    id: "nvd",
    name: "NVD / CVE Database",
    type: "api",
    description: "National Vulnerability Database — CVE mappings to TARA",
    status: "available",
    url: "https://nvd.nist.gov",
    details: "55 CVEs currently mapped to TARA techniques. NVD API provides CVSS scores and vulnerability details for BCI-adjacent devices.",
  },

  // Feeds
  {
    id: "cisa-feed",
    name: "CISA Alerts Feed",
    type: "feed",
    description: "US cybersecurity advisories — medical device and ICS alerts",
    status: "available",
    details: "Real-time CISA advisories filtered for medical device security, ICS/SCADA (relevant to implanted BCI), and emerging threats.",
  },
  {
    id: "fda-maude",
    name: "FDA MAUDE Database",
    type: "feed",
    description: "Medical device adverse event reports",
    status: "coming-soon",
    details: "Adverse event reports for neurostimulation and BCI devices. Source for real-world incident data to validate TARA technique realism.",
  },
  {
    id: "arxiv-feed",
    name: "arXiv BCI/Neuro Feed",
    type: "feed",
    description: "Latest preprints in BCI security, adversarial EEG, neuroethics",
    status: "available",
    details: "Filtered arXiv RSS for cs.CR (security), q-bio.NC (neuroscience), cs.HC (human-computer interaction) with BCI keywords.",
  },
  {
    id: "google-news",
    name: "Google News — BCI Security",
    type: "feed",
    description: "News monitoring for BCI security events and industry developments",
    status: "available",
    details: "Curated Google News queries for brain-computer interface security, neural device incidents, and neurotech regulation.",
  },

  // Data Lake
  {
    id: "kql-datalake",
    name: "QIF KQL Data Lake",
    type: "database",
    description: "62 tables, 3,500+ rows — the full QIF knowledge base queryable via KQL",
    status: "connected",
    details: "Unified query interface across all QIF data: TARA techniques, brain atlas, DSM mappings, device inventory, market data, research registry, and more. Query with Kusto Query Language (KQL).",
  },
  {
    id: "tara-catalog",
    name: "TARA Threat Catalog",
    type: "database",
    description: "109 attack techniques with NISS vectors, severity, and dual-use classification",
    status: "connected",
    details: "The full TARA registrar. Each technique includes target bands, NISS scoring vector, consent tier, and defensive controls. Source of truth for attack simulation.",
  },
  {
    id: "brain-atlas",
    name: "QIF Brain-BCI Atlas",
    type: "database",
    description: "37 brain regions mapped to 11 hourglass bands with pathways and connections",
    status: "connected",
    details: "Anatomical atlas with neural pathways, neurotransmitter systems, receptor families, and DSM-5-TR diagnostic mappings.",
  },

  // Tools
  {
    id: "openbci",
    name: "OpenBCI Hardware",
    type: "tool",
    description: "Open-source EEG hardware — Cyton (8/16ch), Ganglion (4ch)",
    status: "available",
    details: "Connect OpenBCI boards directly via BrainFlow. Cyton supports 8 or 16 channels at 250Hz. Ganglion supports 4 channels at 200Hz.",
  },
  {
    id: "mne-python",
    name: "MNE-Python",
    type: "tool",
    description: "Industry-standard EEG analysis — export sessions for deep analysis",
    status: "coming-soon",
    details: "Export Open Neural Atlas sessions in formats compatible with MNE-Python for advanced analysis: source localization, time-frequency decomposition, connectivity analysis.",
  },
  {
    id: "lsl",
    name: "Lab Streaming Layer (LSL)",
    type: "tool",
    description: "Real-time neural data streaming protocol used in research labs",
    status: "coming-soon",
    details: "LSL inlet/outlet support for interoperability with existing lab setups. Note: LSL has no built-in authentication or encryption — a known security gap that Neurowall addresses.",
  },
];

// === KQL Query Interface ===
function KqlQueryPanel() {
  const [query, setQuery] = useState("techniques\n| where severity >= 7\n| project technique_id, name, severity, bands\n| order by severity desc\n| take 10");
  const [results, setResults] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);

  const exampleQueries = [
    { label: "High-severity TARA techniques", query: "techniques\n| where severity >= 7\n| project technique_id, name, severity, bands\n| order by severity desc" },
    { label: "Brain regions by band", query: "brain_regions\n| summarize count() by band\n| order by count_ desc" },
    { label: "Devices with security gaps", query: "companies\n| where security_posture == \"none\"\n| project name, device_count, funding_total" },
    { label: "DSM conditions by severity", query: "dsm5\n| where severity_zone == \"critical\"\n| project code, name, band, pathway" },
    { label: "CVE to TARA mappings", query: "cves\n| project cve_id, technique_id, cvss_base\n| order by cvss_base desc\n| take 20" },
    { label: "Neurotransmitter systems", query: "neurotransmitters\n| project name, precursor, primary_receptor, band" },
    { label: "All table names", query: "// List all available tables\n// (this is a meta-query)" },
  ];

  const handleRun = () => {
    setIsRunning(true);
    // Simulate query execution — in production this hits the backend KQL engine
    setTimeout(() => {
      setResults(`// Query executed against QIF Data Lake\n// 62 tables available\n// \n// Note: KQL engine integration is coming in the next release.\n// This will connect to the same kql-tables.ts engine used by qinnovate.com\n// and execute real queries against the full QIF dataset.\n//\n// Query:\n${query}\n\n// Results will appear here when the KQL engine is connected.`);
      setIsRunning(false);
    }, 500);
  };

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f2937]">
        <div className="flex items-center gap-2">
          <span className="mono text-xs text-emerald-400">KQL</span>
          <span className="mono text-[10px] text-gray-500">Query Engine</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="bg-[#0a0e17] border border-[#1f2937] rounded text-[10px] mono text-gray-400 px-2 py-1"
            onChange={(e) => {
              const q = exampleQueries[Number(e.target.value)];
              if (q) setQuery(q.query);
            }}
            defaultValue=""
          >
            <option value="" disabled>Example queries...</option>
            {exampleQueries.map((q, i) => (
              <option key={i} value={i}>{q.label}</option>
            ))}
          </select>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="mono text-[10px] px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
          >
            {isRunning ? "Running..." : "Run Query"}
          </button>
        </div>
      </div>

      {/* Query editor */}
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-32 bg-[#0a0e17] text-gray-300 mono text-[11px] p-3 resize-none focus:outline-none border-b border-[#1f2937]"
        placeholder="Enter KQL query..."
        spellCheck={false}
      />

      {/* Results */}
      {results && (
        <pre className="p-3 text-[11px] mono text-gray-500 bg-[#0a0e17] max-h-48 overflow-auto whitespace-pre-wrap">
          {results}
        </pre>
      )}

      {/* Table stats */}
      <div className="px-3 py-2 bg-[#0d1117] flex items-center gap-4 text-[9px] mono text-gray-600">
        <span>62 tables</span>
        <span>3,500+ rows</span>
        <span>26 JSON sources</span>
        <span>5 timeline tables</span>
      </div>
    </div>
  );
}

// === Data Source Card ===
function SourceCard({ source }: { source: DataSource }) {
  const statusStyles: Record<string, { dot: string; label: string; text: string }> = {
    connected: { dot: "bg-emerald-500", label: "Connected", text: "text-emerald-400" },
    available: { dot: "bg-blue-500", label: "Available", text: "text-blue-400" },
    "coming-soon": { dot: "bg-gray-600", label: "Coming Soon", text: "text-gray-500" },
  };
  const typeStyles: Record<string, string> = {
    api: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    feed: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    database: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    file: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    tool: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  };

  const s = statusStyles[source.status];

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-3 hover:border-[#374151] transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          <span className="text-[11px] font-semibold text-gray-300">{source.name}</span>
        </div>
        <span className={`mono text-[8px] uppercase px-1.5 py-0.5 rounded border ${typeStyles[source.type]}`}>
          {source.type}
        </span>
      </div>
      <p className="text-[10px] text-gray-500 mb-2">{source.description}</p>
      <p className="text-[10px] text-gray-600 leading-relaxed">{source.details}</p>
      {source.url && (
        <p className="text-[9px] mono text-gray-700 mt-1">{source.url}</p>
      )}
    </div>
  );
}

// === Main Module ===
type Tab = "overview" | "kql" | "apis" | "feeds" | "tools";

export default function IntegrationsModule() {
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "kql", label: "KQL Query" },
    { id: "apis", label: "APIs", count: DATA_SOURCES.filter((s) => s.type === "api").length },
    { id: "feeds", label: "Feeds", count: DATA_SOURCES.filter((s) => s.type === "feed").length },
    { id: "tools", label: "Tools & Data", count: DATA_SOURCES.filter((s) => s.type === "tool" || s.type === "database").length },
  ];

  return (
    <ModuleShell module={MODULE}>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-[#1f2937] pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`mono text-[11px] px-3 py-1.5 rounded-t transition-colors ${
              tab === t.id
                ? "bg-[#111827] text-gray-200 border border-[#1f2937] border-b-transparent"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 text-[9px] text-gray-600">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "APIs", value: DATA_SOURCES.filter((s) => s.type === "api").length, color: "text-purple-400" },
              { label: "Feeds", value: DATA_SOURCES.filter((s) => s.type === "feed").length, color: "text-amber-400" },
              { label: "Data Sources", value: DATA_SOURCES.filter((s) => s.type === "database").length, color: "text-emerald-400" },
              { label: "Tools", value: DATA_SOURCES.filter((s) => s.type === "tool").length, color: "text-cyan-400" },
              { label: "KQL Tables", value: "62", color: "text-blue-400" },
            ].map((s) => (
              <div key={s.label} className="bg-[#111827] border border-[#1f2937] rounded-lg p-3 text-center">
                <div className={`text-lg font-bold mono ${s.color}`}>{s.value}</div>
                <div className="text-[9px] mono text-gray-600 uppercase">{s.label}</div>
              </div>
            ))}
          </div>

          {/* All sources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DATA_SOURCES.map((s) => (
              <SourceCard key={s.id} source={s} />
            ))}
          </div>
        </div>
      )}

      {tab === "kql" && (
        <div className="space-y-4">
          <KqlQueryPanel />
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
            <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Available Tables</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
              {[
                "techniques", "tactics", "cves", "impact_chains",
                "brain_regions", "hourglass_bands", "neural_pathways", "neurotransmitters",
                "dsm5", "neurological_conditions", "companies", "devices",
                "funding", "market_forecasts", "hardware_specs", "comms",
                "neurorights", "controls", "consent_tiers", "frameworks",
                "cranial_nerves", "glial_cells", "receptor_families", "receptor_subunits",
                "neuroendocrine_axes", "bbb_proteins", "meningeal_system",
                "neuroethics_timeline", "neurosecurity_timeline", "ai_ethics_timeline",
                "industry_timeline", "publications", "news", "intel_feed",
                "risk_profile", "tam_sam_som", "convergence", "momentum",
              ].map((t) => (
                <button
                  key={t}
                  onClick={() => {/* Insert table name into query */}}
                  className="text-left mono text-[10px] text-gray-500 hover:text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/5 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "apis" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DATA_SOURCES.filter((s) => s.type === "api").map((s) => (
            <SourceCard key={s.id} source={s} />
          ))}
        </div>
      )}

      {tab === "feeds" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DATA_SOURCES.filter((s) => s.type === "feed").map((s) => (
            <SourceCard key={s.id} source={s} />
          ))}
        </div>
      )}

      {tab === "tools" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DATA_SOURCES.filter((s) => s.type === "tool" || s.type === "database").map((s) => (
            <SourceCard key={s.id} source={s} />
          ))}
        </div>
      )}
    </ModuleShell>
  );
}
