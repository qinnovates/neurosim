"""CSV playback board — streams pre-recorded EEG data at real-time pace."""

import csv
import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

# Columns in the generated CSV files
SKIP_COLS = {"timestamp", "package_num", "marker"}


class CSVPlaybackBoard:
    """Reads a CSV dataset and yields chunks as if streaming from hardware."""

    def __init__(self, csv_path: str, sample_rate: int = 250, loop: bool = True):
        self.csv_path = Path(csv_path)
        self.sample_rate = sample_rate
        self.loop = loop
        self._data: np.ndarray | None = None  # shape (channels, total_samples)
        self._channel_names: list[str] = []
        self._index = 0
        self._running = False

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def channel_names(self) -> list[str]:
        return self._channel_names

    @property
    def num_channels(self) -> int:
        return len(self._channel_names)

    def load(self) -> dict:
        """Load CSV into memory and return board info."""
        if not self.csv_path.exists():
            raise FileNotFoundError(f"Dataset not found: {self.csv_path}")

        with open(self.csv_path, "r") as f:
            reader = csv.DictReader(f)
            if reader.fieldnames is None:
                raise ValueError(f"CSV has no header: {self.csv_path}")

            # Identify EEG channel columns (everything except timestamp, package_num, marker)
            self._channel_names = [
                col for col in reader.fieldnames if col not in SKIP_COLS
            ]

            rows: list[list[float]] = []
            for row in reader:
                sample = [float(row[ch]) for ch in self._channel_names]
                rows.append(sample)

        # Shape: (total_samples, channels) -> transpose to (channels, total_samples)
        self._data = np.array(rows, dtype=np.float64).T
        self._index = 0
        self._running = True

        logger.info(
            "Loaded CSV: %s (%d channels, %d samples, %.1fs)",
            self.csv_path.name,
            self.num_channels,
            self._data.shape[1],
            self._data.shape[1] / self.sample_rate,
        )

        return {
            "board_id": -3,  # PLAYBACK_FILE_BOARD
            "sample_rate": self.sample_rate,
            "num_channels": self.num_channels,
            "channel_names": self._channel_names,
        }

    def get_data(self, num_samples: int = 25) -> tuple[np.ndarray, np.ndarray] | None:
        """Get next chunk of samples.

        Args:
            num_samples: Number of samples to return (default: 25 = 100ms at 250Hz)

        Returns:
            (eeg_data, timestamps) or None if stopped/exhausted.
        """
        if not self._running or self._data is None:
            return None

        total = self._data.shape[1]
        end = self._index + num_samples

        if end <= total:
            chunk = self._data[:, self._index:end]
            self._index = end
        elif self.loop:
            # Wrap around
            remaining = total - self._index
            part1 = self._data[:, self._index:total]
            part2 = self._data[:, 0 : num_samples - remaining]
            chunk = np.hstack([part1, part2])
            self._index = num_samples - remaining
        else:
            # No loop, return remaining and stop
            chunk = self._data[:, self._index:total]
            self._running = False
            if chunk.shape[1] == 0:
                return None

        # Generate timestamps
        timestamps = np.arange(chunk.shape[1], dtype=np.float64) / self.sample_rate

        return chunk, timestamps

    def stop(self) -> None:
        """Stop playback."""
        self._running = False
        self._index = 0

    def reset(self) -> None:
        """Reset playback to beginning."""
        self._index = 0
