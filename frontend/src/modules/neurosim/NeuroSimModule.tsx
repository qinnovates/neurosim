/**
 * NeuroSIM — BrainFlow integration hub.
 * Connect devices, explore the API, load sample datasets, stream live data.
 */
import { useState } from "react";
import { ModuleShell } from "../../components/layout/ModuleShell";
import { getModuleById } from "../registry";
import { useData } from "../../contexts/DataContext";

const MODULE = getModuleById("neurosim")!;

/* ── Supported Boards Database ──────────────────────────── */

interface BoardInfo {
  name: string;
  id: number;
  eegChannels: number;
  sampleRate: number;
  connection: string;
  extraModalities: string[];
  platform: string;
  tier: "research" | "consumer" | "development";
}

const BOARDS: BoardInfo[] = [
  // Development
  { name: "Synthetic Board", id: -1, eegChannels: 8, sampleRate: 250, connection: "None (software)", extraModalities: [], platform: "All", tier: "development" },
  { name: "Playback File Board", id: -3, eegChannels: 0, sampleRate: 0, connection: "CSV file", extraModalities: [], platform: "All", tier: "development" },
  { name: "Streaming Board", id: -2, eegChannels: 0, sampleRate: 0, connection: "UDP multicast", extraModalities: [], platform: "All", tier: "development" },
  // Research
  { name: "OpenBCI Cyton", id: 0, eegChannels: 8, sampleRate: 250, connection: "Serial / WiFi", extraModalities: [], platform: "All", tier: "research" },
  { name: "OpenBCI Cyton + Daisy", id: 2, eegChannels: 16, sampleRate: 125, connection: "Serial / WiFi", extraModalities: [], platform: "All", tier: "research" },
  { name: "OpenBCI Ganglion", id: 1, eegChannels: 4, sampleRate: 200, connection: "BLE / BLED", extraModalities: ["Accel"], platform: "All", tier: "research" },
  { name: "FreeEEG32", id: 17, eegChannels: 32, sampleRate: 1000, connection: "Serial", extraModalities: [], platform: "All", tier: "research" },
  { name: "FreeEEG128", id: 50, eegChannels: 128, sampleRate: 1000, connection: "Serial", extraModalities: [], platform: "All", tier: "research" },
  { name: "Ant Neuro EE-5xx", id: 55, eegChannels: 64, sampleRate: 500, connection: "Network", extraModalities: [], platform: "Win/Linux", tier: "research" },
  { name: "Galea", id: 3, eegChannels: 8, sampleRate: 500, connection: "Network", extraModalities: ["EMG", "EOG", "Gyro", "Accel", "EDA", "PPG"], platform: "All", tier: "research" },
  // Consumer
  { name: "Muse 2", id: 38, eegChannels: 4, sampleRate: 256, connection: "BLE / BLED", extraModalities: ["Gyro", "Accel", "PPG"], platform: "All", tier: "consumer" },
  { name: "Muse S", id: 21, eegChannels: 4, sampleRate: 256, connection: "BLE / BLED", extraModalities: ["Gyro", "Accel", "PPG"], platform: "All", tier: "consumer" },
  { name: "Neurosity Crown", id: 57, eegChannels: 8, sampleRate: 256, connection: "Network", extraModalities: [], platform: "All", tier: "consumer" },
  { name: "BrainBit", id: 7, eegChannels: 4, sampleRate: 250, connection: "BLE", extraModalities: [], platform: "All", tier: "consumer" },
  { name: "Unicorn (g.tec)", id: 8, eegChannels: 8, sampleRate: 250, connection: "Dongle", extraModalities: [], platform: "All", tier: "consumer" },
  { name: "Mentalab Explore 8", id: 44, eegChannels: 8, sampleRate: 250, connection: "BLE", extraModalities: ["Gyro", "Accel", "Temp"], platform: "All", tier: "consumer" },
  { name: "EmotiBit", id: 47, eegChannels: 0, sampleRate: 25, connection: "WiFi", extraModalities: ["Accel", "Gyro", "PPG", "EDA", "Temp"], platform: "All", tier: "consumer" },
  { name: "BrainAlive", id: 53, eegChannels: 8, sampleRate: 250, connection: "BLE", extraModalities: [], platform: "All", tier: "consumer" },
];

/* ── API Explorer Data ──────────────────────────────────── */

interface ApiMethod {
  name: string;
  module: "BoardShim" | "DataFilter" | "MLModel";
  description: string;
  signature: string;
  useCase: string;
}

const API_METHODS: ApiMethod[] = [
  // BoardShim
  { name: "prepare_session", module: "BoardShim", description: "Initialize board connection and allocate ring buffer", signature: "board.prepare_session()", useCase: "First step after creating BoardShim instance" },
  { name: "start_stream", module: "BoardShim", description: "Begin data acquisition thread", signature: "board.start_stream(buffer_size, streamer_params)", useCase: "Start streaming after prepare_session. Optional streamer for file recording or network relay" },
  { name: "get_board_data", module: "BoardShim", description: "Flush ring buffer and return all samples", signature: "board.get_board_data() → ndarray [channels × samples]", useCase: "Retrieve accumulated data. Clears the buffer" },
  { name: "get_current_board_data", module: "BoardShim", description: "Peek latest N samples without clearing buffer", signature: "board.get_current_board_data(num_samples) → ndarray", useCase: "Non-destructive read for real-time display. Buffer is preserved" },
  { name: "insert_marker", module: "BoardShim", description: "Write event tag into marker channel", signature: "board.insert_marker(value, preset)", useCase: "Tag stimulus events, attack injection points, user actions" },
  { name: "add_streamer", module: "BoardShim", description: "Add parallel data output sink", signature: "board.add_streamer(streamer_params, preset)", useCase: "Record to CSV: 'file://session.csv:w'. Relay over UDP: 'streaming_board://224.0.0.1:6789'" },
  { name: "get_board_descr", module: "BoardShim", description: "Get full board description as JSON", signature: "BoardShim.get_board_descr(board_id, preset) → dict", useCase: "Auto-populate channel maps, sample rates, and device capabilities" },
  { name: "get_eeg_channels", module: "BoardShim", description: "Get EEG channel indices for a board", signature: "BoardShim.get_eeg_channels(board_id, preset) → list[int]", useCase: "Know which rows in the data array are EEG vs other modalities" },

  // DataFilter
  { name: "perform_bandpass", module: "DataFilter", description: "Apply bandpass filter in-place", signature: "DataFilter.perform_bandpass(data, rate, start_freq, stop_freq, order, filter_type, ripple)", useCase: "Isolate frequency bands: alpha (8-13Hz), beta (13-30Hz), etc." },
  { name: "perform_bandstop", module: "DataFilter", description: "Apply notch filter to remove power line noise", signature: "DataFilter.perform_bandstop(data, rate, center_freq-2, center_freq+2, order, filter_type, ripple)", useCase: "Remove 50Hz or 60Hz power line interference" },
  { name: "remove_environmental_noise", module: "DataFilter", description: "Auto-detect and remove 50/60Hz noise", signature: "DataFilter.remove_environmental_noise(data, rate, noise_type)", useCase: "One-call cleanup: FIFTY(0), SIXTY(1), or FIFTY_AND_SIXTY(2)" },
  { name: "get_psd_welch", module: "DataFilter", description: "Compute power spectral density using Welch method", signature: "DataFilter.get_psd_welch(data, nfft, overlap, rate, window) → (amplitudes, frequencies)", useCase: "Frequency analysis with lower variance than raw FFT" },
  { name: "get_avg_band_powers", module: "DataFilter", description: "Compute average power in standard frequency bands", signature: "DataFilter.get_avg_band_powers(data, channels, rate, apply_filters) → (means[5], stds[5])", useCase: "Quick delta/theta/alpha/beta/gamma power. Returns 5-element arrays" },
  { name: "perform_ica", module: "DataFilter", description: "Independent Component Analysis for artifact separation", signature: "DataFilter.perform_ica(data, num_components) → (W, K, A, S)", useCase: "Separate eye blinks, muscle artifacts from neural signals" },
  { name: "detect_peaks_z_score", module: "DataFilter", description: "Adaptive peak detection using Z-score", signature: "DataFilter.detect_peaks_z_score(data, lag, threshold, influence)", useCase: "Find anomalous spikes without hardcoded thresholds" },
  { name: "get_heart_rate", module: "DataFilter", description: "Compute heart rate from PPG channels", signature: "DataFilter.get_heart_rate(ppg_ir, ppg_red, rate, fft_size) → BPM", useCase: "Requires PPG channels (Muse 2, EmotiBit, Galea)" },
  { name: "get_oxygen_level", module: "DataFilter", description: "Compute SpO2 from PPG channels", signature: "DataFilter.get_oxygen_level(ppg_ir, ppg_red, rate, coef1, coef2, coef3) → %", useCase: "Blood oxygen estimation. Requires calibration coefficients" },
  { name: "get_railed_percentage", module: "DataFilter", description: "Check electrode contact quality", signature: "DataFilter.get_railed_percentage(data, gain) → fraction", useCase: "High railing = bad electrode contact. Show as signal quality indicator" },
  { name: "perform_wavelet_denoising", module: "DataFilter", description: "Wavelet-based signal denoising", signature: "DataFilter.perform_wavelet_denoising(data, wavelet, level, method, threshold, ext, noise_level)", useCase: "Advanced noise removal preserving transient features" },
  { name: "get_csp", module: "DataFilter", description: "Common Spatial Patterns for motor imagery", signature: "DataFilter.get_csp(data_3d, labels) → (filters, eigenvalues)", useCase: "Feature extraction for left/right hand motor imagery classification" },

  // MLModel
  { name: "prepare (mindfulness)", module: "MLModel", description: "Load mindfulness classifier", signature: "MLModel(BrainFlowMetrics.MINDFULNESS, BrainFlowClassifiers.DEFAULT).prepare()", useCase: "Score focused attention 0-1. Feed avg_band_powers as features" },
  { name: "prepare (restfulness)", module: "MLModel", description: "Load restfulness classifier", signature: "MLModel(BrainFlowMetrics.RESTFULNESS, BrainFlowClassifiers.DEFAULT).prepare()", useCase: "Score relaxation state 0-1. Same feature vector as mindfulness" },
  { name: "predict", module: "MLModel", description: "Run inference on feature vector", signature: "model.predict(feature_vector) → score[]", useCase: "Returns array of doubles. For default classifiers, single element 0-1" },
  { name: "ONNX classifier", module: "MLModel", description: "Load custom ONNX model", signature: "MLModel(MINDFULNESS, ONNX_CLASSIFIER, file='model.onnx').prepare()", useCase: "Drop in any PyTorch/TensorFlow model exported as ONNX" },
];

/* ── Sample Datasets ────────────────────────────────────── */

interface SampleDataset {
  name: string;
  file: string;
  description: string;
  duration: string;
  paradigm: string;
  dominantBand: string;
}

const SAMPLE_DATASETS: SampleDataset[] = [
  { name: "Resting State (Eyes Closed)", file: "resting_eyes_closed.csv", description: "Alpha-dominant baseline recording", duration: "60s", paradigm: "Resting", dominantBand: "Alpha (8-13 Hz)" },
  { name: "Resting State (Eyes Open)", file: "resting_eyes_open.csv", description: "Beta-dominant with alpha suppression", duration: "60s", paradigm: "Resting", dominantBand: "Beta (13-30 Hz)" },
  { name: "Motor Imagery (Left Hand)", file: "motor_imagery_left.csv", description: "ERD in right motor cortex (C4)", duration: "30s", paradigm: "Motor Imagery", dominantBand: "Mu (8-12 Hz)" },
  { name: "Motor Imagery (Right Hand)", file: "motor_imagery_right.csv", description: "ERD in left motor cortex (C3)", duration: "30s", paradigm: "Motor Imagery", dominantBand: "Mu (8-12 Hz)" },
  { name: "P300 Oddball", file: "p300_oddball.csv", description: "Event-related potentials with target markers", duration: "120s", paradigm: "P300 ERP", dominantBand: "Broadband" },
  { name: "SSVEP 12 Hz", file: "ssvep_12hz.csv", description: "Steady-state visually evoked potential in occipital channels", duration: "30s", paradigm: "SSVEP", dominantBand: "12 Hz harmonic" },
  { name: "Sleep Stage N2", file: "sleep_stage_n2.csv", description: "Sleep spindles, K-complexes, delta waves", duration: "60s", paradigm: "Sleep", dominantBand: "Delta/Sigma" },
  { name: "Eye Blink Artifacts", file: "artifact_eye_blink.csv", description: "Clean EEG with periodic frontal artifacts", duration: "30s", paradigm: "Artifact", dominantBand: "Mixed" },
  { name: "Seizure Simulation", file: "seizure_simulation.csv", description: "Epileptiform high-amplitude rhythmic discharges", duration: "30s", paradigm: "Seizure", dominantBand: "Broadband" },
  { name: "Meditation (Theta)", file: "meditation_theta.csv", description: "Enhanced theta with intermittent alpha", duration: "60s", paradigm: "Meditation", dominantBand: "Theta (4-8 Hz)" },
];

/* ── Tab Components ─────────────────────────────────────── */

function BoardsTab() {
  const [filter, setFilter] = useState<"all" | "research" | "consumer" | "development">("all");
  const filtered = filter === "all" ? BOARDS : BOARDS.filter((b) => b.tier === filter);

  const tierColors: Record<string, string> = {
    research: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    consumer: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    development: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-2">
        {(["all", "research", "consumer", "development"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`mono text-[10px] px-3 py-1.5 rounded-lg border transition-colors capitalize ${
              filter === t
                ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                : "text-gray-500 border-[#1f2937] hover:text-gray-300"
            }`}
          >
            {t} ({t === "all" ? BOARDS.length : BOARDS.filter((b) => b.tier === t).length})
          </button>
        ))}
      </div>

      {/* Board grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((board) => (
          <div key={board.id} className="bg-[#111827] border border-[#1f2937] rounded-lg p-3 hover:border-[#374151] transition-colors">
            <div className="flex items-start justify-between mb-2">
              <span className="text-[12px] font-semibold text-gray-200">{board.name}</span>
              <span className={`mono text-[8px] uppercase px-1.5 py-0.5 rounded border ${tierColors[board.tier]}`}>
                {board.tier}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] mono">
              <div><span className="text-gray-600">Board ID:</span> <span className="text-gray-400">{board.id}</span></div>
              <div><span className="text-gray-600">EEG Ch:</span> <span className="text-gray-400">{board.eegChannels}</span></div>
              <div><span className="text-gray-600">Rate:</span> <span className="text-gray-400">{board.sampleRate} Hz</span></div>
              <div><span className="text-gray-600">Connection:</span> <span className="text-gray-400">{board.connection}</span></div>
              <div><span className="text-gray-600">Platform:</span> <span className="text-gray-400">{board.platform}</span></div>
              {board.extraModalities.length > 0 && (
                <div className="col-span-2"><span className="text-gray-600">Extra:</span> <span className="text-emerald-400">{board.extraModalities.join(", ")}</span></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick start code */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Quick Start — Connect a Board</h3>
        <pre className="bg-[#0a0e17] rounded-lg p-3 text-[11px] mono text-gray-400 overflow-x-auto">
{`from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds

# 1. Configure connection
params = BrainFlowInputParams()
params.serial_port = "/dev/ttyUSB0"  # For OpenBCI Cyton
# params.mac_address = ""            # For BLE devices (Muse, Ganglion)

# 2. Create board instance
board_id = BoardIds.SYNTHETIC_BOARD.value  # Start with synthetic
board = BoardShim(board_id, params)

# 3. Connect and stream
board.prepare_session()
board.start_stream(45000)  # Ring buffer size

# 4. Read data
import time
time.sleep(5)  # Collect 5 seconds
data = board.get_board_data()  # Flush buffer

# 5. Get channel info
eeg_channels = BoardShim.get_eeg_channels(board_id)
sampling_rate = BoardShim.get_sampling_rate(board_id)
print(f"Got {data.shape[1]} samples from {len(eeg_channels)} EEG channels at {sampling_rate}Hz")

# 6. Cleanup
board.stop_stream()
board.release_session()`}
        </pre>
      </div>
    </div>
  );
}

function ApiExplorerTab() {
  const [moduleFilter, setModuleFilter] = useState<"all" | "BoardShim" | "DataFilter" | "MLModel">("all");
  const filtered = moduleFilter === "all" ? API_METHODS : API_METHODS.filter((m) => m.module === moduleFilter);

  const moduleColors: Record<string, string> = {
    BoardShim: "text-emerald-400",
    DataFilter: "text-purple-400",
    MLModel: "text-cyan-400",
  };

  return (
    <div className="space-y-4">
      {/* Module overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <h4 className="text-sm font-semibold text-emerald-400 mb-1">BoardShim</h4>
          <p className="text-[10px] text-gray-500 leading-relaxed">Hardware abstraction layer. Manages board connections, data acquisition, ring buffers, markers, and streaming.</p>
          <div className="mt-2 mono text-[9px] text-gray-600">40+ boards supported</div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <h4 className="text-sm font-semibold text-purple-400 mb-1">DataFilter</h4>
          <p className="text-[10px] text-gray-500 leading-relaxed">Signal processing. FFT, PSD, bandpass/bandstop filters, wavelet denoising, ICA, peak detection, band powers.</p>
          <div className="mt-2 mono text-[9px] text-gray-600">25+ DSP methods</div>
        </div>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
          <h4 className="text-sm font-semibold text-cyan-400 mb-1">MLModel</h4>
          <p className="text-[10px] text-gray-500 leading-relaxed">Machine learning classifiers. Mindfulness, restfulness scoring. Custom ONNX model support for extensibility.</p>
          <div className="mt-2 mono text-[9px] text-gray-600">Built-in + custom models</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "BoardShim", "DataFilter", "MLModel"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setModuleFilter(m)}
            className={`mono text-[10px] px-3 py-1.5 rounded-lg border transition-colors ${
              moduleFilter === m
                ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                : "text-gray-500 border-[#1f2937] hover:text-gray-300"
            }`}
          >
            {m === "all" ? `All (${API_METHODS.length})` : `${m} (${API_METHODS.filter((x) => x.module === m).length})`}
          </button>
        ))}
      </div>

      {/* Method list */}
      <div className="space-y-2">
        {filtered.map((method) => (
          <div key={method.name + method.module} className="bg-[#111827] border border-[#1f2937] rounded-lg p-3 hover:border-[#374151] transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className={`mono text-[10px] font-bold ${moduleColors[method.module]}`}>{method.module}</span>
              <span className="text-[12px] font-semibold text-gray-200">{method.name}</span>
            </div>
            <p className="text-[10px] text-gray-500 mb-1.5">{method.description}</p>
            <code className="block bg-[#0a0e17] rounded px-2 py-1 text-[10px] mono text-gray-400 mb-1.5">{method.signature}</code>
            <p className="text-[10px] text-gray-600 italic">{method.useCase}</p>
          </div>
        ))}
      </div>

      {/* Signal processing pipeline */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Recommended Real-Time Pipeline</h3>
        <pre className="bg-[#0a0e17] rounded-lg p-3 text-[11px] mono text-gray-400 overflow-x-auto">
{`from brainflow.data_filter import DataFilter, FilterTypes, DetrendOperations

# For each channel, each update cycle (~50ms):
for ch in eeg_channels:
    channel_data = data[ch]

    # 1. Remove DC offset
    DataFilter.detrend(channel_data, DetrendOperations.CONSTANT)

    # 2. Bandpass 1-50 Hz (remove drift and high-freq noise)
    DataFilter.perform_bandpass(channel_data, sampling_rate, 1.0, 50.0, 4,
                                FilterTypes.BUTTERWORTH, 0)

    # 3. Remove power line noise (auto-detect 50/60 Hz)
    DataFilter.remove_environmental_noise(channel_data, sampling_rate,
                                           NoiseTypes.SIXTY)  # or FIFTY

    # 4. Compute band powers
    bands = DataFilter.get_avg_band_powers(data, eeg_channels,
                                            sampling_rate, True)
    # bands[0] = [delta, theta, alpha, beta, gamma] means
    # bands[1] = [delta, theta, alpha, beta, gamma] stds

    # 5. Check signal quality
    railed = DataFilter.get_railed_percentage(channel_data, 200.0)
    if railed > 0.1:
        print(f"Channel {ch}: {railed*100:.0f}% railed — check electrode")`}
        </pre>
      </div>
    </div>
  );
}

function DatasetsTab() {
  const { send, connected, streaming } = useData();
  const [activeDataset, setActiveDataset] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDataset = (file: string) => {
    if (!connected) {
      setLoadError("Engine not ready. Please wait a moment.");
      return;
    }
    setLoadError(null);
    setActiveDataset(file);
    send({ action: "load_dataset", file });
  };

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-400 mb-1">Sample Dataset Library</h3>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          These are <strong className="text-gray-300">synthetic datasets</strong> generated to mimic known EEG patterns
          from published neuroscience paradigms. They are NOT real brain recordings. Use them for testing, learning,
          and development. All datasets use 16 channels (10-20 system) at 250 Hz.
        </p>
        <p className="text-[10px] text-emerald-400 mt-2">
          Click "Load & Stream" on any dataset to play it through all modules.
        </p>
      </div>

      {loadError && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2.5 text-[10px] text-red-400">
          {loadError}
        </div>
      )}

      {/* Dataset grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SAMPLE_DATASETS.map((ds) => {
          const isActive = activeDataset === ds.file && streaming;

          return (
            <div key={ds.file} className={`bg-[#111827] border rounded-lg p-3 transition-colors ${
              isActive ? "border-cyan-500/50" : "border-[#1f2937] hover:border-[#374151]"
            }`}>
              <div className="flex items-start justify-between mb-1">
                <span className="text-[12px] font-semibold text-gray-200">{ds.name}</span>
                <span className="mono text-[9px] text-gray-600">{ds.duration}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{ds.description}</p>
              <div className="flex items-center gap-3 text-[9px] mono mb-2">
                <span className="text-gray-600">Paradigm: <span className="text-cyan-400">{ds.paradigm}</span></span>
                <span className="text-gray-600">Band: <span className="text-purple-400">{ds.dominantBand}</span></span>
              </div>
              <div className="flex items-center justify-between">
                <code className="text-[9px] mono text-gray-700">data/{ds.file}</code>
                <button
                  onClick={() => loadDataset(ds.file)}
                  disabled={isActive}
                  className={`mono text-[9px] px-2.5 py-1 rounded-lg border transition-colors ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                      : "text-gray-400 border-[#1f2937] hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30"
                  }`}
                >
                  {isActive ? "Streaming..." : "Load & Stream"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load dataset code */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Load a Sample Dataset</h3>
        <pre className="bg-[#0a0e17] rounded-lg p-3 text-[11px] mono text-gray-400 overflow-x-auto">
{`from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds

# Use PLAYBACK_FILE_BOARD to replay any CSV dataset
params = BrainFlowInputParams()
params.file = "data/resting_eyes_closed.csv"
params.master_board = BoardIds.SYNTHETIC_BOARD.value  # Defines channel layout

board = BoardShim(BoardIds.PLAYBACK_FILE_BOARD.value, params)
board.prepare_session()
board.start_stream()

# Data streams as if it were live hardware
import time
time.sleep(2)
data = board.get_board_data()
print(f"Replayed {data.shape[1]} samples")

board.stop_stream()
board.release_session()`}
        </pre>
      </div>

      {/* Generate more data */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Generate More Data</h3>
        <pre className="bg-[#0a0e17] rounded-lg p-3 text-[11px] mono text-gray-400 overflow-x-auto">
{`# Generate custom datasets at scale
cd data/
python3 generate_sample_data.py

# Customize parameters in the script:
# - Duration per dataset
# - Number of channels
# - Sample rate
# - Noise levels and artifact patterns`}
        </pre>
      </div>
    </div>
  );
}

function LiveStatusTab() {
  const { connected, streaming, sampleRate, channelNames, seq } = useData();

  return (
    <div className="space-y-4">
      {/* Current connection */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Current Connection</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] mono text-gray-600 uppercase">Status</div>
            <div className={`text-sm mono font-semibold ${connected ? "text-emerald-400" : "text-amber-400"}`}>
              {connected ? "Connected" : "Disconnected"}
            </div>
          </div>
          <div>
            <div className="text-[10px] mono text-gray-600 uppercase">Stream</div>
            <div className={`text-sm mono font-semibold ${streaming ? "text-emerald-400" : "text-gray-400"}`}>
              {streaming ? "Active" : "Idle"}
            </div>
          </div>
          <div>
            <div className="text-[10px] mono text-gray-600 uppercase">Sample Rate</div>
            <div className="text-sm mono font-semibold text-gray-300">{sampleRate} Hz</div>
          </div>
          <div>
            <div className="text-[10px] mono text-gray-600 uppercase">Packets</div>
            <div className="text-sm mono font-semibold text-gray-300">{seq.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Channel map */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Active Channels ({channelNames.length})</h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {channelNames.map((name, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 bg-[#0a0e17] rounded-lg text-[10px] mono">
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">{i + 1}</span>
              <span className="text-gray-300">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Multicast streaming info */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Streaming Architecture</h3>
        <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
          Demo Atlas runs entirely in the browser using a Web Worker for data generation and FFT-based
          band power computation. No backend server required. Sample datasets are loaded via fetch and
          streamed through the same pipeline as live data.
        </p>
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 bg-[#0a0e17] rounded-lg text-center">
            <div className="text-[9px] mono text-gray-600">Engine</div>
            <div className="text-[11px] mono text-emerald-400">Web Worker</div>
          </div>
          <svg width="24" height="12" viewBox="0 0 24 12"><path d="M0 6h20M16 2l4 4-4 4" stroke="#374151" strokeWidth="1.5" fill="none" /></svg>
          <div className="px-3 py-2 bg-[#0a0e17] rounded-lg text-center">
            <div className="text-[9px] mono text-gray-600">Transport</div>
            <div className="text-[11px] mono text-purple-400">postMessage</div>
          </div>
          <svg width="24" height="12" viewBox="0 0 24 12"><path d="M0 6h20M16 2l4 4-4 4" stroke="#374151" strokeWidth="1.5" fill="none" /></svg>
          <div className="px-3 py-2 bg-[#0a0e17] rounded-lg text-center">
            <div className="text-[9px] mono text-gray-600">Frontend</div>
            <div className="text-[11px] mono text-cyan-400">All Modules</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Module ────────────────────────────────────────── */

type Tab = "boards" | "api" | "datasets" | "live";

export default function NeuroSimModule() {
  const [tab, setTab] = useState<Tab>("boards");

  const tabs: { id: Tab; label: string }[] = [
    { id: "boards", label: "Supported Boards" },
    { id: "api", label: "API Explorer" },
    { id: "datasets", label: "Sample Data" },
    { id: "live", label: "Live Status" },
  ];

  return (
    <ModuleShell module={MODULE}>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-[#1f2937] pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`mono text-[11px] px-3 py-1.5 rounded-t transition-colors ${
              tab === t.id
                ? "bg-[#111827] text-gray-200 border border-[#1f2937] border-b-transparent"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "boards" && <BoardsTab />}
      {tab === "api" && <ApiExplorerTab />}
      {tab === "datasets" && <DatasetsTab />}
      {tab === "live" && <LiveStatusTab />}
    </ModuleShell>
  );
}
