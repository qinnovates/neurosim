"""Signal processing: FFT band decomposition and amplitude analysis."""

import numpy as np
from brainflow.data_filter import DataFilter, FilterTypes, WindowOperations


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
    """Compute power in each frequency band for each channel.

    Args:
        eeg_data: shape (channels, samples)
        sample_rate: sampling rate in Hz
        nfft: FFT window size

    Returns:
        Dict mapping band name to list of power values per channel.
    """
    num_channels = eeg_data.shape[0]
    result: dict[str, list[float]] = {band: [] for band in BAND_NAMES}

    for ch in range(num_channels):
        channel_data = eeg_data[ch].copy()

        # Need enough samples for FFT
        if len(channel_data) < nfft:
            for band in BAND_NAMES:
                result[band].append(0.0)
            continue

        for band_name, (low, high) in BANDS.items():
            try:
                power = DataFilter.get_band_power(
                    DataFilter.perform_fft(channel_data, WindowOperations.HANNING.value),
                    sample_rate,
                    low,
                    high,
                )
                result[band_name].append(float(power))
            except Exception:
                result[band_name].append(0.0)

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
