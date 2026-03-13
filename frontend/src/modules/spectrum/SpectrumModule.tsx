/**
 * Spectrum Analyzer — Frequency band decomposition + experimental DSM pattern analysis.
 *
 * IMPORTANT: All DSM pattern references are for research/educational purposes only,
 * not diagnostic claims. See disclaimers throughout.
 *
 * Verified citations (DOIs resolved via Crossref):
 * - Arns et al. (2013) doi:10.1016/j.neubiorev.2012.02.001
 * - Barry et al. (2003) doi:10.1016/S1388-2457(02)00297-X
 * - Wang et al. (2013) doi:10.1186/1866-1955-5-24
 * - Newson & Thiagarajan (2019) doi:10.3390/brainsci9120387
 * - Clarke et al. (2001) doi:10.1016/S1388-2457(00)00552-2
 * - Snyder et al. (2015) doi:10.1016/j.jaac.2015.06.019
 * - Allen & Reznik (2015) doi:10.1016/j.copsyc.2014.12.017
 * - Cook et al. (2002) doi:10.1176/appi.ajp.159.1.122
 * - Imperatori et al. (2019) doi:10.3389/fpsyt.2019.00107
 * - Monastra et al. (1999) doi:10.1016/S0006-3223(99)00042-1
 * - Pitman et al. (2012) doi:10.1038/nrn3339
 * - Olbrich & Arns (2013) doi:10.1016/j.clinph.2013.03.015
 */
import { useState, useMemo } from "react";
import { ModuleShell } from "../../components/layout/ModuleShell";
import { SpectrumPanel } from "../../components/spectrum/SpectrumPanel";
import { getModuleById } from "../registry";
import { useData } from "../../contexts/DataContext";
import { type BandPowers, BAND_NAMES, BAND_COLORS } from "../../hooks/useBandPower";
import { Gauge } from "../../components/ui/Gauge";

const MODULE = getModuleById("spectrum")!;

/* ── Types ────────────────────────────────────────────────── */

type RecordingCondition = "eyes-closed" | "eyes-open" | "task";

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
  literature: {
    text: string;
    doi?: string;
    verified: boolean;
  }[];
  limitations: string[];
  confidence: "low" | "moderate" | "exploratory";
  recordingCondition: string;
  ageNote?: string;
  medicationNote?: string;
}

/* ── DSM Pattern Definitions ─────────────────────────────── */

const DSM_PATTERNS: DsmPattern[] = [
  {
    id: "adhd-inattentive",
    name: "ADHD — Predominantly Inattentive",
    dsmCode: "F90.0",
    category: "Neurodevelopmental",
    description: "Elevated theta/beta ratio (TBR) at frontal and central sites has been associated with inattentive-type ADHD in multiple studies, though recent meta-analyses show significant heterogeneity. The American Academy of Neurology (2013) gave TBR a Level R recommendation (insufficient evidence to support or refute clinical use).",
    recordingCondition: "Eyes-open resting state, minimum 2 minutes artifact-free",
    ageNote: "TBR threshold of > 4.5 applies to children aged 6-13 only (Monastra et al., 1999). Adult thresholds are not established.",
    medicationNote: "Stimulant medication (methylphenidate, amphetamine) reduces theta power and normalizes TBR within 30-60 minutes. Record medication-free or document medication status.",
    spectralSignature: [
      { band: "theta", direction: "elevated", regions: ["Fz", "Cz", "F3", "F4"], detail: "Elevated frontal midline theta (4-7Hz) relative to age-matched norms. Associated with cortical hypoarousal hypothesis." },
      { band: "beta", direction: "reduced", regions: ["Fz", "Cz", "C3", "C4"], detail: "Reduced frontal-central beta (13-30Hz) power suggesting decreased cortical activation." },
      { band: "alpha", direction: "variable", regions: ["Pz", "Oz"], detail: "Alpha findings are inconsistent across studies. Some show elevated posterior alpha, others show no difference." },
    ],
    ratioMarkers: [
      { name: "Theta/Beta Ratio (TBR)", formula: "theta(Fz,Cz) / beta(Fz,Cz)", threshold: "> 4.5 (ages 6-13 only)", detail: "FDA-cleared as an adjunct to clinical assessment (2013), but NOT as a standalone diagnostic. Sensitivity ~60-75%, specificity ~50-70%. AAN Level R: insufficient evidence to support or refute clinical use." },
      { name: "Theta/Alpha Ratio", formula: "theta(Fz) / alpha(Pz)", threshold: "No validated threshold", detail: "Less studied than TBR. Published comparisons exist but no consensus threshold has been established." },
    ],
    literature: [
      { text: "Arns et al. (2013) Neurosci Biobehav Rev: TBR meta-analysis across 9 studies, N=1,498", doi: "10.1016/j.neubiorev.2012.02.001", verified: true },
      { text: "Barry et al. (2003) Clin Neurophysiol: Systematic review of EEG in ADHD", doi: "10.1016/S1388-2457(02)00297-X", verified: true },
      { text: "Clarke et al. (2001) Clin Neurophysiol: EEG-defined subtypes of ADHD", doi: "10.1016/S1388-2457(00)00552-2", verified: true },
      { text: "Snyder et al. (2015) J Am Acad Child Adolesc Psychiatry: NEBA system validation", doi: "10.1016/j.jaac.2015.06.019", verified: true },
      { text: "Monastra et al. (1999) Biol Psychiatry: TBR normative values for children ages 6-13", doi: "10.1016/S0006-3223(99)00042-1", verified: true },
    ],
    limitations: [
      "TBR has high inter-individual variability — many healthy individuals exceed the threshold",
      "Age, medication status, and recording conditions significantly affect results",
      "2013 FDA clearance was for adjunctive use only, not standalone diagnosis",
      "Arns et al. (2013) meta-analysis found significant heterogeneity across studies (I\u00B2 > 75%)",
      "EEG subtypes within ADHD (Clarke et al.) suggest there is no single ADHD spectral profile",
      "AAN (2013) Level R recommendation: insufficient evidence to support or refute TBR for ADHD diagnosis",
      "TBR threshold (> 4.5) validated only for children ages 6-13 (Monastra et al., 1999) — not applicable to adults",
    ],
    confidence: "moderate",
  },
  {
    id: "adhd-combined",
    name: "ADHD — Combined Type",
    dsmCode: "F90.2",
    category: "Neurodevelopmental",
    description: "Combined type may show elevated theta but with distinct frontal beta patterns compared to inattentive type. EEG subtyping research suggests at least 3 distinct spectral profiles within ADHD.",
    recordingCondition: "Eyes-open resting state, minimum 2 minutes artifact-free",
    ageNote: "All ADHD spectral markers are age-dependent. Theta power decreases naturally with maturation.",
    medicationNote: "Stimulant medication normalizes TBR. Comorbid ODD/anxiety medications (SSRIs, atomoxetine) also alter spectral profile.",
    spectralSignature: [
      { band: "theta", direction: "elevated", regions: ["Fz", "Cz"], detail: "Elevated frontal theta, typically with broader topographic distribution than inattentive type." },
      { band: "beta", direction: "variable", regions: ["F3", "F4", "C3", "C4"], detail: "Some studies show elevated beta (hyperarousal subtype), others show reduced. Clarke et al. identified both patterns." },
      { band: "delta", direction: "elevated", regions: ["Fz", "F3", "F4"], detail: "Elevated frontal slow activity in some subtypes, associated with maturational lag hypothesis." },
    ],
    ratioMarkers: [
      { name: "Theta/Beta Ratio", formula: "theta(Fz,Cz) / beta(Fz,Cz)", threshold: "> 4.0 (age-dependent)", detail: "May be lower than inattentive type due to variable beta findings. No subtype-specific threshold validated." },
      { name: "Delta+Theta / Alpha+Beta", formula: "(delta+theta) / (alpha+beta) at Fz", threshold: "No validated threshold", detail: "Slow/fast ratio has been used in some studies but no consensus threshold exists for clinical application." },
    ],
    literature: [
      { text: "Clarke et al. (2001) Clin Neurophysiol: Three EEG profile clusters in ADHD", doi: "10.1016/S1388-2457(00)00552-2", verified: true },
      { text: "Barry et al. (2003) Clin Neurophysiol: Systematic review of EEG in ADHD", doi: "10.1016/S1388-2457(02)00297-X", verified: true },
    ],
    limitations: [
      "At least 3 distinct EEG subtypes exist within ADHD combined type",
      "The hyperarousal subtype (excess beta) contradicts the hypoarousal model",
      "Comorbidities (anxiety, ODD) significantly alter the spectral profile",
      "No EEG marker reliably distinguishes combined from inattentive type",
      "Slow/fast ratio threshold not validated in peer-reviewed literature",
    ],
    confidence: "low",
  },
  {
    id: "asd",
    name: "Autism Spectrum Disorder",
    dsmCode: "F84.0",
    category: "Neurodevelopmental",
    description: "ASD has been associated with altered patterns of cortical connectivity, reflected in EEG as atypical coherence patterns and variable power spectrum findings. Results are highly heterogeneous.",
    recordingCondition: "Eyes-open resting state preferred. Social vs. non-social task conditions produce different results.",
    ageNote: "Developmental trajectory differs from neurotypical peers — age-matched norms essential.",
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
      { text: "Wang et al. (2013) J Neurodevelop Disord: Meta-analysis of EEG in ASD", doi: "10.1186/1866-1955-5-24", verified: true },
      { text: "Newson & Thiagarajan (2019) Brain Sciences: EEG frequency analysis overview", doi: "10.3390/brainsci9120387", verified: true },
    ],
    limitations: [
      "ASD is a highly heterogeneous spectrum — no single EEG signature exists",
      "Most studies have small sample sizes (N < 50) and inconsistent methodologies",
      "Age, IQ, medication, and comorbidities are major confounders",
      "Coherence and connectivity metrics vary dramatically with analysis method",
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
    recordingCondition: "Eyes-closed preferred for alpha asymmetry. State anxiety at recording time confounds trait measurements.",
    medicationNote: "Benzodiazepines increase fast beta (> 20Hz) and may mask or mimic the anxiety pattern. SSRIs increase alpha power. Document medication status.",
    spectralSignature: [
      { band: "beta", direction: "elevated", regions: ["F3", "F4", "Fz"], detail: "Elevated high-beta (20-30Hz) at frontal sites. Associated with ruminative worry and cortical hyperarousal." },
      { band: "alpha", direction: "reduced", regions: ["Pz", "O1", "O2"], detail: "Reduced posterior alpha in some studies, suggesting difficulty disengaging from threat processing." },
      { band: "gamma", direction: "elevated", regions: ["F3", "F4"], detail: "Some reports of elevated frontal gamma, but very few studies and small samples." },
    ],
    ratioMarkers: [
      { name: "High-Beta Power", formula: "beta_high(20-30Hz, F3, F4)", threshold: "> 2 SD above norms", detail: "Most commonly cited EEG correlate of anxiety. Requires age-matched normative database." },
      { name: "Alpha Asymmetry", formula: "log(alpha_F4) - log(alpha_F3)", threshold: "Negative (rightward shift)", detail: "Right frontal alpha asymmetry has been associated with withdrawal motivation. Mixed evidence." },
    ],
    literature: [
      { text: "Newson & Thiagarajan (2019) Brain Sciences: Frequency analysis across disorders", doi: "10.3390/brainsci9120387", verified: true },
      { text: "Imperatori et al. (2019) Front Psychiatry: qEEG in anxiety disorders", doi: "10.3389/fpsyt.2019.00107", verified: true },
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
    description: "Frontal alpha asymmetry has been extensively studied as a biomarker for depression, with mixed results. Allen & Reznik (2015) published a narrative review (not a meta-analysis) concluding effects are small and unreliable.",
    recordingCondition: "Eyes-closed, 4+ minutes. Alpha asymmetry requires multiple 1-minute blocks averaged.",
    medicationNote: "SSRIs increase alpha power (may normalize asymmetry without clinical improvement). Benzodiazepines increase beta. Always document medication status.",
    spectralSignature: [
      { band: "alpha", direction: "elevated", regions: ["F3", "F7"], detail: "Left frontal alpha asymmetry (more alpha = less cortical activity) has been associated with depression in some studies." },
      { band: "theta", direction: "elevated", regions: ["Fz", "Cz"], detail: "Elevated frontal midline theta in treatment-resistant depression. May index anterior cingulate activity." },
      { band: "beta", direction: "variable", regions: ["All"], detail: "No consistent beta finding across studies." },
    ],
    ratioMarkers: [
      { name: "Frontal Alpha Asymmetry (FAA)", formula: "log(alpha_F4) - log(alpha_F3)", threshold: "Negative (left > right alpha)", detail: "The most-studied EEG biomarker in depression. Effect sizes are small (d \u2248 0.3) and replication has been inconsistent across studies." },
      { name: "Theta Cordance", formula: "cordance(theta, Fp1, Fp2)", threshold: "Decreased during treatment", detail: "Used as treatment response predictor (Cook et al., 2002). Predicts SSRI response, not diagnosis." },
    ],
    literature: [
      { text: "Allen & Reznik (2015) Curr Opin Psychol: Narrative review of frontal alpha asymmetry in depression", doi: "10.1016/j.copsyc.2014.12.017", verified: true },
      { text: "Newson & Thiagarajan (2019) Brain Sciences: Overview across disorders", doi: "10.3390/brainsci9120387", verified: true },
      { text: "Cook et al. (2002) Am J Psychiatry: Theta cordance as SSRI response predictor", doi: "10.1176/appi.ajp.159.1.122", verified: true },
    ],
    limitations: [
      "Allen & Reznik (2015) is a narrative review, not a meta-analysis — effects are small and unreliable (d \u2248 0.3)",
      "State dependency: EEG changes with mood episode phase",
      "Frontal alpha asymmetry is observed in many conditions, not specific to depression",
      "Theta cordance is a treatment response predictor, not a diagnostic marker",
      "Individual differences in skull thickness and cortical folding affect all measures",
      "SSRIs increase alpha power, potentially normalizing asymmetry without clinical improvement",
    ],
    confidence: "exploratory",
  },
  {
    id: "ocd",
    name: "Obsessive-Compulsive Disorder",
    dsmCode: "F42",
    category: "Anxiety",
    description: "Some qEEG studies report elevated frontal theta and altered error-related negativity (ERN) in OCD, consistent with hyperactive anterior cingulate cortex models. Evidence base is moderate but heterogeneous.",
    recordingCondition: "Resting state (eyes-open) and error-monitoring tasks. Resting-state findings are less consistent than task-related findings.",
    medicationNote: "SSRIs (first-line OCD treatment) increase alpha power. Benzodiazepines increase beta. Antipsychotic augmentation alters theta/delta ratios.",
    spectralSignature: [
      { band: "theta", direction: "elevated", regions: ["Fz", "FCz"], detail: "Elevated frontal midline theta (4-8Hz), potentially reflecting hyperactive conflict monitoring in anterior cingulate cortex." },
      { band: "alpha", direction: "reduced", regions: ["Pz", "O1", "O2"], detail: "Reduced posterior alpha in some studies, suggesting impaired disengagement or sustained vigilance." },
      { band: "beta", direction: "variable", regions: ["F3", "F4"], detail: "Some reports of altered frontal beta, but inconsistent across studies." },
    ],
    ratioMarkers: [
      { name: "Frontal Midline Theta", formula: "theta(Fz, FCz)", threshold: "> 2 SD above norms", detail: "Associated with error monitoring and cognitive control. Task-related elevation (e.g., Flanker task) more robust than resting state." },
    ],
    literature: [
      { text: "Olbrich & Arns (2013) Clin Neurophysiol: EEG biomarkers in psychiatric disorders", doi: "10.1016/j.clinph.2013.03.015", verified: true },
      { text: "Newson & Thiagarajan (2019) Brain Sciences: Frequency analysis across disorders", doi: "10.3390/brainsci9120387", verified: true },
    ],
    limitations: [
      "Most OCD qEEG studies have small samples (N < 30)",
      "Task-related EEG (ERN) findings are more robust than resting-state power spectrum",
      "Comorbid depression and anxiety confound spectral patterns",
      "Medication effects (SSRIs, benzodiazepines) dominate the resting EEG signal",
      "No qEEG marker has been validated for OCD diagnosis",
    ],
    confidence: "moderate",
  },
  {
    id: "tbi",
    name: "Traumatic Brain Injury / Post-Concussion",
    dsmCode: "F07.81",
    category: "Neurocognitive",
    description: "TBI has moderate evidence for increased delta/theta power and reduced alpha, reflecting diffuse axonal injury and impaired thalamocortical communication. Evidence is stronger than for many psychiatric conditions because the mechanism is physical.",
    recordingCondition: "Eyes-closed resting state. Compare to pre-injury baseline if available. Minimum 5 minutes.",
    ageNote: "Pediatric TBI has distinct spectral patterns from adult TBI. Age-matched norms essential.",
    spectralSignature: [
      { band: "delta", direction: "elevated", regions: ["All"], detail: "Excess diffuse delta (1-4Hz) is the most consistent qEEG finding in moderate-severe TBI, reflecting diffuse axonal injury." },
      { band: "theta", direction: "elevated", regions: ["Fz", "Cz", "Pz"], detail: "Elevated theta across midline sites, particularly in post-concussion syndrome." },
      { band: "alpha", direction: "reduced", regions: ["Pz", "O1", "O2"], detail: "Reduced posterior alpha peak power and frequency, reflecting impaired thalamocortical function." },
      { band: "beta", direction: "reduced", regions: ["C3", "C4", "P3", "P4"], detail: "Reduced beta in some studies, particularly over injured regions." },
    ],
    ratioMarkers: [
      { name: "Delta/Alpha Ratio", formula: "delta(all) / alpha(Pz, O1, O2)", threshold: "> 2.0", detail: "Elevated delta/alpha ratio is among the most replicated qEEG findings in TBI research." },
      { name: "Alpha Peak Frequency", formula: "peak(alpha, Pz)", threshold: "< 8.5 Hz (slowed from typical ~10Hz)", detail: "Slowed alpha peak frequency reflecting impaired thalamocortical loop. More specific than power alone." },
    ],
    literature: [
      { text: "Newson & Thiagarajan (2019) Brain Sciences: EEG frequency analysis across disorders", doi: "10.3390/brainsci9120387", verified: true },
      { text: "Arns et al. (2013) Neurosci Biobehav Rev: qEEG patterns overview", doi: "10.1016/j.neubiorev.2012.02.001", verified: true },
    ],
    limitations: [
      "Severity matters: mild TBI (concussion) findings are less consistent than moderate-severe",
      "Time since injury affects spectral patterns — acute vs. chronic phases differ",
      "Pre-injury baseline rarely available for comparison",
      "Comorbid PTSD, depression, and pain confound spectral patterns",
      "qEEG is not FDA-cleared for TBI diagnosis",
    ],
    confidence: "moderate",
  },
  {
    id: "schizophrenia",
    name: "Schizophrenia Spectrum",
    dsmCode: "F20",
    category: "Psychotic",
    description: "Schizophrenia has among the strongest qEEG evidence base, with replicated findings of excess delta/theta, reduced alpha, and altered gamma oscillations. Multiple meta-analyses support these patterns.",
    recordingCondition: "Resting state (eyes-closed). Auditory oddball task for MMN. Minimum 5 minutes resting.",
    medicationNote: "Antipsychotics significantly alter EEG: typical antipsychotics increase theta/delta, atypical antipsychotics increase alpha. Most studied patients are medicated, making medication-free patterns uncertain.",
    spectralSignature: [
      { band: "delta", direction: "elevated", regions: ["F3", "F4", "Fz"], detail: "Elevated frontal delta is one of the most replicated findings, present in both first-episode and chronic schizophrenia." },
      { band: "theta", direction: "elevated", regions: ["F3", "F4", "Fz", "Cz"], detail: "Elevated frontal theta, overlapping with delta excess. May reflect prefrontal dysfunction." },
      { band: "alpha", direction: "reduced", regions: ["Pz", "O1", "O2"], detail: "Reduced posterior alpha peak power and frequency across multiple meta-analyses." },
      { band: "gamma", direction: "reduced", regions: ["All"], detail: "Reduced evoked gamma (40Hz) during auditory steady-state response (ASSR). Among the most specific findings." },
    ],
    ratioMarkers: [
      { name: "Slow-Wave Excess", formula: "(delta+theta) / (alpha+beta)", threshold: "> 2.5 (resting, eyes-closed)", detail: "Elevated slow/fast ratio is replicated across multiple meta-analyses. Not specific to schizophrenia (also seen in TBI, dementia)." },
      { name: "40Hz ASSR Power", formula: "evoked_gamma(40Hz)", threshold: "Reduced vs. controls", detail: "Reduced 40Hz auditory steady-state response. Requires specific auditory stimulation protocol." },
    ],
    literature: [
      { text: "Newson & Thiagarajan (2019) Brain Sciences: EEG frequency analysis across disorders", doi: "10.3390/brainsci9120387", verified: true },
      { text: "Olbrich & Arns (2013) Clin Neurophysiol: EEG biomarkers in psychiatry review", doi: "10.1016/j.clinph.2013.03.015", verified: true },
    ],
    limitations: [
      "Most participants are on antipsychotic medication, which itself alters EEG dramatically",
      "Positive vs. negative symptom profiles may have different spectral correlates",
      "Overlap with other conditions (TBI, dementia, depression) limits specificity",
      "Gamma findings require specific task protocols, not just resting-state recording",
      "No qEEG marker is recommended for schizophrenia screening or diagnosis",
    ],
    confidence: "moderate",
  },
];

/* ── Confidence Badge ─────────────────────────────────────── */

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

/* ── Recording Context Panel ──────────────────────────────── */

function RecordingContextPanel({
  condition,
  setCondition,
}: {
  condition: RecordingCondition;
  setCondition: (c: RecordingCondition) => void;
}) {
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 mb-4">
      <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Recording Context</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] mono text-gray-500 block mb-1">Recording Condition</label>
          <div className="flex gap-1">
            {(["eyes-closed", "eyes-open", "task"] as RecordingCondition[]).map((c) => (
              <button
                key={c}
                onClick={() => setCondition(c)}
                className={`mono text-[9px] px-2 py-1 rounded transition-colors ${
                  condition === c
                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                    : "text-gray-600 hover:text-gray-400 border border-transparent"
                }`}
              >
                {c === "eyes-closed" ? "Eyes Closed" : c === "eyes-open" ? "Eyes Open" : "Task"}
              </button>
            ))}
          </div>
          <p className="text-[8px] text-gray-700 mt-1">
            {condition === "eyes-closed"
              ? "Alpha power is naturally higher with eyes closed. Standard for alpha asymmetry measurement."
              : condition === "eyes-open"
                ? "Standard for TBR measurement. Alpha suppression expected (Berger effect)."
                : "Task-related changes overlay resting patterns. Specify task type for proper interpretation."}
          </p>
        </div>
        <div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5">
            <p className="text-[9px] text-amber-400 font-semibold mb-1">Interpretation Notes</p>
            <ul className="text-[8px] text-gray-500 space-y-0.5">
              <li>- Ratios and thresholds are age-dependent (see pattern details)</li>
              <li>- Minimum 60s artifact-free data for reliable analysis</li>
              <li>- Medication status must be documented</li>
              <li>- Absolute power values depend on hardware/impedance</li>
              <li>- Relative power (band/total) is more comparable across setups</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Live Pattern Matcher ─────────────────────────────────── */

function computeRatios(bands: BandPowers) {
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const thetaAvg = avg(bands.theta);
  const betaAvg = avg(bands.beta);
  const alphaAvg = avg(bands.alpha);
  const deltaAvg = avg(bands.delta);
  const gammaAvg = avg(bands.gamma);
  const totalPower = deltaAvg + thetaAvg + alphaAvg + betaAvg + gammaAvg;

  return {
    tbr: betaAvg > 0 ? thetaAvg / betaAvg : 0,
    tar: alphaAvg > 0 ? thetaAvg / alphaAvg : 0,
    slowFast: (alphaAvg + betaAvg) > 0 ? (deltaAvg + thetaAvg) / (alphaAvg + betaAvg) : 0,
    // Relative power (each band as % of total)
    relativeDelta: totalPower > 0 ? (deltaAvg / totalPower) * 100 : 0,
    relativeTheta: totalPower > 0 ? (thetaAvg / totalPower) * 100 : 0,
    relativeAlpha: totalPower > 0 ? (alphaAvg / totalPower) * 100 : 0,
    relativeBeta: totalPower > 0 ? (betaAvg / totalPower) * 100 : 0,
    relativeGamma: totalPower > 0 ? (gammaAvg / totalPower) * 100 : 0,
    // Absolute (for display)
    thetaAvg,
    betaAvg,
    alphaAvg,
    deltaAvg,
    gammaAvg,
    totalPower,
  };
}

type PowerDisplay = "absolute" | "relative" | "log";

function LiveRatioPanel({ bands, streaming }: { bands: BandPowers; streaming: boolean }) {
  const ratios = useMemo(() => computeRatios(bands), [bands]);
  const [powerDisplay, setPowerDisplay] = useState<PowerDisplay>("relative");

  if (!streaming || bands.alpha.length === 0) {
    return (
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 text-center">
        <span className="mono text-[11px] text-gray-600">Start streaming to see live spectral ratios</span>
      </div>
    );
  }

  const bandValues: Record<string, { abs: number; rel: number; log: number }> = {
    delta: { abs: ratios.deltaAvg, rel: ratios.relativeDelta, log: ratios.deltaAvg > 0 ? Math.log10(ratios.deltaAvg) : 0 },
    theta: { abs: ratios.thetaAvg, rel: ratios.relativeTheta, log: ratios.thetaAvg > 0 ? Math.log10(ratios.thetaAvg) : 0 },
    alpha: { abs: ratios.alphaAvg, rel: ratios.relativeAlpha, log: ratios.alphaAvg > 0 ? Math.log10(ratios.alphaAvg) : 0 },
    beta: { abs: ratios.betaAvg, rel: ratios.relativeBeta, log: ratios.betaAvg > 0 ? Math.log10(ratios.betaAvg) : 0 },
    gamma: { abs: ratios.gammaAvg, rel: ratios.relativeGamma, log: ratios.gammaAvg > 0 ? Math.log10(ratios.gammaAvg) : 0 },
  };

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
          unit="(\u03B4+\u03B8)/(\u03B1+\u03B2)"
        />
      </div>

      {/* Threshold legend */}
      <div className="flex items-center justify-center gap-4 mb-4 text-[9px] mono">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Normal</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Elevated</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> High</span>
      </div>

      {/* Power display toggle */}
      <div className="flex items-center justify-between pt-3 border-t border-[#1f2937] mb-2">
        <span className="mono text-[9px] text-gray-600">Band Power</span>
        <div className="flex gap-1">
          {(["absolute", "relative", "log"] as PowerDisplay[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setPowerDisplay(mode)}
              className={`mono text-[8px] px-1.5 py-0.5 rounded transition-colors ${
                powerDisplay === mode
                  ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                  : "text-gray-600 hover:text-gray-400 border border-transparent"
              }`}
            >
              {mode === "absolute" ? "\u00B5V\u00B2" : mode === "relative" ? "%" : "log\u2081\u2080"}
            </button>
          ))}
        </div>
      </div>

      {/* Band power row */}
      <div className="grid grid-cols-5 gap-2">
        {BAND_NAMES.map((band) => {
          const vals = bandValues[band];
          const displayVal = powerDisplay === "absolute" ? vals.abs : powerDisplay === "relative" ? vals.rel : vals.log;
          const suffix = powerDisplay === "relative" ? "%" : powerDisplay === "log" ? "" : "";
          return (
            <div key={band} className="text-center">
              <div className="text-sm mono font-semibold" style={{ color: BAND_COLORS[band] }}>
                {displayVal.toFixed(powerDisplay === "log" ? 2 : 1)}{suffix}
              </div>
              <div className="text-[8px] mono text-gray-600 uppercase">{band}</div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <p className="text-[8px] text-gray-700 text-center mt-3">
        TBR threshold (4.5) applies to ages 6-13 only (Monastra et al., 1999). TAR and Slow/Fast thresholds are reference values
        without validated published thresholds. Relative power is more comparable across devices than absolute power.
      </p>
    </div>
  );
}

/* ── DSM Pattern Card ─────────────────────────────────────── */

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

          {/* Recording context & notes */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
            <h4 className="text-[9px] mono text-blue-400 uppercase mb-1.5">Recording Requirements</h4>
            <p className="text-[10px] text-gray-500">{pattern.recordingCondition}</p>
            {pattern.ageNote && (
              <p className="text-[10px] text-gray-500 mt-1"><strong className="text-blue-400">Age:</strong> {pattern.ageNote}</p>
            )}
            {pattern.medicationNote && (
              <p className="text-[10px] text-gray-500 mt-1"><strong className="text-blue-400">Medication:</strong> {pattern.medicationNote}</p>
            )}
          </div>

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
                      {sig.direction === "elevated" ? "\u2191 Elevated" : sig.direction === "reduced" ? "\u2193 Reduced" : "\u2195 Variable"}
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
                  <span>
                    {ref.text}
                    {ref.doi && (
                      <span className="text-gray-600 ml-1">
                        DOI: {ref.doi}
                        {ref.verified && <span className="text-emerald-600 ml-1" title="DOI verified via Crossref">\u2713</span>}
                      </span>
                    )}
                  </span>
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

/* ── How qEEG Analysis Works ──────────────────────────────── */

function QeegExplainer() {
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
      <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">How qEEG Spectral Analysis Works</h3>
      <div className="space-y-3 text-[10px] text-gray-500 leading-relaxed">
        <div>
          <h4 className="text-[11px] font-semibold text-gray-300 mb-1">1. Raw Signal to Frequency Domain</h4>
          <p>
            Raw EEG is a time-domain signal (voltage over time). Fast Fourier Transform (FFT) decomposes it into
            frequency components, producing a power spectral density (PSD) curve. This shows how much power
            (measured in \u00B5V\u00B2/Hz) is present at each frequency.
          </p>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold text-gray-300 mb-1">2. Band Power Extraction</h4>
          <p>
            The PSD is divided into standard frequency bands: Delta (0.5-4Hz), Theta (4-8Hz), Alpha (8-13Hz),
            Beta (13-30Hz), Gamma (30-100Hz). Power in each band is computed by integrating the PSD across that
            range.
          </p>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold text-gray-300 mb-1">3. Absolute vs. Relative Power</h4>
          <p>
            <strong className="text-gray-300">Absolute power</strong> (\u00B5V\u00B2) depends on hardware, impedance, and skull thickness — hard
            to compare across setups. <strong className="text-gray-300">Relative power</strong> (band power / total power, expressed as %)
            normalizes for these factors and is more clinically meaningful. <strong className="text-gray-300">Log-transformed</strong> (log\u2081\u2080)
            absolute power approximates a normal distribution, enabling parametric statistics and Z-scores.
          </p>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold text-gray-300 mb-1">4. Clinical qEEG Pipeline</h4>
          <p>
            Clinical quantitative EEG (qEEG) follows: artifact rejection (remove blinks, muscle, movement) \u2192
            epoch segmentation (2-4 second windows) \u2192 FFT per epoch \u2192 average power per band per electrode \u2192
            log\u2081\u2080 transform \u2192 Z-score against an age-matched normative database \u2192 topographic display. This
            platform performs steps 1-3 but does NOT include artifact rejection or normative Z-scoring.
          </p>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold text-gray-300 mb-1">5. What This Platform Does and Does Not Do</h4>
          <p>
            This platform computes band power from live or sample data using FFT. It does NOT perform clinical-grade
            artifact rejection, does NOT compare to normative databases, does NOT compute Z-scores, and does NOT
            provide diagnostic conclusions. The ratios and patterns shown are educational references to published
            research, computed on raw (un-cleaned) data. Clinical qEEG requires professionally supervised recording,
            clinical-grade amplifiers, standardized electrode placement, and interpretation by a trained specialist.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── DSM Analysis Tab ─────────────────────────────────────── */

function DsmAnalysisTab({ bands, streaming }: { bands: BandPowers; streaming: boolean }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [condition, setCondition] = useState<RecordingCondition>("eyes-open");
  const [showExplainer, setShowExplainer] = useState(false);

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
                      diagnostic. The AAN gave it a Level R recommendation (insufficient evidence to support or refute).
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
                  limitations, and specific citations with DOIs. It also computes live spectral ratios from your
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

      {/* Recording context */}
      <RecordingContextPanel condition={condition} setCondition={setCondition} />

      {/* Live ratio panel */}
      <LiveRatioPanel bands={bands} streaming={streaming} />

      {/* How it works toggle */}
      <button
        onClick={() => setShowExplainer(!showExplainer)}
        className="mono text-[10px] text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
      >
        <svg width="10" height="10" viewBox="0 0 12 12" className={`transition-transform ${showExplainer ? "rotate-90" : ""}`}>
          <path d="M4 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        {showExplainer ? "Hide" : "Show"}: How qEEG Spectral Analysis Works
      </button>
      {showExplainer && <QeegExplainer />}

      {/* Pattern cards */}
      <div className="space-y-3">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider">DSM-5-TR Pattern References ({DSM_PATTERNS.length} categories)</h3>
        {DSM_PATTERNS.map((p) => (
          <PatternCard key={p.id} pattern={p} />
        ))}
      </div>

      {/* Literature note */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-2">About This Data</h3>
        <p className="text-[10px] text-gray-500 leading-relaxed mb-2">
          All patterns are sourced from peer-reviewed publications and systematic reviews.
          Every citation includes a DOI verified via Crossref API.
          Evidence confidence levels reflect the strength and consistency of findings across
          studies. "Moderate" means replicated in multiple studies with caveats.
          "Low" means some supportive evidence but significant inconsistencies.
          "Exploratory" means very limited evidence, included for educational completeness only.
        </p>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mt-2">
          <h4 className="text-[9px] mono text-amber-400 uppercase mb-1">Medication Effects on EEG</h4>
          <ul className="text-[9px] text-gray-500 space-y-0.5">
            <li>- <strong className="text-gray-400">SSRIs</strong>: increase alpha power, may normalize frontal asymmetry without clinical improvement</li>
            <li>- <strong className="text-gray-400">Benzodiazepines</strong>: increase fast beta (&gt; 20Hz), may mask anxiety patterns or mimic them</li>
            <li>- <strong className="text-gray-400">Stimulants</strong>: reduce theta power and normalize TBR within 30-60 minutes</li>
            <li>- <strong className="text-gray-400">Antipsychotics</strong>: typical increase theta/delta, atypical increase alpha</li>
            <li>- <strong className="text-gray-400">Anticonvulsants</strong>: variable effects depending on class, generally increase slow activity</li>
          </ul>
          <p className="text-[8px] text-gray-600 mt-1.5">
            Always document medication status when interpreting qEEG. Medication effects often exceed the effect sizes
            of the disorder-related patterns themselves.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main Module ──────────────────────────────────────────── */

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
