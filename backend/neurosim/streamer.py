"""WebSocket streaming loop: poll board, process, serialize, send."""

import asyncio
import time
import logging

import numpy as np
from fastapi import WebSocket

from .board import BoardManager
from .processor import compute_band_powers, compute_amplitude_stats
from .detector import AnomalyDetector
from .protocol import encode_eeg, encode_config, encode_status
from .config import NeuroSimConfig

logger = logging.getLogger(__name__)


class EEGStreamer:
    """Manages the streaming loop from BrainFlow to WebSocket clients."""

    def __init__(self, config: NeuroSimConfig):
        self.config = config
        self.board = BoardManager(config)
        self.detector = AnomalyDetector(config)
        self._seq = 0
        self._start_time = 0.0
        self._band_buffer: list[np.ndarray] = []
        self._band_sample_count = 0
        self._clients: set[WebSocket] = set()

    async def add_client(self, ws: WebSocket) -> None:
        """Register a new WebSocket client."""
        await ws.accept()
        self._clients.add(ws)
        logger.info("Client connected. Total: %d", len(self._clients))

        # Send config if board is running
        if self.board.is_running:
            board_info = {
                "sample_rate": self.config.sample_rate,
                "num_channels": len(self.board.eeg_channels),
                "channel_names": self.config.channel_names[:len(self.board.eeg_channels)],
            }
            await ws.send_bytes(encode_config(board_info))
            await ws.send_bytes(encode_status("streaming", time.time() - self._start_time))

    def remove_client(self, ws: WebSocket) -> None:
        """Unregister a WebSocket client."""
        self._clients.discard(ws)
        logger.info("Client disconnected. Total: %d", len(self._clients))

    async def start_streaming(self) -> None:
        """Start the board and streaming loop."""
        if self.board.is_running:
            return

        board_info = self.board.start()
        self.config.sample_rate = board_info["sample_rate"]
        self._start_time = time.time()
        self._seq = 0
        self._band_buffer = []
        self._band_sample_count = 0

        # Broadcast config to all clients
        config_msg = encode_config(board_info)
        await self._broadcast(config_msg)

        # Start the polling loop
        asyncio.create_task(self._stream_loop())
        logger.info("Streaming started: %s", board_info)

    async def stop_streaming(self) -> None:
        """Stop the board and notify clients."""
        self.board.stop()
        status_msg = encode_status("stopped", time.time() - self._start_time)
        await self._broadcast(status_msg)
        logger.info("Streaming stopped")

    async def handle_command(self, data: bytes) -> None:
        """Handle incoming command from a client."""
        import msgpack
        try:
            cmd = msgpack.unpackb(data, raw=False)
        except Exception:
            return

        action = cmd.get("action")
        if action == "start":
            await self.start_streaming()
        elif action == "stop":
            await self.stop_streaming()
        elif action == "set_threshold":
            threshold = cmd.get("value", self.config.amplitude_threshold)
            self.detector.set_threshold(float(threshold))

    async def _stream_loop(self) -> None:
        """Main polling loop: get data, process, broadcast."""
        interval = self.config.batch_interval_ms / 1000.0
        band_interval_samples = int(
            self.config.sample_rate * self.config.band_update_interval_ms / 1000.0
        )

        while self.board.is_running:
            result = self.board.get_data()

            if result is not None:
                eeg_data, timestamps = result
                self._seq += 1

                # Accumulate for band power calculation
                self._band_buffer.append(eeg_data)
                self._band_sample_count += eeg_data.shape[1]

                # Compute band powers periodically
                bands = None
                if self._band_sample_count >= band_interval_samples:
                    combined = np.hstack(self._band_buffer)
                    bands = compute_band_powers(combined, self.config.sample_rate)
                    self._band_buffer = []
                    self._band_sample_count = 0

                # Check for anomalies
                alerts = self.detector.check(eeg_data)

                # Encode and broadcast
                ts = float(timestamps[-1]) if len(timestamps) > 0 else time.time()
                msg = encode_eeg(self._seq, ts, eeg_data, bands, alerts)
                await self._broadcast(msg)

            await asyncio.sleep(interval)

    async def _broadcast(self, data: bytes) -> None:
        """Send data to all connected clients."""
        disconnected = set()
        for ws in self._clients:
            try:
                await ws.send_bytes(data)
            except Exception:
                disconnected.add(ws)
        for ws in disconnected:
            self.remove_client(ws)
