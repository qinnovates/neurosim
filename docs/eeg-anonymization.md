# EEG/BCI Data Anonymization Guide

> **Disclaimer:** This document describes proposed implementation approaches. QIF and its components are unvalidated research tools, not production security products.

---

## Table of Contents

1. [PII in the EEG/BCI Space](#1-pii-in-the-eegbci-space)
2. [Implementation Steps for EEG Anonymization](#2-implementation-steps-for-eeg-anonymization)
3. [Security Principles Applied](#3-security-principles-applied)
4. [QIF Integration](#4-qif-integration)
5. [Sources](#sources)

---

## 1. PII in the EEG/BCI Space

### 1.1 Why EEG Data Is Personally Identifiable

EEG signals are biometrically unique. Research has demonstrated that brain activity patterns can identify individuals with high accuracy, making raw EEG recordings a form of personally identifiable information (PII) under multiple regulatory frameworks.

**Key research establishing EEG as a biometric identifier:**

- **Campisi & La Rocca (2014)** demonstrated that EEG-based biometric systems can achieve reliable person recognition using spectral coherence-based functional connectivity features. Their review in *IEEE Transactions on Information Forensics and Security* (vol. 9, pp. 782-800) established that brain wave patterns are individually unique and stable enough to serve as biometric identifiers. La Rocca et al. achieved 100% recognition accuracy among 108 subjects using frontal lobe connectivity patterns during resting state conditions.

- **Marcel & Millan (2007)** published "Person Authentication Using Brainwaves (EEG) and Maximum A Posteriori Model Adaptation" in *IEEE Transactions on Pattern Analysis and Machine Intelligence* (vol. 29, no. 4, pp. 743-748). They demonstrated that EEG is an effective modality for person authentication, with three properties that distinguish it from traditional biometrics: it is confidential (corresponds to a mental task), very difficult to mimic (similar mental tasks are person-dependent), and almost impossible to steal.

**What makes neural data different from other biometrics:**

| Property | Fingerprint / Face | EEG / Neural Data |
|----------|-------------------|-------------------|
| Revocability | Cannot be changed, but can be masked | Cannot be changed, cannot be masked |
| Information depth | Surface physical features | Cognitive states, health conditions, emotional responses, intentions |
| Inference potential | Limited to identity | Can infer neurological conditions, mental health status, cognitive load, attention, preferences |
| Temporal richness | Static snapshot | Continuous time-series revealing behavioral patterns |
| Dual classification | Biometric data | Biometric data AND health data simultaneously |

This dual classification as both biometric and health data triggers the most stringent protections under every major regulatory framework.

### 1.2 Regulatory Classification of Neural Data as PII

#### GDPR Article 9 -- Special Category Data

The EU General Data Protection Regulation classifies biometric data processed for identification purposes as "special category data" under Article 9, which is subject to a general prohibition on processing with only ten narrowly defined exceptions (including explicit consent).

EEG data qualifies as special category data on two independent grounds:

1. **Biometric data** (Art. 9(1)): EEG patterns can uniquely identify individuals, as demonstrated by brainprint research. The GDPR defines biometric data as "personal data resulting from specific technical processing relating to the physical, physiological or behavioural characteristics of a natural person, which allow or confirm the unique identification of that natural person" (Art. 4(14)).

2. **Health data** (Art. 9(1)): EEG recordings inherently contain information about neurological conditions, sleep disorders, epilepsy, cognitive decline, and other health-related states. Any processing that reveals health information, even incidentally, triggers Art. 9 protections.

Researchers have noted that while GDPR does not explicitly mention "neurodata," courts and regulators treat neural signals as biometric-health hybrids, triggering the same safeguards applied to genetic information or medical diagnoses (Ienca & Haselager, 2016; Yuste et al., 2017). The European Data Protection Supervisor published TechDispatch #1/2024 specifically addressing neurodata, confirming this classification approach.

**Practical implications:** Any system processing EEG data within GDPR jurisdiction must establish a lawful basis under Art. 9(2), implement Data Protection Impact Assessments (Art. 35), and appoint a Data Protection Officer if processing is large-scale (Art. 37).

#### HIPAA -- Protected Health Information

Under the U.S. Health Insurance Portability and Accountability Act, EEG recordings are explicitly classified as Protected Health Information (PHI) when collected or maintained by a covered entity (healthcare providers, health plans, clearinghouses) or their business associates.

EEG tracings are listed as examples of PHI subject to HIPAA protections. Compliance requirements include:

- Obtaining patient consent before sharing EEG data
- Using encryption standards (TLS for transit, AES for storage)
- Executing Business Associate Agreements with any third-party processors
- Implementing role-based access controls
- Following the Safe Harbor de-identification method (removal of 18 unique identifiers)

**Critical gap:** HIPAA's scope is limited to data handled by healthcare entities and their business associates. Consumer neurotechnology companies producing non-medical EEG headsets (e.g., meditation bands, gaming devices, productivity monitors) generally fall outside HIPAA jurisdiction. This leaves a significant volume of neural data unprotected by HIPAA, despite containing identical biometric and health information.

#### IEEE Standards Landscape

The IEEE launched a Neurotechnologies for Brain-Machine Interfacing Standards Roadmap in 2020, identifying gaps in existing standards for neural data protection. Key working groups include:

- **IEEE P2731**: Defining information that should be stored in neural data files, including metadata standards.
- **IEEE P2933 (TIPPSS for Clinical IoT)**: Trust, Identity, Privacy, Protection, Safety, and Security framework applicable to BCI data flows.
- **IEEE Brain Initiative**: Coordinating standards activities across neurotechnology, with recognition that neural data are "inherently identifiable" and constitute personal data under existing definitions.

The IEEE Standards Roadmap acknowledges that the scarcity of neurotechnology-specific standards hinders interoperability, regulatory compliance, and user protection.

#### Ienca & Andorno (2017) -- Neurorights Framework

Marcello Ienca and Roberto Andorno published "Towards new human rights in the age of neuroscience and neurotechnology" in *Life Sciences, Society and Policy* (vol. 13, no. 1, article 5, 2017). They proposed four new rights in response to emerging neurotechnology:

1. **Right to cognitive liberty** -- freedom to use or refuse neurotechnology
2. **Right to mental privacy** -- protection of brain data from unauthorized access
3. **Right to mental integrity** -- protection from unauthorized manipulation of neural activity
4. **Right to psychological continuity** -- protection of personal identity from neurotechnological alteration

Their argument: existing human rights frameworks, drafted before neurotechnology was conceivable, do not adequately address the unique privacy and autonomy risks posed by technologies that can read, decode, or modify brain activity. Neural data differs from other personal data because it can reveal not just identity but thoughts, emotions, intentions, and cognitive states, none of which have historically been externally accessible.

#### OECD Recommendation on Responsible Innovation in Neurotechnology

The OECD Recommendation #457, adopted in 2019 and updated with a practical toolkit in April 2024, constitutes the first international standard for neurotechnology governance. The OECD defines brain data as:

> "Data related to the functioning or structure of the human brain of an identified or identifiable individual that includes unique information about their physiology, health or mental states."

Key governance principles relevant to anonymization:

- **Data minimization and limited circulation** of neural data
- **Precautionary principle** when harms could be serious or irreversible
- **Transparency and accountability** in neurotechnology development
- Promotion of **best practices** for data handling, security, and privacy

A 2024 audit by the Neurorights Foundation of 30 consumer neurotechnology companies found that 96.7% reserve the right to transfer brain data to third parties, fewer than 20% mention encryption, only 16.7% commit to breach notification, and just 10% adopt all core safety measures.

#### Chile's Neurorights Law (Ley 21.383, 2021)

Chile became the first country to constitutionally protect neural data. Law 21.383, adopted October 14, 2021, amended Article 19 of the Chilean Constitution to state:

> "Scientific and technological development will be in service to individuals and carried out with respect for life and physical and psychological integrity. The law will regulate the requirements, conditions, and limitations for its use in individuals, with particular emphasis on safeguarding brain activity and the information derived from it."

The Chilean Supreme Court has subsequently ruled that neurodata is sensitive and biometric data under the Data Protection Act 19.698. The legislative intent is to give brain data the same legal status as an organ: it cannot be bought, sold, trafficked, or manipulated without consent.

This law has influenced legislative efforts in Brazil (Rio Grande do Sul), the U.S. state of Colorado, and California's pending Neurorights Bill.

#### Rafael Yuste and the NeuroRights Foundation

Rafael Yuste, professor of neurobiology at Columbia University, co-founded the Neurorights Foundation with human rights lawyer Jared Gesner. The Foundation advocates for five neurorights:

1. **Right to mental privacy** -- brain data cannot be used without consent
2. **Right to free will** -- decisions free from neurotechnological influence
3. **Right to personal identity** -- technology cannot alter sense of self
4. **Right to protection from discrimination** based on brain data
5. **Right to equal access** to neural augmentation

The Foundation's audit of 30 consumer neurotechnology companies revealed that clicking "I agree" on 29 of 30 user agreements would grant the company unrestricted rights to neural data, including the right to sell it to third parties.

#### FDA Guidance on BCI Device Data

The FDA classifies most implantable BCIs as Class III medical devices requiring premarket approval, but current guidance focuses on safety and efficacy with limited provisions for neural data privacy. Key gaps:

- No specific data ownership requirements for neural data collected by approved BCIs
- No standardized data retention or deletion policies for neural recordings
- Consumer (non-medical) BCI devices largely fall outside FDA jurisdiction

The U.S. Government Accountability Office (GAO) has recommended a unified regulatory framework covering both medical and non-medical BCI uses with uniform data protection rules. The proposed MIND Act (S2925) aims to address this gap.

#### NIST Privacy Framework Applicability

The NIST Privacy Framework (version 1.1, updated 2025) is technology-neutral and applicable to neural data through its core functions: Identify, Govern, Control, Communicate, and Protect. While not neural-data-specific, it provides structure for:

- **Risk assessment** for biometric data processing (including EEG)
- **Data processing governance** aligned with organizational privacy values
- **Privacy engineering** practices applicable to neural signal pipelines

NIST has separately addressed biometric privacy, noting that different uses of biometrics give rise to different degrees of privacy risk requiring calibrated mitigation.

---

## 2. Implementation Steps for EEG Anonymization

### 2.1 Signal-Level Anonymization

Signal-level techniques modify the EEG data itself to reduce identifiability while preserving analytical utility.

#### Temporal Jitter Injection

Add a random time offset to all timestamps to break correlation with external events (video, audio, behavioral logs) that could enable re-identification.

```python
import numpy as np

def apply_temporal_jitter(timestamps: np.ndarray, max_jitter_ms: float = 50.0) -> np.ndarray:
    """
    Shift all timestamps by a single random offset (preserving relative timing)
    plus per-sample micro-jitter to prevent template matching.

    Args:
        timestamps: Array of sample timestamps in milliseconds.
        max_jitter_ms: Maximum jitter magnitude in milliseconds.

    Returns:
        Jittered timestamps with preserved inter-sample intervals.
    """
    # Global offset: shift the entire recording by a random amount
    global_offset = np.random.uniform(-max_jitter_ms * 10, max_jitter_ms * 10)

    # Per-sample micro-jitter: small perturbations that do not affect
    # analysis at typical EEG sampling rates (256-1024 Hz)
    micro_jitter = np.random.normal(0, max_jitter_ms * 0.1, size=len(timestamps))

    return timestamps + global_offset + micro_jitter
```

**Trade-off:** Jitter exceeding 1/sampling_rate degrades ERP analysis. For security-focused analysis (band power, coherence), jitter up to 50ms is acceptable at 256 Hz.

#### Amplitude Normalization

Individual alpha amplitude, baseline voltage, and impedance characteristics are subject-specific. Z-score normalization per channel removes absolute amplitude information while preserving relative signal structure.

```python
def normalize_amplitude(eeg_data: np.ndarray, axis: int = 1) -> np.ndarray:
    """
    Z-score normalize EEG data per channel to remove subject-specific
    amplitude scaling.

    Args:
        eeg_data: Array of shape (channels, samples).
        axis: Axis along which to normalize (1 = per-channel).

    Returns:
        Normalized EEG data with zero mean and unit variance per channel.
    """
    mean = np.mean(eeg_data, axis=axis, keepdims=True)
    std = np.std(eeg_data, axis=axis, keepdims=True)
    # Prevent division by zero for flat channels
    std = np.where(std == 0, 1.0, std)
    return (eeg_data - mean) / std
```

**Limitation:** Normalization removes amplitude-based identity features but does not eliminate spectral shape or phase-based biometric signatures.

#### Spectral Whitening

Individual alpha peak frequency (typically 8-13 Hz) is a strong biometric marker. Spectral whitening flattens the power spectrum to reduce the distinctiveness of individual spectral peaks.

```python
from scipy import signal as sig

def spectral_whitening(eeg_channel: np.ndarray, fs: float) -> np.ndarray:
    """
    Apply spectral whitening to flatten frequency-domain characteristics.

    Args:
        eeg_channel: Single-channel EEG time series.
        fs: Sampling frequency in Hz.

    Returns:
        Spectrally whitened signal with reduced individual spectral signatures.
    """
    # Compute FFT
    freqs = np.fft.rfftfreq(len(eeg_channel), d=1.0 / fs)
    fft_vals = np.fft.rfft(eeg_channel)

    # Compute amplitude spectrum
    amplitude = np.abs(fft_vals)
    amplitude = np.where(amplitude == 0, 1e-10, amplitude)

    # Whiten: divide by amplitude, preserving phase
    whitened_fft = fft_vals / amplitude

    # Reconstruct time-domain signal
    return np.fft.irfft(whitened_fft, n=len(eeg_channel))
```

**Trade-off:** Full whitening destroys band-power information. Partial whitening (applying only within the alpha band, 8-13 Hz) preserves other frequency bands while reducing the strongest biometric feature.

#### Channel Label Abstraction

Replace subject-specific or montage-specific channel labels with generic identifiers.

| Before (Identifiable) | After (Abstracted) |
|-----------------------|-------------------|
| `EEG Fp1-LE` (linked ear reference) | `CH_01` |
| `EEG_O2_Mastoid_Right` | `CH_14` |
| `BioSemi_A1_SubjectJD_Session3` | `CH_01` |

Strip all channel metadata that encodes: subject initials, session identifiers, lab-specific naming conventions, device-specific prefixes, and montage configuration details.

#### Epoch Shuffling

Break temporal continuity to prevent behavioral re-identification (correlating EEG patterns with known behavioral timelines).

```python
def shuffle_epochs(
    eeg_data: np.ndarray,
    epoch_duration_samples: int,
    rng_seed: int | None = None
) -> np.ndarray:
    """
    Segment EEG into fixed-length epochs and randomly permute their order.

    Args:
        eeg_data: Array of shape (channels, samples).
        epoch_duration_samples: Number of samples per epoch.
        rng_seed: Optional seed for reproducibility (use only during validation).

    Returns:
        Epoch-shuffled EEG data.
    """
    rng = np.random.default_rng(rng_seed)
    n_channels, n_samples = eeg_data.shape
    n_epochs = n_samples // epoch_duration_samples
    truncated = eeg_data[:, :n_epochs * epoch_duration_samples]

    # Reshape into (channels, n_epochs, epoch_length)
    epochs = truncated.reshape(n_channels, n_epochs, epoch_duration_samples)

    # Shuffle epoch order (same permutation across all channels)
    perm = rng.permutation(n_epochs)
    shuffled = epochs[:, perm, :]

    return shuffled.reshape(n_channels, n_epochs * epoch_duration_samples)
```

**Trade-off:** Destroys temporal ordering needed for ERP analysis, sleep staging, or seizure localization. Acceptable for frequency-domain security analysis (band powers, coherence metrics).

### 2.2 Metadata Anonymization

Metadata can be as identifying as the signal itself. Every field must be evaluated.

#### Recording Metadata Stripping

Remove or redact the following from all EEG file headers (EDF, BDF, GDF, XDF, BIDS):

| Metadata Field | Action | Rationale |
|---------------|--------|-----------|
| Patient name / ID | Remove or replace with random UUID | Direct identifier |
| Date of birth | Remove | Direct identifier |
| Device serial number | Remove | Links to purchase records |
| Session ID | Replace with random hash | Links to scheduling systems |
| Operator / technician name | Remove | Indirect identifier |
| Hospital / lab name | Remove | Geolocation + institutional records |
| Recording software version | Generalize (e.g., "EDF+ compatible") | Reduces fingerprinting surface |
| Electrode impedance values | Remove | Subject-specific scalp characteristics |

```python
import hashlib
import uuid

def anonymize_metadata(metadata: dict) -> dict:
    """
    Strip or hash identifying metadata fields from EEG recording headers.

    Args:
        metadata: Dictionary of EEG file header fields.

    Returns:
        Anonymized metadata dictionary.
    """
    # Fields to remove entirely
    remove_fields = [
        "patient_name", "patient_id", "date_of_birth",
        "device_serial", "operator_name", "hospital",
        "lab_name", "impedance_values"
    ]

    # Fields to hash (preserves grouping without revealing identity)
    hash_fields = ["session_id"]

    anonymized = {}
    for key, value in metadata.items():
        if key in remove_fields:
            continue
        elif key in hash_fields:
            # One-way hash with salt
            salt = uuid.uuid4().hex
            anonymized[key] = hashlib.sha256(
                f"{salt}{value}".encode()
            ).hexdigest()[:16]
        else:
            anonymized[key] = value

    # Replace patient ID with random UUID
    anonymized["subject_id"] = str(uuid.uuid4())

    return anonymized
```

#### Timestamp Generalization

Reduce temporal precision to prevent correlation with external records.

| Original | Generalized | Privacy Gain |
|----------|-------------|-------------|
| `2026-03-13 14:23:07.123` | `2026-W11` | Cannot correlate with appointment records |
| `14:23:07` | `afternoon` (12:00-18:00 bin) | Cannot correlate with schedule |
| `Recording duration: 47min 23s` | `Recording duration: 30-60min` | Reduces unique session fingerprint |

#### Geolocation Removal

Consumer EEG devices with Bluetooth/WiFi may embed:
- GPS coordinates from paired mobile device
- WiFi BSSID / SSID from connection logs
- Timezone offset (narrows location to ~15-degree longitude band)
- Cell tower IDs from mobile data connection

**Action:** Strip all location-derived fields. If timezone is required for circadian analysis, generalize to continental region (e.g., "Americas/Eastern" rather than specific timezone).

### 2.3 Differential Privacy for Neural Data

Differential privacy provides mathematically rigorous privacy guarantees by adding calibrated noise to data or query results, ensuring that no individual's data materially affects the output.

#### Adding Calibrated Noise to Frequency-Domain Features

For security analysis, EEG is typically reduced to frequency-domain features (band powers, coherence values). Differential privacy is applied at this feature level, not to raw time-series data.

```python
def add_laplace_noise(
    feature_value: float,
    sensitivity: float,
    epsilon: float
) -> float:
    """
    Apply Laplace mechanism for epsilon-differential privacy.

    Args:
        feature_value: The true feature value (e.g., alpha band power).
        sensitivity: Maximum change in feature from one individual's data.
        epsilon: Privacy budget parameter. Lower = more private, noisier.

    Returns:
        Privatized feature value.
    """
    scale = sensitivity / epsilon
    noise = np.random.laplace(0, scale)
    return feature_value + noise


def privatize_band_powers(
    band_powers: dict[str, float],
    epsilon: float = 1.0,
    sensitivities: dict[str, float] | None = None
) -> dict[str, float]:
    """
    Apply differential privacy to EEG band power features.

    Args:
        band_powers: Dict mapping band names to power values (uV^2).
        epsilon: Total privacy budget (split across bands).
        sensitivities: Per-band sensitivity values. Defaults provided
                       based on typical clinical EEG ranges.

    Returns:
        Differentially private band power estimates.
    """
    default_sensitivities = {
        "delta": 50.0,    # 0.5-4 Hz, high variance
        "theta": 30.0,    # 4-8 Hz
        "alpha": 25.0,    # 8-13 Hz
        "beta": 15.0,     # 13-30 Hz
        "gamma": 10.0,    # 30-100 Hz, low amplitude
    }
    sens = sensitivities or default_sensitivities

    n_bands = len(band_powers)
    per_band_epsilon = epsilon / n_bands  # Sequential composition

    privatized = {}
    for band, power in band_powers.items():
        band_sens = sens.get(band, 25.0)
        privatized[band] = add_laplace_noise(power, band_sens, per_band_epsilon)

    return privatized
```

#### Privacy Budget Recommendations

| Use Case | Recommended Epsilon | Rationale |
|----------|-------------------|-----------|
| Public release of aggregated features | 0.1 - 0.5 | Strong privacy, suitable for population-level statistics |
| Internal security analysis | 1.0 - 3.0 | Moderate privacy, preserves per-session anomaly detection capability |
| Real-time threat detection | 5.0 - 10.0 | Weak privacy but necessary for signal fidelity in active defense |
| Research datasets (shared with collaborators) | 0.5 - 1.0 | Balanced for reproducibility and privacy |

**Guidance:** For security analysis where detecting signal anomalies (potential attacks) is the primary goal, an epsilon of 1.0-3.0 provides a practical balance. Below 1.0, noise may mask genuine security-relevant deviations. Above 5.0, the privacy guarantee becomes marginal.

#### Privacy vs. Signal Fidelity Trade-off

| Epsilon | Alpha Power Noise (uV^2) | Can Detect | Cannot Detect |
|---------|--------------------------|------------|---------------|
| 0.1 | ~250 | Population-level trends | Individual session anomalies |
| 1.0 | ~25 | Moderate amplitude deviations | Subtle spectral shifts |
| 5.0 | ~5 | Fine-grained spectral changes | -- (most features preserved) |
| 10.0 | ~2.5 | Nearly all features | -- (minimal privacy) |

### 2.4 Re-identification Risk Assessment

#### Known Attack Vectors

| Attack | Mechanism | Data Required | Effectiveness |
|--------|-----------|---------------|---------------|
| **Brainprint matching** | Correlate spectral connectivity patterns with a reference database of known subjects | Raw or minimally processed multi-channel EEG | High. Campisi & La Rocca (2014) achieved 100% accuracy on 108 subjects |
| **Alpha peak fingerprinting** | Individual alpha peak frequency (IAF) is stable across sessions and distinctive | Power spectral density in the 8-13 Hz band | Moderate-High. IAF varies by ~1 Hz between individuals but is stable within-subject |
| **P300 response patterns** | Event-related potential morphology is individually characteristic | Stimulus-locked EEG epochs | Moderate. Requires known stimulus timing for alignment |
| **Cross-session template attack** | Match anonymized data against previously collected identified data from same individual | Any two sessions from same subject, even if anonymized independently | High if anonymization is not session-independent |
| **Behavioral correlation** | Correlate EEG temporal patterns with known behavioral timeline (keystrokes, eye tracking) | Timestamped EEG + behavioral logs | High if temporal alignment is preserved |
| **Metadata inference** | Combine generalized metadata (approximate time, device type, region) to narrow candidate pool | Anonymized metadata fields | Variable. Depends on population size and metadata granularity |

#### Minimum Anonymization Threshold

Before any EEG data leaves a device, the following minimum anonymization steps must be completed:

1. All direct identifiers removed (names, IDs, dates of birth)
2. Amplitude normalization applied
3. Timestamps generalized to time-of-day bins
4. Device serial numbers and session IDs stripped or hashed
5. Channel labels abstracted to generic format

For higher-risk scenarios (data leaving organizational boundary):

6. Spectral whitening of alpha band
7. Epoch shuffling
8. Differential privacy applied to extracted features (epsilon <= 1.0)
9. k-anonymity verification (k >= 5) on metadata quasi-identifiers

#### k-Anonymity and l-Diversity for EEG Feature Sets

Traditional k-anonymity requires that each record is indistinguishable from at least k-1 other records on quasi-identifier attributes. For EEG data:

**Quasi-identifiers in EEG context:**
- Age group (decade bins)
- Sex
- Device type
- Recording context (clinical / research / consumer)
- Approximate geographic region

**l-Diversity for sensitive attributes:**
If EEG-derived health information (e.g., epileptiform activity, sleep disorder indicators) is retained, l-diversity requires that each equivalence class contains at least l distinct values of the sensitive attribute, preventing attribute disclosure.

**Practical target:** k >= 5, l >= 3 for any dataset released for research purposes.

### 2.5 Architecture: Where Anonymization Happens

#### Core Principle: Anonymize at the Edge

Raw EEG data must never leave the recording device without anonymization. The attack surface for neural data is maximized during transmission, where network interception, man-in-the-middle attacks, and server compromises can expose raw brain signals.

```
                        TRUST BOUNDARY (DEVICE EDGE)
                                    |
Raw EEG Signal                      |        Anonymized Features
  (from electrodes)                 |          (to network)
         |                          |               |
         v                          |               v
+------------------+                |    +---------------------+
| Signal Capture   |                |    | Encrypted Transport |
| (on-device ADC)  |                |    | (TLS 1.3 + AES-256)|
+--------+---------+                |    +----------+----------+
         |                          |               |
         v                          |               v
+------------------+                |    +---------------------+
| On-Device        |                |    | Server Receives     |
| Anonymization    |  =============>|    | ONLY Anonymized     |
| Pipeline         |                |    | Feature Vectors     |
+------------------+                |    +---------------------+
  1. Amplitude norm                 |
  2. Spectral whitening             |
  3. Metadata stripping             |
  4. Feature extraction             |
  5. Differential privacy           |
  6. Epoch shuffling (if needed)    |
```

#### Pipeline Stages

| Stage | Location | Input | Output | Irreversible? |
|-------|----------|-------|--------|---------------|
| 1. Signal capture | On-device (hardware) | Analog electrode signal | Digital EEG samples | N/A |
| 2. Preprocessing | On-device (firmware/software) | Raw digital EEG | Filtered, artifact-rejected EEG | No |
| 3. Anonymization | On-device (software) | Clean EEG + metadata | Anonymized EEG + stripped metadata | Yes (by design) |
| 4. Feature extraction | On-device (software) | Anonymized EEG | Band powers, coherence, connectivity features | Yes (lossy) |
| 5. Differential privacy | On-device (software) | Exact features | Noised features | Yes |
| 6. Encryption | On-device (software) | Anonymized features | Encrypted payload | No (reversible with key) |
| 7. Transmission | Network | Encrypted payload | Encrypted payload | N/A |
| 8. Decryption | Server | Encrypted payload | Anonymized features (never raw EEG) | N/A |

#### Zero-Trust Model for Neural Data

Assume every network hop is compromised. Design implications:

- **No raw EEG in transit.** The server never receives raw time-series data. Only anonymized feature vectors cross the trust boundary.
- **No raw EEG at rest on server.** If raw EEG must be stored (e.g., for on-device replay), it stays on the device with device-local encryption.
- **Mutual authentication.** Both device and server verify identity before any data exchange.
- **Per-session keys.** Encryption keys are ephemeral and session-scoped. Compromise of one session does not expose others.
- **No implicit trust.** Even within an organization's network, neural data is encrypted in transit between services.

---

## 3. Security Principles Applied

### 3.1 Data Minimization -- GDPR Art. 5(1)(c)

> "Personal data shall be adequate, relevant and limited to what is necessary in relation to the purposes for which they are processed."

| Principle Application | Implementation |
|----------------------|----------------|
| Collect only what is needed | Extract only the frequency-domain features required for security analysis. Do not transmit raw EEG if band powers suffice. |
| Reduce before transmit | Feature extraction on-device reduces a 256 Hz, 32-channel EEG stream (~2 MB/min) to a feature vector (~200 bytes/epoch). |
| Delete raw data | After feature extraction and anonymization, raw EEG is purged from device memory (secure wipe, not just deallocation). |

### 3.2 Purpose Limitation

Anonymized neural data collected for security analysis (threat detection, anomaly identification) must not be repurposed for:
- Marketing or user profiling
- Cognitive performance scoring
- Employment or insurance decisions
- Law enforcement without judicial authorization

**Technical enforcement:** Feature vectors are domain-specific. Extract only security-relevant features (band power deviations, coherence anomalies) and discard features that would enable cognitive profiling (ERP components, emotional valence markers).

### 3.3 Storage Limitation

| Data Type | Retention Period | Justification |
|-----------|-----------------|---------------|
| Raw EEG (on-device only) | Session duration only; purge after feature extraction | Minimizes exposure window |
| Anonymized feature vectors | 90 days rolling window | Sufficient for anomaly baseline and trend detection |
| Aggregated statistics | 1 year | Long-term baseline for population-level threat intelligence |
| Incident-related features | Duration of investigation + 30 days | Forensic analysis of confirmed security events |

All retention periods subject to organizational policy. Automated deletion enforced by the system, not dependent on manual processes.

### 3.4 Integrity and Confidentiality

| Layer | Mechanism | Standard |
|-------|-----------|----------|
| At rest (device) | AES-256-GCM with device-bound key | NIST SP 800-38D |
| At rest (server) | AES-256-GCM with HSM-managed key | NIST SP 800-38D |
| In transit | TLS 1.3 with certificate pinning | IETF RFC 8446 |
| Key management | Per-session ephemeral keys, rotated on each connection | NIST SP 800-57 |
| Integrity verification | HMAC-SHA256 on feature vectors before transmission | FIPS 198-1 |

### 3.5 Privacy by Design -- Cavoukian's 7 Foundational Principles

Ann Cavoukian's Privacy by Design framework, developed in the 1990s and adopted as an international standard, maps directly to neural data architecture:

| Principle | Application to EEG Anonymization |
|-----------|--------------------------------|
| 1. Proactive, not reactive | Anonymization is built into the device firmware, not applied after a breach |
| 2. Privacy as default | No configuration required to enable anonymization; raw data sharing requires explicit opt-in |
| 3. Privacy embedded in design | Anonymization pipeline is a core system component, not an optional module |
| 4. Full functionality (positive-sum) | Anonymized features remain analytically useful for security detection; privacy does not require sacrificing security capability |
| 5. End-to-end lifecycle protection | From electrode to server to deletion -- data is protected at every stage |
| 6. Visibility and transparency | Anonymization methods are documented and auditable; users can verify what data leaves their device |
| 7. Respect for user privacy | Users retain control over their neural data; consent is granular and revocable |

### 3.6 Zero Trust Architecture -- NIST SP 800-207

Zero Trust principles applied to neural data flows:

- **Never trust, always verify.** Every component in the neural data pipeline authenticates before receiving data.
- **Least privilege access.** The security analysis service receives only the specific anonymized features it needs. It cannot request raw EEG or additional metadata.
- **Assume breach.** If any single component is compromised, the attacker obtains only anonymized feature vectors, not raw neural recordings.
- **Micro-segmentation.** Neural data processing is isolated from other device functions. A compromise of the Bluetooth stack does not grant access to the EEG pipeline.

### 3.7 Defense in Depth

Multiple independent anonymization layers ensure that failure of any single layer does not fully de-anonymize the data:

```
Layer 1: Metadata stripping         (removes direct identifiers)
Layer 2: Amplitude normalization    (removes subject-specific scaling)
Layer 3: Spectral whitening         (reduces alpha peak fingerprint)
Layer 4: Feature extraction         (discards raw time-series)
Layer 5: Differential privacy       (adds mathematical noise guarantee)
Layer 6: Encryption                 (prevents access without key)
Layer 7: Access control             (limits who can decrypt)
```

If Layer 3 fails to fully obscure the alpha peak, Layer 5 (differential privacy noise) provides a secondary defense. If Layer 5's noise budget is too generous, Layer 4 (lossy feature extraction) has already discarded the raw signal needed for high-accuracy brainprint matching.

### 3.8 Least Privilege

| Component | Data Access | Justification |
|-----------|-------------|---------------|
| Electrode driver | Raw analog signal | Hardware requirement |
| Preprocessing module | Raw digital EEG | Artifact rejection requires full signal |
| Anonymization module | Raw digital EEG + metadata | Must access data to anonymize it |
| Feature extraction module | Anonymized EEG only | Does not need metadata or raw identifiers |
| Transmission module | Encrypted feature vectors only | Cannot access plaintext features |
| Server analysis engine | Decrypted anonymized features only | Cannot access raw EEG, device metadata, or session identifiers |
| Dashboard / UI | Aggregated statistics only | Cannot access individual-level features |

---

## 4. QIF Integration

> **Status qualifier:** QIF and all components described below (NISS, TARA, NSP, Neural Firewall) are proposed, unvalidated research tools in development. They are not adopted standards, validated products, or production-ready systems.

### 4.1 Mapping to QIF's I0 Band

QIF's I0 band represents the hardware-biology boundary: the interface where silicon meets neural tissue. This is where electrodes transduce ionic currents into electrical signals, and it is the first point at which neural data exists in digital form.

Anonymization at I0 means:
- The raw analog-to-digital conversion happens on the device
- Anonymization is applied before the data crosses any network boundary
- No component downstream of I0 ever has access to identifiable raw neural signals
- The trust boundary is drawn at the device edge, not at the application layer

This aligns with the defense-in-depth principle: the earliest possible point of anonymization provides the broadest protection.

### 4.2 Neural Firewall and Anonymization Enforcement

The Neural Firewall concept in QIF operates at the I0 boundary with zero-trust principles. In the context of anonymization, the Neural Firewall enforces:

- **Egress filtering:** No data packet leaves the device without passing through the anonymization pipeline. The firewall inspects outbound data to verify that anonymization steps have been applied (checking for presence of raw channel names, unanonymized metadata fields, unprocessed amplitude ranges).
- **Rate limiting:** Restricts the volume and frequency of data transmission to prevent exfiltration of sufficient data for brainprint reconstruction.
- **Amplitude bounds:** Enforces physiologically plausible amplitude ranges, rejecting anomalous signals that could indicate injection attacks designed to force the device to transmit identifiable patterns.
- **Policy enforcement:** Anonymization policies (minimum epsilon for differential privacy, required metadata fields to strip) are defined in device configuration and enforced at the firewall level.

### 4.3 NSP Role in Encrypted Neural Data Transport

NSP specifies (not "requires" in a regulatory sense) the transport layer for neural data between device and server. In the anonymization pipeline, NSP's role includes:

- **Encrypted channel establishment:** Mutual TLS with certificate pinning between device and receiving server.
- **Feature-level transport:** NSP is designed to transport anonymized feature vectors, not raw EEG streams. The protocol format accommodates band power values, coherence metrics, and anomaly scores without provision for raw time-series data.
- **Integrity verification:** Each transmitted feature vector includes an HMAC to detect tampering during transit.
- **Session isolation:** Per-session encryption keys prevent correlation of data across sessions even if one session's key is compromised.

### 4.4 NISS Scoring Implications

NISS measures signal-level disruption (not cognitive states) corresponding to threat techniques cataloged in TARA. Anonymization intersects with NISS in two ways:

**Attacks targeting de-anonymization:**

TARA techniques that aim to de-anonymize neural data represent a distinct threat category. Examples include:

| Technique | NISS Dimension Affected | Anonymization Defense |
|-----------|------------------------|----------------------|
| Brainprint extraction via side-channel | Confidentiality | Spectral whitening + differential privacy at epsilon <= 1.0 |
| Metadata correlation across sessions | Linkability | Session-independent hashing, timestamp generalization |
| Stimulus injection to elicit identifiable P300 | Integrity + Confidentiality | Neural Firewall amplitude bounds, rate limiting on stimulus-locked epochs |
| Traffic analysis of encrypted neural data | Confidentiality | Constant-rate padding in NSP transport, fixed-size feature vectors |

**Impact of anonymization on NISS accuracy:**

Anonymization introduces noise that could mask genuine security-relevant anomalies. The privacy budget (epsilon) directly affects NISS's ability to detect subtle attacks:

- At epsilon <= 0.5, NISS may fail to detect low-amplitude signal injection attacks
- At epsilon 1.0-3.0, NISS retains sensitivity to most cataloged TARA techniques
- At epsilon >= 5.0, NISS operates at near-full sensitivity but provides weak privacy guarantees

This represents a fundamental tension between privacy and security that must be resolved per-deployment based on threat model and regulatory requirements.

---

## Sources

### Regulatory and Policy Sources

1. **GDPR Article 9** -- Processing of special categories of personal data. Regulation (EU) 2016/679. Available at: https://gdpr-info.eu/art-9-gdpr/

2. **HIPAA Privacy Rule** -- 45 CFR Parts 160, 162, and 164. U.S. Department of Health and Human Services. Standards for Privacy of Individually Identifiable Health Information.

3. **OECD Recommendation on Responsible Innovation in Neurotechnology (2019).** OECD/LEGAL/0457. Neurotechnology Toolkit (April 2024) available at: https://www.oecd.org/content/dam/oecd/en/topics/policy-sub-issues/emerging-technologies/neurotech-toolkit.pdf

4. **Chile, Ley 21.383 (2021).** Amendment to Article 19 of the Chilean Constitution on neurorights. First constitutional protection of neural data.

5. **NIST Privacy Framework, Version 1.1.** National Institute of Standards and Technology. https://www.nist.gov/privacy-framework

6. **NIST SP 800-207** -- Zero Trust Architecture. Rose, S., Borchert, O., Mitchell, S., & Connelly, S. (2020). National Institute of Standards and Technology.

7. **European Data Protection Supervisor (2024).** TechDispatch #1/2024 - Neurodata. https://www.edps.europa.eu/data-protection/our-work/publications/techdispatch/2024-06-03-techdispatch-12024-neurodata_en

8. **U.S. Government Accountability Office (2025).** Brain-Computer Interfaces: Applications, Challenges, and Policy Options. GAO-25-106952. https://www.gao.gov/products/gao-25-106952

9. **IEEE Neurotechnologies for Brain-Machine Interfacing Standards Roadmap (2020).** https://standards.ieee.org/wp-content/uploads/import/documents/presentations/ieee-neurotech-for-bmi-standards-roadmap.pdf

### Academic Sources

10. **Campisi, P. & La Rocca, D. (2014).** Brain waves for automatic biometric-based user recognition. *IEEE Transactions on Information Forensics and Security*, 9, 782-800.

11. **Marcel, S. & Millan, J.R. (2007).** Person authentication using brainwaves (EEG) and maximum a posteriori model adaptation. *IEEE Transactions on Pattern Analysis and Machine Intelligence*, 29(4), 743-748.

12. **Ienca, M. & Andorno, R. (2017).** Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13(1), Article 5. https://pubmed.ncbi.nlm.nih.gov/28444626/

13. **Yuste, R., Goering, S., Arcas, B.A.Y., et al. (2017).** Four ethical priorities for neurotechnologies and AI. *Nature*, 551, 159-163. https://www.nature.com/articles/551159a

14. **Cavoukian, A. (2011).** Privacy by Design: The 7 Foundational Principles. Information and Privacy Commissioner of Ontario, Canada.

15. **La Rocca, D., Campisi, P., Vegso, B., et al. (2014).** Human brain distinctiveness based on EEG spectral coherence connectivity. *IEEE Transactions on Biomedical Engineering*, 61(9), 2406-2412. https://pubmed.ncbi.nlm.nih.gov/24759981/

### Standards and Technical References

16. **IEEE P2731 Working Group** -- Standard for a Unified Terminology for Brain-Computer Interfaces.

17. **IEEE P2933 Working Group** -- TIPPSS (Trust, Identity, Privacy, Protection, Safety, and Security) for Clinical IoT.

18. **NIST SP 800-38D** -- Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC.

19. **IETF RFC 8446** -- The Transport Layer Security (TLS) Protocol Version 1.3.

20. **FIPS 198-1** -- The Keyed-Hash Message Authentication Code (HMAC).

### Neurorights and Governance

21. **NeuroRights Foundation.** Columbia University. Consumer neurotechnology privacy audit (2024). https://magazine.columbia.edu/article/need-protect-data-our-brains

22. **Global Privacy Assembly (2024).** Resolution on Neurotechnologies. 46th Closed Session, November 2024.

23. **Ienca, M. & Haselager, P. (2016).** Hacking the brain: brain-computer interfacing technology and the ethics of neurosecurity. *Ethics and Information Technology*, 18(2), 117-129. [Verification pending -- cited in secondary sources but not independently verified in this session]

### Sources on Differential Privacy for EEG

24. **EEG Data Privacy Enhancement using Differential Privacy in WGAN-based Federated Learning (2024).** ResearchGate. https://www.researchgate.net/publication/377333161

25. **Bridging Privacy and Utility: Synthesizing anonymized EEG with constraining utility functions (2025).** arXiv:2509.20454. https://arxiv.org/abs/2509.20454

---

*Document version: 1.0*
*Last updated: 2026-03-13*
*Project: Qinnovate / Neurosim*
