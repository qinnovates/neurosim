"""Signal processing: FFT band decomposition and amplitude analysis."""

import logging

import numpy as np
from scipy.signal import welch

logger = logging.getLogger(__name__)

# Standard EEG frequency bands (Hz)
BANDS = {
    "delta": (0.5, 4.0),
    "theta": (4.0, 8.0),
    "alpha": (8.0, 13.0),
    "beta": (13.0, 30.0),
    "gamma": (30.0, 100.0),
}

BAND_NAMES = list(BANDS.keys())


def compute_band_powers(
    eeg_data: np.ndarray,
    sample_rate: int,
    nfft: int = 256,
) -> dict[str, list[float]]:
    """Compute power in each frequency band for each channel using Welch's method.

    Args:
        eeg_data: shape (channels, samples)
        sample_rate: sampling rate in Hz
        nfft: FFT window size

    Returns:
        Dict mapping band name to list of power values per channel.
    """
    num_channels = eeg_data.shape[0]
    num_samples = eeg_data.shape[1]
    result: dict[str, list[float]] = {band: [] for band in BAND_NAMES}

    # Need enough samples for meaningful FFT
    nperseg = min(nfft, num_samples)
    if nperseg < 32:
        for ch in range(num_channels):
            for band in BAND_NAMES:
                result[band].append(0.0)
        return result

    for ch in range(num_channels):
        try:
            freqs, psd = welch(eeg_data[ch], fs=sample_rate, nperseg=nperseg)

            for band_name, (low, high) in BANDS.items():
                mask = (freqs >= low) & (freqs <= high)
                if mask.any():
                    # Integrate PSD over band using trapezoidal rule
                    power = float(np.trapz(psd[mask], freqs[mask]))
                    result[band_name].append(power)
                else:
                    result[band_name].append(0.0)
        except Exception as e:
            logger.warning("FFT failed on channel %d: %s", ch, e)
            for band in BAND_NAMES:
                result[band].append(0.0)

    return result


def compute_amplitude_stats(eeg_data: np.ndarray) -> dict:
    """Compute per-channel amplitude statistics.

    Args:
        eeg_data: shape (channels, samples)

    Returns:
        Dict with per-channel min, max, mean, std.
    """
    return {
        "min": eeg_data.min(axis=1).tolist(),
        "max": eeg_data.max(axis=1).tolist(),
        "mean": eeg_data.mean(axis=1).tolist(),
        "std": eeg_data.std(axis=1).tolist(),
    }
