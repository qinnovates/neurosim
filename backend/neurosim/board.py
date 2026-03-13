"""BrainFlow board wrapper + CSV playback for EEG data acquisition."""

import numpy as np
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds

from .config import NeuroSimConfig
from .csv_board import CSVPlaybackBoard


class BoardManager:
    """Manages BrainFlow board lifecycle and data retrieval."""

    def __init__(self, config: NeuroSimConfig):
        self.config = config
        self.board: BoardShim | None = None
        self.csv_board: CSVPlaybackBoard | None = None
        self.eeg_channels: list[int] = []
        self.timestamp_channel: int = 0
        self._running = False
        self._mode: str = "brainflow"  # "brainflow" or "csv"

    @property
    def is_running(self) -> bool:
        return self._running

    def start(self) -> dict:
        """Initialize and start the board. Returns board info."""
        if self.config.board_type == "csv_playback":
            return self._start_csv()
        return self._start_brainflow()

    def start_csv(self, csv_path: str, loop: bool = True) -> dict:
        """Start CSV playback from a specific file."""
        # Stop any existing board
        self.stop()
        self.csv_board = CSVPlaybackBoard(
            csv_path, sample_rate=self.config.sample_rate, loop=loop
        )
        info = self.csv_board.load()
        self._mode = "csv"
        self._running = True
        return info

    def _start_csv(self) -> dict:
        """Start CSV playback using config."""
        csv_path = getattr(self.config, "csv_file_path", "")
        if not csv_path:
            raise ValueError("csv_file_path not set in config for csv_playback mode")
        return self.start_csv(csv_path)

    def _start_brainflow(self) -> dict:
        """Start a BrainFlow board."""
        board_id = self._resolve_board_id()
        params = BrainFlowInputParams()

        BoardShim.enable_dev_board_logger()
        self.board = BoardShim(board_id, params)
        self.board.prepare_session()

        self.eeg_channels = BoardShim.get_eeg_channels(board_id)
        self.timestamp_channel = BoardShim.get_timestamp_channel(board_id)
        sample_rate = BoardShim.get_sampling_rate(board_id)

        self.board.start_stream()
        self._mode = "brainflow"
        self._running = True

        # Limit to configured channel count
        num_ch = min(len(self.eeg_channels), self.config.num_channels)
        self.eeg_channels = self.eeg_channels[:num_ch]

        return {
            "board_id": board_id,
            "sample_rate": sample_rate,
            "num_channels": num_ch,
            "channel_names": self.config.channel_names[:num_ch],
        }

    def stop(self) -> None:
        """Stop and release the board."""
        if self._mode == "csv" and self.csv_board:
            self.csv_board.stop()
            self.csv_board = None
            self._running = False
        elif self.board and self._running:
            self.board.stop_stream()
            self.board.release_session()
            self.board = None
            self._running = False

    def get_data(self) -> tuple[np.ndarray, np.ndarray] | None:
        """Get latest EEG data from the active board.

        Returns (eeg_data, timestamps) where eeg_data is shape (channels, samples),
        or None if no data available.
        """
        if not self._running:
            return None

        if self._mode == "csv" and self.csv_board:
            # Return ~100ms of data at configured sample rate
            num_samples = max(1, self.config.sample_rate * self.config.batch_interval_ms // 1000)
            return self.csv_board.get_data(num_samples)

        if self.board:
            data = self.board.get_board_data()
            if data.shape[1] == 0:
                return None
            eeg = data[self.eeg_channels, :]
            timestamps = data[self.timestamp_channel, :]
            return eeg, timestamps

        return None

    def _resolve_board_id(self) -> int:
        """Map config board_type string to BrainFlow board ID."""
        board_map = {
            "synthetic": BoardIds.SYNTHETIC_BOARD.value,
            "openbci_cyton": BoardIds.CYTON_BOARD.value,
            "openbci_ganglion": BoardIds.GANGLION_BOARD.value,
            "muse_2": BoardIds.MUSE_2_BOARD.value,
        }
        board_id = board_map.get(self.config.board_type)
        if board_id is None:
            raise ValueError(f"Unknown board type: {self.config.board_type}")
        return board_id
