#!/usr/bin/env python3
"""
Generate synthetic EEG datasets for Open Neural Atlas.

These are SYNTHETIC datasets generated to mimic known EEG patterns.
They are NOT real brain recordings. They are suitable for testing,
development, and learning purposes only.

Signal generation is based on published neuroscience paradigms:
- Alpha rhythm suppression (Berger 1929; Pfurtscheller & Lopes da Silva 1999)
- Event-related desynchronization (Pfurtscheller & Aranibar 1979)
- P300 ERP (Sutton et al. 1965; Farwell & Donchin 1988)
- SSVEP (Regan 1989; Vialatte et al. 2010)
- Sleep spindles and K-complexes (De Gennaro & Ferrara 2003)
- Epileptiform discharges (Niedermeyer & Lopes da Silva 2005)

Usage:
    python3 generate_sample_data.py

All CSVs and manifest.json are written to the same directory as this script.
"""

import json
import os
import time
from datetime import datetime, timezone

import numpy as np

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SAMPLE_RATE = 250  # Hz
CHANNELS = [
    "Fp1", "Fp2", "F3", "F4", "C3", "C4", "P3", "P4",
    "O1", "O2", "F7", "F8", "T3", "T4", "Pz", "Oz",
]
NUM_CHANNELS = len(CHANNELS)
RNG = np.random.default_rng(seed=42)

# Channel indices for quick lookup
CH = {name: idx for idx, name in enumerate(CHANNELS)}

# Spatial correlation matrix (simplified 10-20 adjacency)
# Nearby electrodes share more variance.
_ADJACENCY = {
    "Fp1": ["Fp2", "F3", "F7"],
    "Fp2": ["Fp1", "F4", "F8"],
    "F3": ["Fp1", "F7", "C3", "F4"],
    "F4": ["Fp2", "F8", "C4", "F3"],
    "C3": ["F3", "P3", "T3", "C4"],
    "C4": ["F4", "P4", "T4", "C3"],
    "P3": ["C3", "Pz", "O1"],
    "P4": ["C4", "Pz", "O2"],
    "O1": ["P3", "Oz", "O2"],
    "O2": ["P4", "Oz", "O1"],
    "F7": ["Fp1", "F3", "T3"],
    "F8": ["Fp2", "F4", "T4"],
    "T3": ["F7", "C3"],
    "T4": ["F8", "C4"],
    "Pz": ["P3", "P4", "Oz"],
    "Oz": ["O1", "O2", "Pz"],
}


def _build_correlation_matrix(rho_adjacent: float = 0.4) -> np.ndarray:
    """Build a positive-definite correlation matrix from adjacency."""
    C = np.eye(NUM_CHANNELS)
    for ch, neighbors in _ADJACENCY.items():
        i = CH[ch]
        for nb in neighbors:
            j = CH[nb]
            C[i, j] = rho_adjacent
            C[j, i] = rho_adjacent
    # Ensure positive-definite via eigenvalue floor
    eigvals, eigvecs = np.linalg.eigh(C)
    eigvals = np.maximum(eigvals, 0.05)
    C = eigvecs @ np.diag(eigvals) @ eigvecs.T
    # Re-normalise to unit diagonal
    d = np.sqrt(np.diag(C))
    C = C / np.outer(d, d)
    return C


CORR_MATRIX = _build_correlation_matrix()
CHOL = np.linalg.cholesky(CORR_MATRIX)

# ---------------------------------------------------------------------------
# Region-based amplitude scaling (approximate 10-20 topography)
# ---------------------------------------------------------------------------

# Relative amplitude weights per frequency band per channel region.
# Keys: "frontal", "central", "parietal", "occipital", "temporal"
_REGION = {
    "Fp1": "frontal", "Fp2": "frontal",
    "F3": "frontal", "F4": "frontal",
    "F7": "frontal", "F8": "frontal",
    "C3": "central", "C4": "central",
    "T3": "temporal", "T4": "temporal",
    "P3": "parietal", "P4": "parietal", "Pz": "parietal",
    "O1": "occipital", "O2": "occipital", "Oz": "occipital",
}

# Band amplitude weights by region (scale factors, not absolute uV)
_BAND_REGION_WEIGHT = {
    #            delta  theta  alpha  beta   gamma
    "frontal":  [1.0,   1.0,   0.7,   1.2,   1.0],
    "central":  [0.9,   0.9,   0.9,   1.0,   0.9],
    "parietal": [0.8,   0.8,   1.1,   0.8,   0.7],
    "occipital":[0.7,   0.7,   1.5,   0.6,   0.6],
    "temporal": [0.9,   1.0,   0.8,   0.9,   0.8],
}


def _region_weights() -> np.ndarray:
    """Return (num_channels, 5) array of band weights."""
    w = np.zeros((NUM_CHANNELS, 5))
    for ch_name, region in _REGION.items():
        w[CH[ch_name]] = _BAND_REGION_WEIGHT[region]
    return w


REGION_WEIGHTS = _region_weights()  # shape (16, 5)

# ---------------------------------------------------------------------------
# Pink (1/f) noise generator
# ---------------------------------------------------------------------------


def pink_noise(n_samples: int, n_channels: int) -> np.ndarray:
    """Generate 1/f noise via spectral shaping."""
    # Work in frequency domain
    n_fft = n_samples
    white = RNG.standard_normal((n_channels, n_fft))
    spectrum = np.fft.rfft(white, axis=1)
    freqs = np.fft.rfftfreq(n_fft, d=1.0 / SAMPLE_RATE)
    freqs[0] = 1.0  # avoid division by zero
    # 1/f amplitude scaling
    scaling = 1.0 / np.sqrt(freqs)
    spectrum *= scaling[np.newaxis, :]
    pink = np.fft.irfft(spectrum, n=n_fft, axis=1)
    return pink


# ---------------------------------------------------------------------------
# Core signal builder
# ---------------------------------------------------------------------------


def generate_eeg(
    duration_s: float,
    band_amplitudes: dict,
    modulations: dict | None = None,
    pink_amplitude: float = 3.0,
    white_amplitude: float = 1.0,
) -> np.ndarray:
    """
    Generate multichannel EEG.

    Parameters
    ----------
    duration_s : float
        Length in seconds.
    band_amplitudes : dict
        Keys: "delta", "theta", "alpha", "beta", "gamma".
        Values: base amplitude in uV for that band.
    modulations : dict or None
        Per-channel, per-band amplitude overrides.
        Example: {"C4": {"alpha": 0.3}} means C4 alpha is scaled to 0.3x.
    pink_amplitude : float
        Amplitude of 1/f background noise in uV.
    white_amplitude : float
        Amplitude of white noise in uV.

    Returns
    -------
    data : np.ndarray, shape (n_samples, num_channels)
        EEG in microvolts.
    """
    n_samples = int(duration_s * SAMPLE_RATE)
    t = np.arange(n_samples) / SAMPLE_RATE

    # Band definitions: (name, low_hz, high_hz, n_components)
    bands = [
        ("delta", 1, 4, 3),
        ("theta", 4, 8, 4),
        ("alpha", 8, 13, 5),
        ("beta", 13, 30, 6),
        ("gamma", 30, 50, 5),
    ]
    band_idx_map = {"delta": 0, "theta": 1, "alpha": 2, "beta": 3, "gamma": 4}

    # Generate per-band sinusoidal components (shared phase base, then spatially mixed)
    signal = np.zeros((NUM_CHANNELS, n_samples))

    for band_name, f_low, f_high, n_comp in bands:
        base_amp = band_amplitudes.get(band_name, 0.0)
        if base_amp == 0.0:
            continue
        b_idx = band_idx_map[band_name]
        freqs = RNG.uniform(f_low, f_high, size=n_comp)
        phases = RNG.uniform(0, 2 * np.pi, size=n_comp)
        # Build a "source" signal (sum of sinusoids)
        source = np.zeros(n_samples)
        for f, ph in zip(freqs, phases):
            source += np.sin(2 * np.pi * f * t + ph)
        source /= n_comp  # normalise

        for ch_i in range(NUM_CHANNELS):
            ch_name = CHANNELS[ch_i]
            region_w = REGION_WEIGHTS[ch_i, b_idx]
            mod_scale = 1.0
            if modulations and ch_name in modulations:
                if band_name in modulations[ch_name]:
                    mod_scale = modulations[ch_name][band_name]
            amp = base_amp * region_w * mod_scale
            # Add slight per-channel phase jitter for realism
            jitter = RNG.uniform(-0.1, 0.1)
            signal[ch_i] += amp * np.roll(source, int(jitter * SAMPLE_RATE))

    # Add spatially correlated pink noise
    pnoise = pink_noise(n_samples, NUM_CHANNELS) * pink_amplitude
    correlated_noise = CHOL @ pnoise

    # Add white noise
    wnoise = RNG.standard_normal((NUM_CHANNELS, n_samples)) * white_amplitude

    data = signal + correlated_noise + wnoise
    return data.T  # shape (n_samples, num_channels)


# ---------------------------------------------------------------------------
# Dataset generators
# ---------------------------------------------------------------------------


def make_timestamps(n_samples: int) -> np.ndarray:
    """Generate UNIX timestamps at SAMPLE_RATE starting from a fixed epoch."""
    t0 = 1741737600.0  # 2025-03-12 00:00:00 UTC (fixed for reproducibility)
    return t0 + np.arange(n_samples) / SAMPLE_RATE


def save_csv(filepath: str, data: np.ndarray, markers: np.ndarray | None = None):
    """Save EEG data to CSV with standard columns."""
    n_samples = data.shape[0]
    timestamps = make_timestamps(n_samples)
    package_nums = np.arange(n_samples)
    if markers is None:
        markers = np.zeros(n_samples)

    header = "timestamp,package_num," + ",".join(CHANNELS) + ",marker"
    rows = np.column_stack([
        timestamps,
        package_nums,
        data,
        markers,
    ])
    np.savetxt(
        filepath,
        rows,
        delimiter=",",
        header=header,
        comments="",
        fmt=["%.6f", "%d"] + ["%.4f"] * NUM_CHANNELS + ["%.1f"],
    )
    print(f"  Saved {filepath} ({n_samples} samples, {n_samples / SAMPLE_RATE:.0f}s)")


def gen_resting_eyes_closed(out_dir: str):
    """Alpha-dominant resting state, eyes closed."""
    data = generate_eeg(
        duration_s=60,
        band_amplitudes={
            "delta": 15.0,
            "theta": 8.0,
            "alpha": 35.0,  # dominant
            "beta": 5.0,
            "gamma": 2.0,
        },
        pink_amplitude=4.0,
    )
    save_csv(os.path.join(out_dir, "resting_eyes_closed.csv"), data)


def gen_resting_eyes_open(out_dir: str):
    """Beta-dominant, alpha suppressed, eyes open."""
    data = generate_eeg(
        duration_s=60,
        band_amplitudes={
            "delta": 12.0,
            "theta": 6.0,
            "alpha": 8.0,   # suppressed
            "beta": 20.0,   # dominant
            "gamma": 5.0,
        },
        pink_amplitude=4.0,
    )
    save_csv(os.path.join(out_dir, "resting_eyes_open.csv"), data)


def gen_motor_imagery_left(out_dir: str):
    """Left hand motor imagery: ERD at C4 (right motor cortex), mu suppression."""
    data = generate_eeg(
        duration_s=30,
        band_amplitudes={
            "delta": 10.0,
            "theta": 6.0,
            "alpha": 25.0,
            "beta": 12.0,
            "gamma": 3.0,
        },
        modulations={
            "C4": {"alpha": 0.25, "beta": 0.5},  # ERD: mu and beta suppression
            "C3": {"alpha": 1.3, "beta": 1.2},    # slight ERS contralateral
        },
        pink_amplitude=3.5,
    )
    # Add event markers: cue at t=2s, imagery 3-8s (repeated every 10s)
    n_samples = data.shape[0]
    markers = np.zeros(n_samples)
    for onset in range(2 * SAMPLE_RATE, n_samples, 10 * SAMPLE_RATE):
        if onset < n_samples:
            markers[onset] = 1.0  # cue
        rest_onset = onset + 6 * SAMPLE_RATE
        if rest_onset < n_samples:
            markers[rest_onset] = 2.0  # rest
    save_csv(os.path.join(out_dir, "motor_imagery_left.csv"), data, markers)


def gen_motor_imagery_right(out_dir: str):
    """Right hand motor imagery: ERD at C3 (left motor cortex), mu suppression."""
    data = generate_eeg(
        duration_s=30,
        band_amplitudes={
            "delta": 10.0,
            "theta": 6.0,
            "alpha": 25.0,
            "beta": 12.0,
            "gamma": 3.0,
        },
        modulations={
            "C3": {"alpha": 0.25, "beta": 0.5},  # ERD
            "C4": {"alpha": 1.3, "beta": 1.2},    # ERS
        },
        pink_amplitude=3.5,
    )
    n_samples = data.shape[0]
    markers = np.zeros(n_samples)
    for onset in range(2 * SAMPLE_RATE, n_samples, 10 * SAMPLE_RATE):
        if onset < n_samples:
            markers[onset] = 1.0
        rest_onset = onset + 6 * SAMPLE_RATE
        if rest_onset < n_samples:
            markers[rest_onset] = 2.0
    save_csv(os.path.join(out_dir, "motor_imagery_right.csv"), data, markers)


def gen_p300_oddball(out_dir: str):
    """P300 oddball paradigm with target (marker=2) and non-target (marker=1) stimuli."""
    duration_s = 120
    n_samples = int(duration_s * SAMPLE_RATE)

    # Background EEG
    data = generate_eeg(
        duration_s=duration_s,
        band_amplitudes={
            "delta": 10.0,
            "theta": 7.0,
            "alpha": 15.0,
            "beta": 10.0,
            "gamma": 3.0,
        },
        pink_amplitude=3.0,
    )

    markers = np.zeros(n_samples)
    t = np.arange(n_samples) / SAMPLE_RATE

    # Stimuli every 1.5s (ISI), 20% targets, 80% non-targets
    stim_interval = int(1.5 * SAMPLE_RATE)
    for onset in range(SAMPLE_RATE, n_samples - SAMPLE_RATE, stim_interval):
        is_target = RNG.random() < 0.20
        markers[onset] = 2.0 if is_target else 1.0

        if is_target:
            # Inject P300 component: positive deflection at ~300ms post-stimulus
            # P300 is maximal at Pz, with spread to P3, P4, Cz-adjacent
            p300_latency = int(0.300 * SAMPLE_RATE)  # 300ms
            p300_duration = int(0.200 * SAMPLE_RATE)  # 200ms wide
            p300_start = onset + p300_latency - p300_duration // 2
            p300_end = p300_start + p300_duration

            if p300_end < n_samples:
                p300_window = np.arange(p300_duration)
                # Gaussian-shaped P300
                p300_wave = 12.0 * np.exp(
                    -0.5 * ((p300_window - p300_duration / 2) / (p300_duration / 4)) ** 2
                )
                # Channel weights for P300 topography
                p300_topo = {
                    "Pz": 1.0, "P3": 0.7, "P4": 0.7,
                    "C3": 0.4, "C4": 0.4,
                    "Oz": 0.3, "O1": 0.2, "O2": 0.2,
                    "F3": 0.15, "F4": 0.15,
                }
                for ch_name, weight in p300_topo.items():
                    data[p300_start:p300_end, CH[ch_name]] += p300_wave * weight

    save_csv(os.path.join(out_dir, "p300_oddball.csv"), data, markers)


def gen_ssvep_12hz(out_dir: str):
    """SSVEP at 12Hz in occipital channels."""
    duration_s = 30
    n_samples = int(duration_s * SAMPLE_RATE)

    # Background EEG
    data = generate_eeg(
        duration_s=duration_s,
        band_amplitudes={
            "delta": 8.0,
            "theta": 5.0,
            "alpha": 10.0,
            "beta": 8.0,
            "gamma": 2.0,
        },
        pink_amplitude=3.0,
    )

    t = np.arange(n_samples) / SAMPLE_RATE

    # SSVEP: strong 12Hz + harmonics (24Hz, 36Hz) in occipital channels
    ssvep_channels = {"Oz": 1.0, "O1": 0.8, "O2": 0.8, "Pz": 0.3, "P3": 0.15, "P4": 0.15}
    for ch_name, weight in ssvep_channels.items():
        fundamental = 15.0 * weight * np.sin(2 * np.pi * 12 * t)
        harmonic2 = 6.0 * weight * np.sin(2 * np.pi * 24 * t)
        harmonic3 = 3.0 * weight * np.sin(2 * np.pi * 36 * t)
        data[:, CH[ch_name]] += fundamental + harmonic2 + harmonic3

    # Markers: stimulus on at t=2s, off at t=28s
    markers = np.zeros(n_samples)
    markers[2 * SAMPLE_RATE] = 1.0   # stim on
    markers[28 * SAMPLE_RATE] = 2.0  # stim off

    save_csv(os.path.join(out_dir, "ssvep_12hz.csv"), data, markers)


def gen_sleep_n2(out_dir: str):
    """Sleep stage N2: sleep spindles (12-14Hz bursts) and K-complexes."""
    duration_s = 60
    n_samples = int(duration_s * SAMPLE_RATE)

    # Background: strong delta/theta, reduced alpha/beta
    data = generate_eeg(
        duration_s=duration_s,
        band_amplitudes={
            "delta": 30.0,  # strong slow waves
            "theta": 12.0,
            "alpha": 4.0,   # suppressed
            "beta": 3.0,    # suppressed
            "gamma": 1.0,
        },
        pink_amplitude=5.0,
    )

    t = np.arange(n_samples) / SAMPLE_RATE

    # Sleep spindles: ~0.5-1.5s bursts of 12-14Hz, occurring every 3-8s
    spindle_times = []
    current = 3.0
    while current < duration_s - 2.0:
        spindle_times.append(current)
        current += RNG.uniform(3.0, 8.0)

    for sp_t in spindle_times:
        sp_dur = RNG.uniform(0.5, 1.5)
        sp_freq = RNG.uniform(12.0, 14.0)
        sp_start = int(sp_t * SAMPLE_RATE)
        sp_end = min(int((sp_t + sp_dur) * SAMPLE_RATE), n_samples)
        sp_len = sp_end - sp_start
        if sp_len <= 0:
            continue

        sp_t_local = np.arange(sp_len) / SAMPLE_RATE
        # Spindle envelope: Gaussian
        envelope = np.exp(-0.5 * ((sp_t_local - sp_dur / 2) / (sp_dur / 4)) ** 2)
        spindle_wave = 20.0 * envelope * np.sin(2 * np.pi * sp_freq * sp_t_local)

        # Spindles are maximal at central and parietal sites
        spindle_topo = {"C3": 1.0, "C4": 1.0, "Pz": 0.9, "P3": 0.8, "P4": 0.8,
                        "F3": 0.5, "F4": 0.5, "Oz": 0.3}
        for ch_name, w in spindle_topo.items():
            data[sp_start:sp_end, CH[ch_name]] += spindle_wave * w

    # K-complexes: large biphasic waves, ~every 10-20s
    kc_times = []
    current = 5.0
    while current < duration_s - 1.0:
        kc_times.append(current)
        current += RNG.uniform(10.0, 20.0)

    for kc_t in kc_times:
        kc_start = int(kc_t * SAMPLE_RATE)
        kc_dur = int(0.8 * SAMPLE_RATE)  # ~800ms
        kc_end = min(kc_start + kc_dur, n_samples)
        kc_len = kc_end - kc_start
        if kc_len <= 0:
            continue

        kc_t_local = np.arange(kc_len) / SAMPLE_RATE
        # Biphasic: negative then positive
        kc_wave = -60.0 * np.sin(np.pi * kc_t_local / 0.8)

        # K-complexes are widespread, maximal at vertex (Cz ~ average of C3/C4)
        kc_topo = {"C3": 1.0, "C4": 1.0, "F3": 0.8, "F4": 0.8, "Pz": 0.7,
                   "P3": 0.6, "P4": 0.6, "Fp1": 0.4, "Fp2": 0.4}
        for ch_name, w in kc_topo.items():
            data[kc_start:kc_end, CH[ch_name]] += kc_wave[:kc_len] * w

    save_csv(os.path.join(out_dir, "sleep_stage_n2.csv"), data)


def gen_artifact_eye_blink(out_dir: str):
    """Clean EEG with periodic eye blink artifacts at Fp1/Fp2."""
    duration_s = 30
    n_samples = int(duration_s * SAMPLE_RATE)

    # Clean background EEG
    data = generate_eeg(
        duration_s=duration_s,
        band_amplitudes={
            "delta": 10.0,
            "theta": 6.0,
            "alpha": 20.0,
            "beta": 10.0,
            "gamma": 3.0,
        },
        pink_amplitude=3.0,
    )

    # Eye blinks: large positive deflections at Fp1/Fp2, every 3-6 seconds
    blink_times = []
    current = 1.5
    while current < duration_s - 0.5:
        blink_times.append(current)
        current += RNG.uniform(3.0, 6.0)

    markers = np.zeros(n_samples)

    for bl_t in blink_times:
        bl_start = int(bl_t * SAMPLE_RATE)
        bl_dur = int(0.4 * SAMPLE_RATE)  # ~400ms blink
        bl_end = min(bl_start + bl_dur, n_samples)
        bl_len = bl_end - bl_start
        if bl_len <= 0:
            continue

        bl_t_local = np.arange(bl_len) / SAMPLE_RATE
        # Blink waveform: positive Gaussian
        blink_amp = RNG.uniform(100.0, 200.0)
        blink_wave = blink_amp * np.exp(
            -0.5 * ((bl_t_local - 0.2) / 0.08) ** 2
        )

        # Topography: maximal at Fp1/Fp2, decays with distance
        blink_topo = {
            "Fp1": 1.0, "Fp2": 1.0,
            "F3": 0.4, "F4": 0.4, "F7": 0.5, "F8": 0.5,
            "C3": 0.1, "C4": 0.1,
        }
        for ch_name, w in blink_topo.items():
            data[bl_start:bl_end, CH[ch_name]] += blink_wave * w

        markers[bl_start] = 99.0  # blink marker

    save_csv(os.path.join(out_dir, "artifact_eye_blink.csv"), data, markers)


def gen_seizure_simulation(out_dir: str):
    """Simulated epileptiform activity with rhythmic discharges."""
    duration_s = 30
    n_samples = int(duration_s * SAMPLE_RATE)

    # Pre-ictal: relatively normal EEG for first 5 seconds
    data = generate_eeg(
        duration_s=duration_s,
        band_amplitudes={
            "delta": 12.0,
            "theta": 8.0,
            "alpha": 15.0,
            "beta": 8.0,
            "gamma": 3.0,
        },
        pink_amplitude=3.0,
    )

    t = np.arange(n_samples) / SAMPLE_RATE
    markers = np.zeros(n_samples)

    # Ictal phase: 5-25s — rhythmic discharges that evolve in frequency
    ictal_start = 5 * SAMPLE_RATE
    ictal_end = 25 * SAMPLE_RATE
    markers[ictal_start] = 1.0   # seizure onset
    markers[ictal_end] = 2.0     # seizure end

    for s in range(ictal_start, ictal_end):
        # Frequency evolves: starts ~10Hz, slows to ~3Hz
        progress = (s - ictal_start) / (ictal_end - ictal_start)
        freq = 10.0 - 7.0 * progress  # 10Hz -> 3Hz
        # Amplitude increases then decreases
        amp_envelope = 80.0 * np.sin(np.pi * progress)  # peaks mid-seizure
        phase = 2 * np.pi * freq * t[s]

        # Widespread but starts focal (left temporal) then generalizes
        if progress < 0.3:
            # Focal: left temporal/frontal
            topo = {"T3": 1.0, "F7": 0.8, "C3": 0.5, "Fp1": 0.4, "F3": 0.6}
        elif progress < 0.6:
            # Spreading
            topo = {ch: 0.6 + 0.4 * RNG.random() for ch in CHANNELS}
            topo["T3"] = 1.0
            topo["T4"] = 0.8
        else:
            # Generalized
            topo = {ch: 0.7 + 0.3 * RNG.random() for ch in CHANNELS}

        for ch_name, w in topo.items():
            data[s, CH[ch_name]] += amp_envelope * w * np.sin(phase)

    # Post-ictal suppression: 25-30s — reduced amplitude
    post_ictal_start = 25 * SAMPLE_RATE
    for s in range(post_ictal_start, n_samples):
        progress = (s - post_ictal_start) / (n_samples - post_ictal_start)
        suppression = 0.2 + 0.8 * progress  # gradually recovers
        data[s, :] *= suppression

    save_csv(os.path.join(out_dir, "seizure_simulation.csv"), data, markers)


def gen_meditation_theta(out_dir: str):
    """Meditation state: enhanced theta, intermittent alpha, reduced beta."""
    data = generate_eeg(
        duration_s=60,
        band_amplitudes={
            "delta": 12.0,
            "theta": 30.0,   # enhanced
            "alpha": 18.0,   # intermittent (modulated below)
            "beta": 4.0,     # reduced
            "gamma": 1.5,
        },
        pink_amplitude=3.5,
    )

    n_samples = data.shape[0]
    t = np.arange(n_samples) / SAMPLE_RATE

    # Alpha comes and goes in slow ~0.1Hz modulation
    alpha_mod = 0.5 + 0.5 * np.sin(2 * np.pi * 0.1 * t)
    # Apply modulation to all channels' alpha-range content
    # (approximate: modulate the existing signal in alpha range)
    # Instead, add a modulated alpha component
    for ch_i in range(NUM_CHANNELS):
        alpha_freq = RNG.uniform(9.0, 11.0)
        data[:, ch_i] += 10.0 * alpha_mod * np.sin(
            2 * np.pi * alpha_freq * t + RNG.uniform(0, 2 * np.pi)
        ) * REGION_WEIGHTS[ch_i, 2]  # alpha band index = 2

    # Frontal midline theta enhancement (Fm theta)
    fm_theta_channels = {"F3": 0.8, "F4": 0.8, "Fp1": 0.5, "Fp2": 0.5}
    for ch_name, w in fm_theta_channels.items():
        theta_freq = RNG.uniform(5.0, 7.0)
        data[:, CH[ch_name]] += 12.0 * w * np.sin(
            2 * np.pi * theta_freq * t + RNG.uniform(0, 2 * np.pi)
        )

    save_csv(os.path.join(out_dir, "meditation_theta.csv"), data)


# ---------------------------------------------------------------------------
# Manifest
# ---------------------------------------------------------------------------

MANIFEST = {
    "version": "1.0",
    "generated": "2026-03-12",
    "sample_rate": 250,
    "channels": 16,
    "channel_names": CHANNELS,
    "datasets": [
        {
            "file": "resting_eyes_closed.csv",
            "name": "Resting State -- Eyes Closed",
            "description": "Alpha-dominant resting EEG with eyes closed",
            "duration_seconds": 60,
            "paradigm": "resting",
            "dominant_band": "alpha",
            "clinical_relevance": "Baseline resting state, used for alpha rhythm assessment",
            "markers": False,
        },
        {
            "file": "resting_eyes_open.csv",
            "name": "Resting State -- Eyes Open",
            "description": "Beta-dominant EEG with alpha suppression during eyes-open resting",
            "duration_seconds": 60,
            "paradigm": "resting",
            "dominant_band": "beta",
            "clinical_relevance": "Comparison condition for alpha reactivity testing",
            "markers": False,
        },
        {
            "file": "motor_imagery_left.csv",
            "name": "Motor Imagery -- Left Hand",
            "description": "Event-related desynchronization in right motor cortex (C4) during left hand imagery",
            "duration_seconds": 30,
            "paradigm": "motor_imagery",
            "dominant_band": "mu/alpha",
            "clinical_relevance": "BCI control paradigm, motor rehabilitation assessment",
            "markers": True,
            "marker_codes": {"1": "cue_onset", "2": "rest_onset"},
        },
        {
            "file": "motor_imagery_right.csv",
            "name": "Motor Imagery -- Right Hand",
            "description": "Event-related desynchronization in left motor cortex (C3) during right hand imagery",
            "duration_seconds": 30,
            "paradigm": "motor_imagery",
            "dominant_band": "mu/alpha",
            "clinical_relevance": "BCI control paradigm, motor rehabilitation assessment",
            "markers": True,
            "marker_codes": {"1": "cue_onset", "2": "rest_onset"},
        },
        {
            "file": "p300_oddball.csv",
            "name": "P300 Oddball Paradigm",
            "description": "P300 event-related potential with target (20%) and non-target (80%) stimuli",
            "duration_seconds": 120,
            "paradigm": "erp",
            "dominant_band": "broadband",
            "clinical_relevance": "Cognitive assessment, P300-based BCI speller, attention evaluation",
            "markers": True,
            "marker_codes": {"1": "non_target", "2": "target"},
        },
        {
            "file": "ssvep_12hz.csv",
            "name": "SSVEP at 12Hz",
            "description": "Steady-state visually evoked potential at 12Hz in occipital channels",
            "duration_seconds": 30,
            "paradigm": "ssvep",
            "dominant_band": "12Hz + harmonics",
            "clinical_relevance": "SSVEP-based BCI paradigm, visual pathway assessment",
            "markers": True,
            "marker_codes": {"1": "stimulus_on", "2": "stimulus_off"},
        },
        {
            "file": "sleep_stage_n2.csv",
            "name": "Sleep Stage N2",
            "description": "NREM stage 2 sleep with sleep spindles (12-14Hz) and K-complexes",
            "duration_seconds": 60,
            "paradigm": "sleep",
            "dominant_band": "delta/sigma",
            "clinical_relevance": "Sleep staging, sleep disorder assessment, memory consolidation research",
            "markers": False,
        },
        {
            "file": "artifact_eye_blink.csv",
            "name": "Eye Blink Artifacts",
            "description": "Clean EEG with periodic eye blink artifacts at frontal channels (Fp1, Fp2)",
            "duration_seconds": 30,
            "paradigm": "artifact",
            "dominant_band": "alpha",
            "clinical_relevance": "Artifact rejection algorithm testing and validation",
            "markers": True,
            "marker_codes": {"99": "eye_blink"},
        },
        {
            "file": "seizure_simulation.csv",
            "name": "Seizure Simulation",
            "description": "Simulated focal-to-generalized epileptiform activity with evolving rhythmic discharges",
            "duration_seconds": 30,
            "paradigm": "epilepsy",
            "dominant_band": "evolving (10Hz to 3Hz)",
            "clinical_relevance": "Seizure detection algorithm testing, epilepsy monitoring development",
            "markers": True,
            "marker_codes": {"1": "seizure_onset", "2": "seizure_end"},
        },
        {
            "file": "meditation_theta.csv",
            "name": "Meditation -- Theta Enhancement",
            "description": "Enhanced frontal midline theta with intermittent alpha and reduced beta during meditation",
            "duration_seconds": 60,
            "paradigm": "meditation",
            "dominant_band": "theta",
            "clinical_relevance": "Neurofeedback training, mindfulness research, attention studies",
            "markers": False,
        },
    ],
}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"Generating synthetic EEG datasets in: {out_dir}\n")

    generators = [
        ("Resting Eyes Closed", gen_resting_eyes_closed),
        ("Resting Eyes Open", gen_resting_eyes_open),
        ("Motor Imagery Left", gen_motor_imagery_left),
        ("Motor Imagery Right", gen_motor_imagery_right),
        ("P300 Oddball", gen_p300_oddball),
        ("SSVEP 12Hz", gen_ssvep_12hz),
        ("Sleep Stage N2", gen_sleep_n2),
        ("Eye Blink Artifacts", gen_artifact_eye_blink),
        ("Seizure Simulation", gen_seizure_simulation),
        ("Meditation Theta", gen_meditation_theta),
    ]

    for name, gen_fn in generators:
        print(f"[{name}]")
        gen_fn(out_dir)

    # Write manifest
    manifest_path = os.path.join(out_dir, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(MANIFEST, f, indent=2)
    print(f"\n  Saved {manifest_path}")

    print(f"\nDone. Generated {len(generators)} datasets + manifest.json")


if __name__ == "__main__":
    main()
