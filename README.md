# NeuroSIM

**Neural Security Operations Simulator**

The first open-source tool that bridges BCI signal processing and security operations into a unified visual platform. Plug in real EEG data via BrainFlow, simulate TARA attack techniques, and watch a neural firewall detect and respond in real time — rendered like a SIEM dashboard.

## Why This Exists

Every BCI tool today is either a neuroscience tool with zero security awareness, or an ML security tool with zero signal-level awareness. Nothing bridges them. NeuroSIM does.

- **BrainFlow** generates and streams real/synthetic EEG — but has no security layer
- **OpenBCI GUI** visualizes signals — but has no threat detection
- **MNE-Python** simulates physiologically realistic signals — but offline only, no adversarial modes
- **IBM ART** tests ML adversarial attacks — but has no EEG data type, no real-time, no hardware
- **No tool anywhere** maps attacks to a threat taxonomy, scores impact, or visualizes a neural firewall

NeuroSIM fills that gap.

## Purpose

1. **Demonstrate** what neurosecurity operations look like — visually, in real time
2. **Simulate** TARA attack techniques against live or synthetic BCI streams
3. **Visualize** neural firewall (Neurowall) detection and response
4. **Connect** real BrainFlow EEG data to a simulated security operations environment
5. **Package** as a standalone tool that researchers, students, and the BCI industry can use

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

## Data Sources

| Source | Mode | Description |
|--------|------|-------------|
| BrainFlow SYNTHETIC_BOARD | Simulation | Generated EEG signals, no hardware needed |
| BrainFlow real boards | Live | OpenBCI, Muse, Neurosity, any BrainFlow-supported device |
| File replay | Playback | Recorded EEG sessions (.csv, .edf) |
| MOABB datasets | Research | 36 public EEG-BCI datasets for benchmarking |

## Core Features (Requirements)

### 1. Signal Monitor (Brain SIEM Dashboard)
- Real-time multi-channel EEG waveform display
- Frequency band decomposition (delta, theta, alpha, beta, gamma)
- Power spectral density visualization
- Channel correlation matrix
- Anomaly scoring per channel and aggregate
- Timeline with event markers

### 2. Threat Console (TARA Attack Simulation)
- Select TARA techniques from the catalog
- Inject attack signals into the live stream:
  - Amplitude manipulation (QIF-T0001 style)
  - Frequency injection (QIF-T0023 style)
  - Phase disruption (QIF-T0067 style)
  - Signal replay attacks
  - Adversarial perturbations on classifier input
- Visual diff: clean signal vs. attacked signal
- NISS impact score per attack (proposed metric, unvalidated)

### 3. Neurowall (Neural Firewall Visualization)
- Rule engine: amplitude bounds, rate limiting, frequency guards
- Real-time detection overlay on signal monitor
- Block/alert/pass decisions visualized per sample window
- Detection latency metrics
- False positive / false negative tracking
- Firewall rule editor (drag-and-drop or code)

### 4. Reporting
- Session summary with attack timeline
- Detection accuracy metrics
- Export to PDF / JSON
- Screenshots of dashboard state

## Tech Stack (Proposed)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Data acquisition | BrainFlow (Python) | Board-agnostic, synthetic + real hardware, cross-platform |
| Signal processing | MNE-Python, SciPy | Industry-standard DSP, FFT, filtering |
| Backend / engine | Python (FastAPI or Flask) | WebSocket streaming to UI |
| Frontend / UI | React + TypeScript | Interactive dashboard, real-time charts |
| Visualization | Recharts / D3.js / Three.js | Signal plots, 3D brain view, heatmaps |
| Threat catalog | QIF TARA JSON | Attack technique definitions and parameters |
| Packaging | Electron or web app | Standalone desktop app or hosted tool |

## Roadmap

### Phase 1: Signal Monitor MVP
- [ ] BrainFlow synthetic board streaming to WebSocket
- [ ] React dashboard with real-time multi-channel EEG plot
- [ ] Frequency band decomposition display
- [ ] Basic anomaly detection (threshold-based)

### Phase 2: TARA Attack Injection
- [ ] Attack parameter UI (select technique, configure intensity)
- [ ] Signal injection engine (overlay attack on clean stream)
- [ ] Before/after visual comparison
- [ ] NISS scoring integration (proposed metric)

### Phase 3: Neurowall Firewall
- [ ] Rule engine: configurable detection rules
- [ ] Real-time detection overlay
- [ ] Block/alert visualization
- [ ] Detection metrics dashboard

### Phase 4: Polish and Package
- [ ] Professional SIEM-style UI theme
- [ ] Session recording and replay
- [ ] PDF report generation
- [ ] Electron packaging for desktop distribution
- [ ] Documentation and tutorials

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

## License

TBD

---

*Built by Kevin L. Qi — qinnovate.com*
