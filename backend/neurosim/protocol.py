"""WebSocket message serialization using msgpack."""

import msgpack
import numpy as np


def encode_config(board_info: dict) -> bytes:
    """Encode board config message."""
    return msgpack.packb({
        "type": "config",
        **board_info,
    })


def encode_status(state: str, uptime: float) -> bytes:
    """Encode status message."""
    return msgpack.packb({
        "type": "status",
        "state": state,
        "uptime": round(uptime, 2),
    })


def encode_eeg(
    seq: int,
    timestamp: float,
    samples: np.ndarray,
    bands: dict[str, list[float]] | None = None,
    alerts: list[dict] | None = None,
) -> bytes:
    """Encode EEG data message.

    Args:
        seq: monotonic sequence number
        timestamp: epoch timestamp
        samples: shape (channels, num_samples) as float64
        bands: optional band power dict
        alerts: optional alert list
    """
    msg: dict = {
        "type": "eeg",
        "seq": seq,
        "ts": round(timestamp, 6),
        "samples": samples.tolist(),
    }

    if bands is not None:
        msg["bands"] = bands
    if alerts:
        msg["alerts"] = alerts

    return msgpack.packb(msg)


def decode_command(data: bytes) -> dict:
    """Decode incoming command from frontend."""
    return msgpack.unpackb(data, raw=False)
