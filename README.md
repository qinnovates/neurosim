# NeuroSIM

**Neural Security Operations Simulator**

The first open-source tool that bridges BCI signal processing and security operations into a unified visual platform. Plug in real EEG data via BrainFlow, simulate TARA attack techniques, and watch a neural firewall detect and respond in real time — rendered like a SIEM dashboard.

## A Call to the BCI Community

**If you use a brain-computer interface, we want your help.**

The long-term goal of NeuroSIM is to be built *with* and *for* real BCI users — especially those looking for careers in protecting other BCI users. The neurosecurity field is young. The people who will define what "secure" means for neural interfaces are the people who use them today.

We need your feedback on:
- **UI accessibility** — Does NeuroSIM work with your BCI setup? What's missing?
- **Signal representation** — Are we showing the right data in the right way?
- **Threat realism** — Do the simulated attacks map to real concerns you have?
- **Workflow** — What would make this tool useful in your daily life?

If you're a BCI user, researcher, clinician, or engineer interested in neurosecurity, open an Issue or Discussion. Your experience is the most valuable input this project can receive.

## Why This Exists

Every BCI tool today is either a neuroscience tool with zero security awareness, or an ML security tool with zero signal-level awareness. Nothing bridges them. NeuroSIM does.

- **BrainFlow** generates and streams real/synthetic EEG — but has no security layer
- **OpenBCI GUI** visualizes signals — but has no threat detection
- **MNE-Python** simulates physiologically realistic signals — but offline only, no adversarial modes
- **IBM ART** tests ML adversarial attacks — but has no EEG data type, no real-time, no hardware
- **No tool anywhere** maps attacks to a threat taxonomy, scores impact, or visualizes a neural firewall

NeuroSIM fills that gap.

## Disclaimer

**This software is under active development.**

- Provided as-is for research and educational purposes
- The developer is not liable for any damage, data loss, or unintended consequences
- **Always use simulated EEG data** if your host machine is not secured
- Real BCI signals are sensitive biometric data — do not stream over unsecured networks
- **Know your security first** before connecting real hardware
- All proposed frameworks (QIF, NISS, TARA, Neurowall) are unvalidated research tools, not production security products

## Purpose

1. **Demonstrate** what neurosecurity operations look like — visually, in real time
2. **Simulate** TARA attack techniques against live or synthetic BCI streams
3. **Visualize** neural firewall (Neurowall) detection and response
4. **Connect** real BrainFlow EEG data to a simulated security operations environment
5. **Package** as a standalone tool that researchers, students, and the BCI industry can use
6. **Gather feedback** from real BCI users to make neurosecurity tools BCI-accessible

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    NeuroSIM UI                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Signal   │  │ Threat   │  │ Neurowall         │  │
│  │ Monitor  │  │ Console  │  │ Firewall View     │  │
│  │ (SIEM)   │  │ (TARA)   │  │ (Detection/Block) │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                 │              │
│  ┌────┴──────────────┴─────────────────┴──────────┐  │
│  │           NeuroSIM Engine                      │  │
│  │  Signal Processing │ Threat Scoring │ Alerting  │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
│  ┌────────────────────┴───────────────────────────┐  │
│  │           BrainFlow Data Layer                  │  │
│  │  Synthetic Board │ Real Hardware │ File Replay  │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Current Features (v0.1)

### Dashboard
- SIEM-style landing page with KPI tiles, sparklines, and trend deltas
- Alert summary grouped by severity with shape-redundant badges (WCAG AA)
- Pause/snapshot mode to freeze display for analysis
- Global search bar (Cmd+K) across all modules

### Signal Monitor
- Real-time 16-channel EEG waveform rendering on HTML Canvas at 30fps
- HiDPI-aware with 16-color channel palette

### Spectrum Analyzer
- Frequency band decomposition: Delta, Theta, Alpha, Beta, Gamma
- Welch PSD method with trapezoidal integration

### Alert Center
- Severity-filtered alert log with shape + color + text indicators
- Threshold-based anomaly detection (amplitude monitoring)
- Grouped by severity: Critical (diamond), High (triangle), Medium (square), Low (circle)

### Integrations Hub
- 15 data sources: BrainFlow, Crossref, Semantic Scholar, PubMed, NVD, CISA, FDA, arXiv, and more
- KQL query editor for the QIF data lake (62 tables, 3,500+ rows)
- Tabbed interface: Overview, KQL Query, APIs, Feeds, Tools & Data

### Coming Soon Modules
- **Neurowall** — Neural firewall with rule engine and real-time detection
- **TARA Console** — Attack simulation using the QIF threat catalog
- **NISS Scoring** — Signal-level impact measurement (proposed metric)
- **Runemate** — Neural protocol inspector
- **Brain Map** — Spatial activity visualization on a head diagram
- **Session Recorder** — Record, replay, and export sessions

### UI Features
- Dark/light mode toggle with localStorage persistence
- Sidebar with expand-on-hover navigation and grayscale-to-color icon states
- First-run consent disclaimer and 7-step guided tour
- Custom SVG icon system (13 monoline icons)
- qinnovate watermark

## Data Sources

| Source | Mode | Description |
|--------|------|-------------|
| BrainFlow SYNTHETIC_BOARD | Simulation | Generated EEG signals, no hardware needed |
| BrainFlow real boards | Live | OpenBCI, Muse, Neurosity, any BrainFlow-supported device |
| File replay | Playback | Recorded EEG sessions (.csv, .edf) |
| MOABB datasets | Research | 36 public EEG-BCI datasets for benchmarking |

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Data acquisition | BrainFlow (Python) | Board-agnostic, synthetic + real hardware, cross-platform |
| Signal processing | BrainFlow DataFilter, SciPy | FFT, filtering, band power, peak detection |
| Backend | Python (FastAPI) | WebSocket streaming via msgpack binary encoding |
| Frontend | React 19 + TypeScript + Tailwind v4 | SIEM-style dashboard, canvas-based rendering |
| Build | Vite 8 | Fast HMR, code splitting, lazy module loading |
| Threat catalog | QIF TARA JSON | Attack technique definitions and parameters |

## Supported Hardware

| Device | Board ID | Channels | Sample Rate |
|--------|----------|----------|-------------|
| Synthetic (no hardware) | SYNTHETIC_BOARD (-1) | 8 | 250 Hz |
| OpenBCI Cyton | CYTON_BOARD (0) | 8 | 250 Hz |
| OpenBCI Cyton + Daisy | CYTON_DAISY_BOARD (2) | 16 | 125 Hz |
| OpenBCI Ganglion | GANGLION_BOARD (1) | 4 | 200 Hz |
| Muse 2 | MUSE_2_BOARD (38) | 4 | 256 Hz |
| Muse S | MUSE_S_BOARD (21) | 4 | 256 Hz |
| Neurosity Crown | CROWN_BOARD (57) | 8 | 256 Hz |

## Roadmap

### Phase 1: Signal Monitor MVP ✅
- [x] BrainFlow synthetic board streaming to WebSocket
- [x] React dashboard with real-time multi-channel EEG canvas
- [x] Frequency band decomposition display
- [x] Basic anomaly detection (threshold-based)
- [x] SIEM-style dashboard with KPI tiles and sparklines
- [x] Global search, guided tour, consent disclaimer

### Phase 2: TARA Attack Injection
- [ ] Attack parameter UI (select technique, configure intensity)
- [ ] Signal injection engine (overlay attack on clean stream)
- [ ] Before/after visual comparison
- [ ] NISS scoring integration (proposed metric)
- [ ] BrainFlow insert_marker() for event correlation

### Phase 3: Neurowall Firewall
- [ ] Rule engine: configurable detection rules
- [ ] Real-time detection overlay
- [ ] Block/alert visualization with outcome preview
- [ ] Detection metrics dashboard
- [ ] BrainFlow DataFilter integration (bandpass, notch, wavelet denoising)

### Phase 4: Polish and Package
- [ ] BCI user accessibility testing and feedback integration
- [ ] Session recording via BrainFlow add_streamer()
- [ ] MLModel integration (mindfulness/restfulness classifiers)
- [ ] PDF report generation
- [ ] Electron packaging for desktop distribution
- [ ] Role-based views (Researcher, Clinician, Security Analyst)

## Quick Start

```bash
# Backend
cd backend
pip install brainflow fastapi uvicorn msgpack scipy
python -m neurosim.main

# Frontend
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:5173`. Click **Start Streaming** to begin.

## Prior Art & Gap Analysis

| Tool | Signal Sim | Real Hardware | Security Testing | Visual Dashboard | Threat Taxonomy |
|------|-----------|--------------|-----------------|-----------------|----------------|
| BrainFlow | Basic synthetic | Yes (30+ boards) | No | No | No |
| OpenBCI GUI | Synthetic mode | OpenBCI only | No | Yes (basic) | No |
| MNE-Python | Realistic (offline) | No | No | Matplotlib only | No |
| IBM ART | No | No | ML attacks only | No | No |
| OpenViBE | No | Yes | No | Pipeline view | No |
| **NeuroSIM** | **Yes** | **Yes (via BrainFlow)** | **Yes (TARA)** | **Yes (SIEM-style)** | **Yes (QIF TARA)** |

## Relationship to QIF

NeuroSIM is a standalone tool that uses QIF's TARA threat catalog and NISS scoring as its threat intelligence layer. It is not part of the QIF framework itself — it is a practical application that demonstrates QIF concepts in a visual, interactive environment.

TARA techniques, NISS scores, and Neurowall rules referenced in this tool are proposed and unvalidated. NeuroSIM is a research and demonstration tool, not a certified medical or security device.

## Contributing

We especially welcome contributions from:
- **BCI users** — Your accessibility feedback shapes the product
- **Neuroscience researchers** — Signal processing and brain map accuracy
- **Security engineers** — Threat modeling and firewall rule design
- **Frontend developers** — SIEM UX patterns and accessibility

Open an Issue or Discussion to get started.

## License

MIT

---

*Built by Kevin L. Qi — [qinnovate.com](https://qinnovate.com)*
