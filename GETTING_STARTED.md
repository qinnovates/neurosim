# Getting Started with NeuroSIM

NeuroSIM is a Neural Security Operations Simulator. It lets you monitor brain-computer interface (BCI) signals, simulate attack scenarios, and test neural firewall defenses — all in a visual dashboard.

**No hardware required.** NeuroSIM includes a synthetic signal generator that produces realistic-looking brain signals for testing.

## Quick Start (5 minutes)

### 1. Start the Backend

The backend connects to BrainFlow (a universal BCI library) and streams signal data.

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn neurosim.main:app --port 8765
```

You should see: `Uvicorn running on http://0.0.0.0:8765`

### 2. Start the Frontend

The frontend is the visual dashboard you interact with.

```bash
cd frontend
npm install
npm run dev
```

You should see: `Local: http://localhost:5173/`

### 3. Open the Dashboard

Go to **http://localhost:5173** in your browser. You'll see the NeuroSIM dashboard.

### 4. Start Streaming

Click **Start Streaming** on the dashboard. Synthetic brain signals will begin flowing.

### 5. Explore Modules

Click any active module tile to open it:

- **Signal Monitor** — Watch live brain signal waveforms from 16 channels
- **Spectrum Analyzer** — See frequency band activity (Delta, Theta, Alpha, Beta, Gamma)
- **Alert Center** — View anomaly detections with timestamps and severity levels

## What Am I Looking At?

### Brain Signals (EEG)

The wavy lines in the Signal Monitor are **electroencephalography (EEG)** data. Each line represents one electrode placed on the scalp. The electrical patterns you see are produced by neurons firing in the brain.

- **Small, fast waves** = high-frequency activity (thinking, processing)
- **Large, slow waves** = low-frequency activity (relaxation, sleep)
- **Sudden spikes** = anomalies that might indicate an artifact or an attack

### Frequency Bands

Brain signals contain multiple frequencies mixed together. The Spectrum Analyzer separates them:

| Band | Frequency | Associated With |
|------|-----------|----------------|
| **Delta** | 0.5–4 Hz | Deep sleep |
| **Theta** | 4–8 Hz | Drowsiness, meditation |
| **Alpha** | 8–13 Hz | Relaxed, eyes closed |
| **Beta** | 13–30 Hz | Active thinking, focus |
| **Gamma** | 30–100 Hz | Complex cognitive tasks |

### Alerts

When a signal exceeds the threshold you set, an alert fires. Alerts are color-coded:

| Severity | Color | Meaning |
|----------|-------|---------|
| **Low** | Blue | Slightly above threshold |
| **Medium** | Amber | Moderately above threshold |
| **High** | Orange | Significantly above threshold |
| **Critical** | Red | More than 2x the threshold |

## Connecting Real Hardware

NeuroSIM supports any BrainFlow-compatible device. To connect real hardware:

1. Update `backend/neurosim/config.py` — change `board_type` from `"synthetic"` to your device
2. For OpenBCI boards, you'll also need to specify the serial port
3. Restart the backend

Supported devices include:
- OpenBCI Cyton (8 or 16 channels)
- OpenBCI Ganglion (4 channels)
- Muse 2 (4 channels)
- Neurosity Crown
- Any of the 30+ boards BrainFlow supports

## Module Guide

| Module | Status | What It Does |
|--------|--------|-------------|
| Signal Monitor | Active | Real-time waveform display for all channels |
| Alert Center | Active | Event log with severity classification |
| Spectrum Analyzer | Active | Frequency band decomposition |
| Settings | Active | Board config, thresholds, preferences |
| Neurowall | Coming Soon | Neural firewall — detect and block suspicious signals |
| TARA Console | Coming Soon | Attack simulation using the TARA threat catalog |
| NISS Scoring | Coming Soon | Impact measurement for simulated attacks |
| Runemate | Coming Soon | Neural protocol inspector (like Wireshark for brain signals) |
| Brain Map | Coming Soon | Topographic electrode map with activity heatmap |
| Session Recorder | Coming Soon | Record, replay, and export sessions |

## Help

- Click the **?** button in any module for a detailed explanation
- Each module has plain-language descriptions designed for non-technical users
- The sidebar on the left navigates between modules
- The status bar at the bottom shows connection state and streaming info

## Technical Details

- **Backend:** Python + FastAPI + BrainFlow + SciPy
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Data transport:** WebSocket with msgpack binary encoding
- **Signal processing:** Welch's method for PSD, threshold-based anomaly detection
- **Rendering:** HTML Canvas at 30fps for real-time waveforms
