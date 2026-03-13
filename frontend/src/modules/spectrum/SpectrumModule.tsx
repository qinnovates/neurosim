/**
 * Spectrum Analyzer — Frequency band decomposition + experimental DSM pattern analysis.
 */
import { useState, useMemo } from "react";
import { ModuleShell } from "../../components/layout/ModuleShell";
import { SpectrumPanel } from "../../components/spectrum/SpectrumPanel";
import { getModuleById } from "../registry";
import { useData } from "../../contexts/DataContext";
import { type BandPowers, BAND_NAMES, BAND_COLORS } from "../../hooks/useBandPower";
import { Gauge } from "../../components/ui/Gauge";

const MODULE = getModuleById("spectrum")!;

/* ── DSM Pattern Definitions ────────────────────────────── */

/**
 * IMPORTANT: These patterns are based on published qEEG research literature.
 * They are NOT diagnostic tools. See disclaimers throughout.
 *
 * References:
 * - Arns et al. (2013) - EEG phenotypes in ADHD, Neuroscience & Biobehavioral Reviews
 * - Barry et al. (2003) - Review of EEG in ADHD, Clinical Neurophysiology
 * - Wang et al. (2013) - EEG in ASD, Neuroscience & Biobehavioral Reviews
 * - Newson & Thiagarajan (2019) - EEG frequency analysis, Brain Sciences
 * - Clarke et al. (2001) - EEG subtypes in ADHD, Clinical Neurophysiology
 */

interface DsmPattern {
  id: string;
  name: string;
  dsmCode: string;
  category: string;
  description: string;
  spectralSignature: {
    band: string;
    direction: "elevated" | "reduced" | "variable";
    regions: string[];
    detail: string;
  }[];
  ratioMarkers: {
    name: string;
    formula: string;
    threshold: string;
    detail: string;
  }[];
  literature: string[];
  limitations: string[];
  confidence: "low" | "moderate" | "exploratory";
}

const DSM_PATTERNS: DsmPattern[] = [
  {
    id: "adhd-inattentive",
    name: "ADHD — Predominantly Inattentive",
    dsmCode: "F90.0",
    category: "Neurodevelopmental",
    description: "Elevated theta/beta ratio (TBR) at frontal and central sites has been associated with inattentive-type ADHD in multiple studies, though recent meta-analyses show significant heterogeneity.",
    spectralSignature: [
      { band: "theta", direction: "elevated", regions: ["Fz", "Cz", "F3", "F4"], detail: "Elevated frontal midline theta (4-7Hz) relative to age-matched norms. Associated with cortical hypoarousal hypothesis." },
      { band: "beta", direction: "reduced", regions: ["Fz", "Cz", "C3", "C4"], detail: "Reduced frontal-central beta (13-30Hz) power suggesting decreased cortical activation." },
      { band: "alpha", direction: "variable", regions: ["Pz", "Oz"], detail: "Alpha findings are inconsistent across studies. Some show elevated posterior alpha, others show no difference." },
    ],
    ratioMarkers: [
      { name: "Theta/Beta Ratio (TBR)", formula: "theta(Fz,Cz) / beta(Fz,Cz)", threshold: "> 4.5 (varies by age)", detail: "FDA-cleared as an adjunct to clinical assessment (2013), but NOT as a standalone diagnostic. Sensitivity ~60-75%, specificity ~50-70%." },
      { name: "Theta/Alpha Ratio", formula: "theta(Fz) / alpha(Pz)", threshold: "> 2.0", detail: "Less studied than TBR. May distinguish inattentive from combined subtype." },
    ],
    literature: [
      "Arns et al. (2013) Neurosci Biobehav Rev: TBR meta-analysis across 9 studies, N=1,498",
      "Barry et al. (2003) Clin Neurophysiol: Systematic review of EEG in ADHD",
      "Clarke et al. (2001) Clin Neurophysiol: EEG-defined subtypes of ADHD",
      "Snyder et al. (2015) J Am Acad Child Adolesc Psychiatry: NEBA system validation",
    ],
    limitations: [
      "TBR has high inter-individual variability — many healthy individuals exceed the threshold",
      "Age, medication status, and recording conditions significantly affect results",
      "2013 FDA clearance was for adjunctive use only, not standalone diagnosis",
      "Arns et al. (2013) meta-analysis found significant heterogeneity across studies (I² > 75%)",
      "EEG subtypes within ADHD (Clarke et al.) suggest there is no single ADHD spectral profile",
    ],
    confidence: "moderate",
  },
  {
    id: "adhd-combined",
    name: "ADHD — Combined Type",
    dsmCode: "F90.2",
    category: "Neurodevelopmental",
    description: "Combined type may show elevated theta but with distinct frontal beta patterns compared to inattentive type. EEG subtyping research suggests at least 3 distinct spectral profiles within ADHD.",
    spectralSignature: [
      { band: "theta", direction: "elevated", regions: ["Fz", "Cz"], detail: "Elevated frontal theta, typically with broader topographic distribution than inattentive type." },
      { band: "beta", direction: "variable", regions: ["F3", "F4", "C3", "C4"], detail: "Some studies show elevated beta (hyperarousal subtype), others show reduced. Clarke et al. identified both patterns." },
      { band: "delta", direction: "elevated", regions: ["Fz", "F3", "F4"], detail: "Elevated frontal slow activity in some subtypes, associated with maturational lag hypothesis." },
    ],
    ratioMarkers: [
      { name: "Theta/Beta Ratio", formula: "theta(Fz,Cz) / beta(Fz,Cz)", threshold: "> 4.0", detail: "May be lower than inattentive type due to variable beta findings." },
      { name: "Delta+Theta / Alpha+Beta", formula: "(delta+theta) / (alpha+beta) at Fz", threshold: "> 3.5", detail: "Slow/fast ratio may be more robust than TBR alone for combined type." },
    ],
    literature: [
      "Clarke et al. (2001) Clin Neurophysiol: Three EEG profile clusters in ADHD",
      "Loo & Makeig (2012) J Clin Neurophysiol: Review of EEG in ADHD with cluster analysis",
    ],
    limitations: [
      "At least 3 distinct EEG subtypes exist within ADHD combined type",
      "The hyperarousal subtype (excess beta) contradicts the hypoarousal model",
      "Comorbidities (anxiety, ODD) significantly alter the spectral profile",
      "No EEG marker reliably distinguishes combined from inattentive type",
    ],
    confidence: "low",
  },
  {
    id: "asd",
    name: "Autism Spectrum Disorder",
    dsmCode: "F84.0",
    category: "Neurodevelopmental",
    description: "ASD has been associated with altered patterns of cortical connectivity, reflected in EEG as atypical coherence patterns and variable power spectrum findings. Results are highly heterogeneous.",
    spectralSignature: [
      { band: "gamma", direction: "variable", regions: ["F3", "F4", "C3", "C4", "P3", "P4"], detail: "Some studies report elevated gamma (30-100Hz) during rest, others reduced. May relate to local cortical over-connectivity." },
      { band: "alpha", direction: "reduced", regions: ["Pz", "O1", "O2"], detail: "Several studies report reduced posterior alpha peak frequency and power, potentially reflecting altered thalamocortical dynamics." },
      { band: "theta", direction: "elevated", regions: ["Fz", "F3", "F4"], detail: "Elevated frontal theta reported in some studies, particularly in children. May overlap with ADHD comorbidity." },
      { band: "beta", direction: "variable", regions: ["All"], detail: "Inconsistent findings — elevated in some studies, reduced in others. May depend on ASD subtype and cognitive demand." },
    ],
    ratioMarkers: [
      { name: "Long-Range Coherence", formula: "coherence(F3-P3, F4-P4)", threshold: "Reduced vs. controls", detail: "Reduced long-range (frontal-parietal) coherence has been reported. However, coherence analysis is highly method-dependent." },
      { name: "Alpha Peak Frequency", formula: "peak(alpha, Pz)", threshold: "< 9.5 Hz (age-dependent)", detail: "Some studies report leftward shift in posterior alpha peak. Highly variable across ASD population." },
    ],
    literature: [
      "Wang et al. (2013) Neurosci Biobehav Rev: Meta-analysis of EEG in ASD",
      "O'Reilly et al. (2017) Neurosci Biobehav Rev: qEEG in ASD review",
      "Newson & Thiagarajan (2019) Brain Sciences: EEG frequency analysis overview",
    ],
    limitations: [
      "ASD is a highly heterogeneous spectrum — no single EEG signature exists",
      "Most studies have small sample sizes (N < 50) and inconsistent methodologies",
      "Age, IQ, medication, and comorbidities are major confounders",
      "Coherence and connectivity metrics vary dramatically with analysis method",
      "Wang et al. (2013) meta-analysis concluded findings are 'inconsistent and often contradictory'",
      "No qEEG marker has been validated for ASD screening or diagnosis",
    ],
    confidence: "low",
  },
  {
    id: "gad",
    name: "Generalized Anxiety Disorder",
    dsmCode: "F41.1",
    category: "Anxiety",
    description: "Some qEEG studies report elevated beta activity (particularly high-beta > 20Hz) at frontal sites in GAD, consistent with cortical hyperarousal models. Evidence is limited.",
    spectralSignature: [
      { band: "beta", direction: "elevated", regions: ["F3", "F4", "Fz"], detail: "Elevated high-beta (20-30Hz) at frontal sites. Associated with ruminative worry and cortical hyperarousal." },
      { band: "alpha", direction: "reduced", regions: ["Pz", "O1", "O2"], detail: "Reduced posterior alpha in some studies, suggesting difficulty disengaging from threat processing." },
      { band: "gamma", direction: "elevated", regions: ["F3", "F4"], detail: "Some reports of elevated frontal gamma, but very few studies and small samples." },
    ],
    ratioMarkers: [
      { name: "High-Beta Power", formula: "beta_high(20-30Hz, F3, F4)", threshold: "> 2 SD above norms", detail: "Most commonly cited EEG correlate of anxiety. Requires age-matched normative database." },
      { name: "Alpha Asymmetry", formula: "alpha(F4) - alpha(F3)", threshold: "Rightward shift", detail: "Right frontal alpha asymmetry has been associated with withdrawal motivation. Mixed evidence." },
    ],
    literature: [
      "Newson & Thiagarajan (2019) Brain Sciences: Frequency analysis across disorders",
      "Imperatori et al. (2019) Front Psychiatry: qEEG in anxiety disorders",
    ],
    limitations: [
      "Very few dedicated qEEG studies for GAD specifically (most study 'anxiety' broadly)",
      "State anxiety (transient) vs. trait anxiety (GAD) produce different EEG patterns",
      "Medication effects (SSRIs, benzodiazepines) dominate the EEG signal",
      "No qEEG marker approaches clinical diagnostic utility for GAD",
    ],
    confidence: "exploratory",
  },
  {
    id: "mdd",
    name: "Major Depressive Disorder",
    dsmCode: "F32",
    category: "Mood",
    description: "Frontal alpha asymmetry has been extensively studied as a biomarker for depression, with mixed results. Some studies report left frontal hypoactivation (increased alpha). Evidence is insufficient for diagnosis.",
    spectralSignature: [
      { band: "alpha", direction: "elevated", regions: ["F3", "F7"], detail: "Left frontal alpha asymmetry (more alpha = less cortical activity) has been associated with depression in some studies." },
      { band: "theta", direction: "elevated", regions: ["Fz", "Cz"], detail: "Elevated frontal midline theta in treatment-resistant depression. May index anterior cingulate activity." },
      { band: "beta", direction: "variable", regions: ["All"], detail: "No consistent beta finding across studies." },
    ],
    ratioMarkers: [
      { name: "Frontal Alpha Asymmetry", formula: "log(alpha_F4) - log(alpha_F3)", threshold: "Negative (left > right alpha)", detail: "The most-studied EEG biomarker in depression. Effect sizes are small (d ≈ 0.3) and replication has been inconsistent." },
      { name: "Theta Cordance", formula: "cordance(theta, Fp1, Fp2)", threshold: "Decreased during treatment", detail: "Used as treatment response predictor (Cook et al., 2002). Predicts SSRI response, not diagnosis." },
    ],
    literature: [
      "Allen & Reznik (2015) Biol Psychol: Meta-analysis of frontal alpha asymmetry, N=3,000+",
      "Newson & Thiagarajan (2019) Brain Sciences: Overview across disorders",
      "Cook et al. (2002) Am J Psychiatry: Theta cordance as SSRI response predictor",
    ],
    limitations: [
      "Allen & Reznik (2015) meta-analysis found small and unreliable effects (d ≈ 0.3)",
      "State dependency: EEG changes with mood episode phase",
      "Frontal alpha asymmetry is observed in many conditions, not specific to depression",
      "Theta cordance is a treatment response predictor, not a diagnostic marker",
      "Individual differences in skull thickness and cortical folding affect all measures",
    ],
    confidence: "exploratory",
  },
];

/* ── Confidence Badge ───────────────────────────────────── */

function ConfidenceBadge({ level }: { level: DsmPattern["confidence"] }) {
  const styles = {
    moderate: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    low: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    exploratory: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const labels = {
    moderate: "Moderate Evidence",
    low: "Low Evidence",
    exploratory: "Exploratory Only",
  };
  return (
    <span className={`mono text-[8px] uppercase px-1.5 py-0.5 rounded border ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

/* ── Live Pattern Matcher ───────────────────────────────── */

function computeRatios(bands: BandPowers) {
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const thetaAvg = avg(bands.theta);
  const betaAvg = avg(bands.beta);
  const alphaAvg = avg(bands.alpha);
  const deltaAvg = avg(bands.delta);
  const gammaAvg = avg(bands.gamma);

  return {
    tbr: betaAvg > 0 ? thetaAvg / betaAvg : 0,
    tar: alphaAvg > 0 ? thetaAvg / alphaAvg : 0,
    slowFast: (alphaAvg + betaAvg) > 0 ? (deltaAvg + thetaAvg) / (alphaAvg + betaAvg) : 0,
    thetaAvg,
    betaAvg,
    alphaAvg,
    deltaAvg,
    gammaAvg,
  };
}

function LiveRatioPanel({ bands, streaming }: { bands: BandPowers; streaming: boolean }) {
  const ratios = useMemo(() => computeRatios(bands), [bands]);

  if (!streaming || bands.alpha.length === 0) {
    return (
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 text-center">
        <span className="mono text-[11px] text-gray-600">Start streaming to see live spectral ratios</span>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
      <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-4">Live Spectral Ratios</h3>

      {/* Gauge row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Gauge
          value={ratios.tbr}
          min={0}
          max={10}
          thresholds={{ normal: 3.0, elevated: 4.5 }}
          label="Theta/Beta Ratio"
          unit="TBR"
        />
        <Gauge
          value={ratios.tar}
          min={0}
          max={6}
          thresholds={{ normal: 1.5, elevated: 2.0 }}
          label="Theta/Alpha Ratio"
          unit="TAR"
        />
        <Gauge
          value={ratios.slowFast}
          min={0}
          max={8}
          thresholds={{ normal: 2.5, elevated: 3.5 }}
          label="Slow/Fast Ratio"
          unit="(δ+θ)/(α+β)"
        />
      </div>

      {/* Threshold legend */}
      <div className="flex items-center justify-center gap-4 mb-4 text-[9px] mono">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Normal</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Elevated</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> High</span>
      </div>

      {/* Band power row */}
      <div className="grid grid-cols-5 gap-2 pt-3 border-t border-[#1f2937]">
        {BAND_NAMES.map((band) => {
          const avg = bands[band].length ? bands[band].reduce((a, b) => a + b, 0) / bands[band].length : 0;
          return (
            <div key={band} className="text-center">
              <div className="text-sm mono font-semibold" style={{ color: BAND_COLORS[band] }}>{avg.toFixed(1)}</div>
              <div className="text-[8px] mono text-gray-600 uppercase">{band}</div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <p className="text-[8px] text-gray-700 text-center mt-3">
        Thresholds shown are from published literature and vary by age, medication, and recording conditions.
        These are reference values, not diagnostic criteria.
      </p>
    </div>
  );
}

/* ── DSM Pattern Card ───────────────────────────────────── */

function PatternCard({ pattern }: { pattern: DsmPattern }) {
  const [expanded, setExpanded] = useState(false);

  const directionColors = {
    elevated: "text-red-400",
    reduced: "text-blue-400",
    variable: "text-amber-400",
  };

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[12px] font-semibold text-gray-200">{pattern.name}</span>
            <code className="mono text-[9px] text-gray-600">{pattern.dsmCode}</code>
            <ConfidenceBadge level={pattern.confidence} />
          </div>
          <p className="text-[10px] text-gray-500">{pattern.category}</p>
        </div>
        <svg
          width="12" height="12" viewBox="0 0 12 12"
          className={`text-gray-600 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#1f2937] pt-3 space-y-4">
          <p className="text-[11px] text-gray-400 leading-relaxed">{pattern.description}</p>

          {/* Spectral signature */}
          <div>
            <h4 className="text-[9px] mono text-gray-600 uppercase mb-2">Spectral Signature (from literature)</h4>
            <div className="space-y-2">
              {pattern.spectralSignature.map((sig, i) => (
                <div key={i} className="bg-[#0a0e17] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="mono text-[10px] font-bold uppercase" style={{ color: BAND_COLORS[sig.band] || "#6b7280" }}>
                      {sig.band}
                    </span>
                    <span className={`mono text-[9px] ${directionColors[sig.direction]}`}>
                      {sig.direction === "elevated" ? "↑ Elevated" : sig.direction === "reduced" ? "↓ Reduced" : "↕ Variable"}
                    </span>
                    <span className="mono text-[9px] text-gray-600">{sig.regions.join(", ")}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{sig.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ratio markers */}
          <div>
            <h4 className="text-[9px] mono text-gray-600 uppercase mb-2">Ratio Markers</h4>
            <div className="space-y-2">
              {pattern.ratioMarkers.map((rm, i) => (
                <div key={i} className="bg-[#0a0e17] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-gray-300">{rm.name}</span>
                    <code className="mono text-[9px] text-purple-400">{rm.formula}</code>
                    <span className="mono text-[9px] text-amber-400">{rm.threshold}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{rm.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Literature */}
          <div>
            <h4 className="text-[9px] mono text-gray-600 uppercase mb-2">Published Research</h4>
            <ul className="space-y-1">
              {pattern.literature.map((ref, i) => (
                <li key={i} className="text-[10px] text-gray-500 flex gap-1.5">
                  <span className="text-gray-700 flex-shrink-0">[{i + 1}]</span>
                  {ref}
                </li>
              ))}
            </ul>
          </div>

          {/* Limitations */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
            <h4 className="text-[9px] mono text-amber-400 uppercase mb-2">Known Limitations</h4>
            <ul className="space-y-1">
              {pattern.limitations.map((lim, i) => (
                <li key={i} className="text-[10px] text-gray-500 flex gap-1.5">
                  <span className="text-amber-400/60 flex-shrink-0">!</span>
                  {lim}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── DSM Analysis Tab ───────────────────────────────────── */

function DsmAnalysisTab({ bands, streaming }: { bands: BandPowers; streaming: boolean }) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!acknowledged) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-100">Experimental Feature — Not for Diagnosis</h2>
                <span className="mono text-[10px] text-gray-600">Read carefully before proceeding</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-red-400 mb-2">This is NOT a diagnostic tool</h3>
                <ul className="text-[12px] text-gray-400 leading-relaxed space-y-2">
                  <li className="flex gap-2">
                    <span className="text-red-400 flex-shrink-0">1.</span>
                    <span>
                      The spectral patterns shown here are <strong className="text-gray-300">correlations reported
                      in published qEEG research</strong>, not diagnostic criteria. Brain region activation does not
                      uniquely identify a cognitive process or clinical condition (Poldrack, 2006 — reverse inference fallacy).
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400 flex-shrink-0">2.</span>
                    <span>
                      DSM-5-TR diagnoses require <strong className="text-gray-300">comprehensive clinical evaluation</strong> by
                      a licensed professional. No EEG recording — from any device, at any resolution — can diagnose
                      ADHD, ASD, depression, anxiety, or any psychiatric condition on its own.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400 flex-shrink-0">3.</span>
                    <span>
                      The published evidence for most of these patterns has <strong className="text-gray-300">significant
                      limitations</strong>: small sample sizes, inconsistent replication, high inter-individual
                      variability, and sensitivity to recording conditions, medication, age, and comorbidities.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400 flex-shrink-0">4.</span>
                    <span>
                      Even the most-studied marker (theta/beta ratio for ADHD) was FDA-cleared only as an
                      <strong className="text-gray-300"> adjunct to clinical assessment</strong>, never as a standalone
                      diagnostic. Its specificity is limited (Arns et al., 2013).
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400 flex-shrink-0">5.</span>
                    <span>
                      This feature exists for <strong className="text-gray-300">educational and research purposes
                      only</strong> — to help users understand what published research has found about spectral
                      patterns associated with DSM diagnostic categories.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">What this feature actually does</h3>
                <p className="text-[12px] text-gray-400 leading-relaxed">
                  It shows you what published qEEG research has found about spectral patterns that
                  correlate with certain diagnostic categories, along with the evidence strength,
                  limitations, and specific citations. It also computes live spectral ratios from your
                  stream so you can see how the math works. It does not and cannot tell you whether
                  you or anyone has a condition.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={() => setAcknowledged(true)}
              className="w-full mono text-sm px-6 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors font-semibold"
            >
              I Understand — This Is Not Diagnostic
            </button>
            <p className="text-[10px] text-gray-600 text-center mt-3">
              Diagnostic category references for research and educational purposes only,
              not diagnostic claims. Requires clinical validation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Persistent warning banner */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2.5 flex items-center gap-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-[10px] text-gray-500">
          <strong className="text-red-400">Research reference only.</strong> These patterns are correlations from published studies,
          not diagnostic tools. DSM-5-TR diagnosis requires comprehensive clinical evaluation by a licensed professional.
        </p>
      </div>

      {/* Live ratio panel */}
      <LiveRatioPanel bands={bands} streaming={streaming} />

      {/* Pattern cards */}
      <div className="space-y-3">
        {DSM_PATTERNS.map((p) => (
          <PatternCard key={p.id} pattern={p} />
        ))}
      </div>

      {/* Literature note */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-2">About This Data</h3>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          All patterns are sourced from peer-reviewed publications and systematic reviews.
          Evidence confidence levels reflect the strength and consistency of findings across
          studies. "Moderate" means replicated in multiple studies with caveats.
          "Low" means some supportive evidence but significant inconsistencies.
          "Exploratory" means very limited evidence, included for educational completeness only.
          Every pattern includes its specific limitations and citations so you can evaluate
          the evidence yourself.
        </p>
      </div>
    </div>
  );
}

/* ── Main Module ────────────────────────────────────────── */

type Tab = "spectrum" | "dsm";

export default function SpectrumModule() {
  const { bands, channelNames, streaming } = useData();
  const [tab, setTab] = useState<Tab>("spectrum");

  const tabs: { id: Tab; label: string }[] = [
    { id: "spectrum", label: "Frequency Bands" },
    { id: "dsm", label: "DSM Pattern Analysis" },
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
            {t.id === "dsm" && <span className="text-[8px] text-red-400 ml-1">(Experimental)</span>}
          </button>
        ))}
      </div>

      {tab === "spectrum" && (
        <div className="max-w-2xl">
          <SpectrumPanel bands={bands} channelNames={channelNames} streaming={streaming} />
        </div>
      )}
      {tab === "dsm" && <DsmAnalysisTab bands={bands} streaming={streaming} />}
    </ModuleShell>
  );
}
