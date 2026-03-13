"""BrainFlow board wrapper for synthetic and real EEG data acquisition."""

import numpy as np
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds

from .config import NeuroSimConfig


class BoardManager:
    """Manages BrainFlow board lifecycle and data retrieval."""

    def __init__(self, config: NeuroSimConfig):
        self.config = config
        self.board: BoardShim | None = None
        self.eeg_channels: list[int] = []
        self.timestamp_channel: int = 0
        self._running = False

    @property
    def is_running(self) -> bool:
        return self._running

    def start(self) -> dict:
        """Initialize and start the BrainFlow board. Returns board info."""
        board_id = self._resolve_board_id()
        params = BrainFlowInputParams()

        BoardShim.enable_dev_board_logger()
        self.board = BoardShim(board_id, params)
        self.board.prepare_session()

        self.eeg_channels = BoardShim.get_eeg_channels(board_id)
        self.timestamp_channel = BoardShim.get_timestamp_channel(board_id)
        sample_rate = BoardShim.get_sampling_rate(board_id)

        self.board.start_stream()
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
        if self.board and self._running:
            self.board.stop_stream()
            self.board.release_session()
            self._running = False
            self.board = None

    def get_data(self) -> tuple[np.ndarray, np.ndarray] | None:
        """Get latest EEG data from the board.

        Returns (eeg_data, timestamps) where eeg_data is shape (channels, samples),
        or None if no data available.
        """
        if not self.board or not self._running:
            return None

        data = self.board.get_board_data()
        if data.shape[1] == 0:
            return None

        eeg = data[self.eeg_channels, :]
        timestamps = data[self.timestamp_channel, :]
        return eeg, timestamps

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
