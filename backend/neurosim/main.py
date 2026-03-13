"""NeuroSIM backend: FastAPI app with WebSocket EEG streaming."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import NeuroSimConfig
from .streamer import EEGStreamer

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

config = NeuroSimConfig()
streamer = EEGStreamer(config)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    logger.info("NeuroSIM backend starting")
    yield
    # Cleanup
    if streamer.board.is_running:
        await streamer.stop_streaming()
    logger.info("NeuroSIM backend stopped")


app = FastAPI(
    title="NeuroSIM",
    description="Neural Security Operations Simulator",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "streaming": streamer.board.is_running,
    }


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """WebSocket endpoint for EEG streaming."""
    await streamer.add_client(ws)
    try:
        while True:
            data = await ws.receive_bytes()
            await streamer.handle_command(data)
    except WebSocketDisconnect:
        streamer.remove_client(ws)
    except Exception as e:
        logger.error("WebSocket error: %s", e)
        streamer.remove_client(ws)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.host, port=config.port)
