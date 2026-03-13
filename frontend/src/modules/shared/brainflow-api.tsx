/**
 * BrainFlow API reference data + explorer component.
 * Shared between NeuroSIM (boards) and Settings (API explorer).
 */
import { useState } from "react";

/* ── API Method Data ──────────────────────────────────── */

interface ApiMethod {
  name: string;
  module: "BoardShim" | "DataFilter" | "MLModel";
  description: string;
  signature: string;
  useCase: string;
}

export const API_METHODS: ApiMethod[] = [
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

/* ── API Explorer Component ───────────────────────────── */

export function ApiExplorer() {
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
