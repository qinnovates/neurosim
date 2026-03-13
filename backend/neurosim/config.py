"""NeuroSIM configuration."""

from dataclasses import dataclass, field


@dataclass
class NeuroSimConfig:
    """Server and board configuration."""

    host: str = "0.0.0.0"
    port: int = 8765
    board_type: str = "synthetic"

    # BrainFlow synthetic board settings
    sample_rate: int = 250
    num_channels: int = 16
    channel_names: list[str] = field(default_factory=lambda: [
        "Fz", "C3", "Cz", "C4", "Pz", "PO7", "Oz", "PO8",
        "F5", "F7", "F3", "F1", "F2", "F4", "F6", "F8",
    ])

    # Streaming settings
    batch_interval_ms: int = 100  # Poll BrainFlow every 100ms
    band_update_interval_ms: int = 250  # Compute band powers every 250ms

    # Anomaly detection defaults
    amplitude_threshold: float = 150.0  # microvolts
    alert_max_queue: int = 200
