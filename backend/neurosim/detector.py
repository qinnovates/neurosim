"""Anomaly detection engine: threshold-based amplitude monitoring."""

import time
import numpy as np

from .config import NeuroSimConfig


class AnomalyDetector:
    """Simple threshold-based anomaly detector for EEG signals."""

    def __init__(self, config: NeuroSimConfig):
        self.config = config
        self.threshold = config.amplitude_threshold
        self.channel_names = config.channel_names[:config.num_channels]
        self._alert_count = 0

    def check(self, eeg_data: np.ndarray) -> list[dict]:
        """Check EEG data for threshold violations.

        Args:
            eeg_data: shape (channels, samples)

        Returns:
            List of alert dicts for any violations.
        """
        alerts = []
        num_channels = min(eeg_data.shape[0], len(self.channel_names))

        for ch in range(num_channels):
            channel = eeg_data[ch]
            max_val = float(np.max(np.abs(channel)))

            if max_val > self.threshold:
                self._alert_count += 1
                alerts.append({
                    "id": self._alert_count,
                    "channel": ch,
                    "name": self.channel_names[ch],
                    "value": round(max_val, 2),
                    "threshold": self.threshold,
                    "ts": time.time(),
                    "severity": self._classify_severity(max_val),
                })

        return alerts

    def set_threshold(self, threshold: float) -> None:
        """Update the amplitude threshold."""
        self.threshold = max(0.0, threshold)

    def _classify_severity(self, value: float) -> str:
        """Classify alert severity based on how far above threshold."""
        ratio = value / self.threshold
        if ratio > 2.0:
            return "critical"
        elif ratio > 1.5:
            return "high"
        elif ratio > 1.2:
            return "medium"
        return "low"
