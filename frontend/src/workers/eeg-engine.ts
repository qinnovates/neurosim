/**
 * EEG Engine Web Worker — generates/plays EEG data and computes band powers.
 * Replaces the Python backend for the Demo Atlas (browser-only mode).
 *
 * Commands (via postMessage):
 *   { action: "start" }                   — start synthetic board
 *   { action: "stop" }                    — stop streaming
 *   { action: "load_dataset", file: "..." } — load CSV dataset from public/data/
 *   { action: "set_threshold", value: N } — update alert threshold
 *
 * Emits ServerMessage-compatible objects (config, status, eeg).
 */

// ── Constants ─────────────────────────────────────────────────
const SAMPLE_RATE = 250;
const CHUNK_SIZE = 25; // samples per frame (250/10 = 25 → 10 frames/sec)
const TICK_MS = 100; // emit every 100ms
const FFT_SIZE = 256; // FFT window size (must be power of 2)
const CHANNELS = [
  "Fp1", "Fp2", "F3", "F4", "C3", "C4", "P3", "P4",
  "O1", "O2", "F7", "F8", "T3", "T4", "Pz", "Oz",
];
const NUM_CH = CHANNELS.length;

// Band frequency ranges (Hz)
const BANDS = {
  delta: [0.5, 4],
  theta: [4, 8],
  alpha: [8, 13],
  beta: [13, 30],
  gamma: [30, 50],
} as const;

// ── State ─────────────────────────────────────────────────────
let running = false;
let timer: ReturnType<typeof setInterval> | null = null;
let seq = 0;
let startTime = 0;
let threshold = 150;
let alertId = 0;
let mode: "synthetic" | "csv" = "synthetic";

// CSV playback state
let csvData: Float64Array[] | null = null; // [channel][samples]
let csvIndex = 0;

// FFT history buffer per channel (for band power computation)
const fftBuffers: Float64Array[] = Array.from({ length: NUM_CH }, () => new Float64Array(FFT_SIZE));
const fftWritePos: number[] = new Array(NUM_CH).fill(0);

// ── FFT (radix-2 Cooley-Tukey) ───────────────────────────────

function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  // Bit reversal
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  // FFT butterflies
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let j = 0; j < half; j++) {
        const tRe = curRe * re[i + j + half] - curIm * im[i + j + half];
        const tIm = curRe * im[i + j + half] + curIm * re[i + j + half];
        re[i + j + half] = re[i + j] - tRe;
        im[i + j + half] = im[i + j] - tIm;
        re[i + j] += tRe;
        im[i + j] += tIm;
        const newCurRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = newCurRe;
      }
    }
  }
}

/** Compute PSD band powers for a single channel buffer. */
function computeBandPower(buffer: Float64Array): Record<string, number> {
  const n = FFT_SIZE;
  // Apply Hann window
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    re[i] = buffer[i] * w;
  }

  fft(re, im);

  // Compute power spectrum (one-sided)
  const freqRes = SAMPLE_RATE / n;
  const powers: Record<string, number> = {};

  for (const [band, [fLow, fHigh]] of Object.entries(BANDS)) {
    const binLow = Math.ceil(fLow / freqRes);
    const binHigh = Math.floor(fHigh / freqRes);
    let sum = 0;
    for (let b = binLow; b <= binHigh && b < n / 2; b++) {
      sum += re[b] * re[b] + im[b] * im[b];
    }
    // Normalize to uV^2
    powers[band] = (2 * sum) / (n * n);
  }

  return powers;
}

// ── Synthetic Data Generation ─────────────────────────────────

function generateSyntheticChunk(): number[][] {
  const t0 = (seq * CHUNK_SIZE) / SAMPLE_RATE;
  const samples: number[][] = Array.from({ length: NUM_CH }, () => new Array(CHUNK_SIZE));

  for (let s = 0; s < CHUNK_SIZE; s++) {
    const t = t0 + s / SAMPLE_RATE;
    for (let ch = 0; ch < NUM_CH; ch++) {
      // Mix of physiological rhythms + noise, vary by channel
      const phaseOff = ch * 0.4;
      const alpha = (ch >= 8 && ch <= 9 ? 20 : 8) * Math.sin(2 * Math.PI * 10 * t + phaseOff); // 10 Hz alpha
      const beta = 4 * Math.sin(2 * Math.PI * 20 * t + phaseOff * 1.3); // 20 Hz beta
      const theta = 6 * Math.sin(2 * Math.PI * 6 * t + phaseOff * 0.7); // 6 Hz theta
      const delta = 10 * Math.sin(2 * Math.PI * 2 * t + phaseOff * 0.3); // 2 Hz delta
      const noise = (Math.random() - 0.5) * 10; // white noise
      samples[ch][s] = alpha + beta + theta + delta + noise;
    }
  }
  return samples;
}

// ── CSV Playback ──────────────────────────────────────────────

function getCSVChunk(): number[][] | null {
  if (!csvData) return null;
  const totalSamples = csvData[0].length;
  const samples: number[][] = Array.from({ length: NUM_CH }, () => new Array(CHUNK_SIZE));

  for (let s = 0; s < CHUNK_SIZE; s++) {
    const idx = (csvIndex + s) % totalSamples;
    for (let ch = 0; ch < NUM_CH; ch++) {
      samples[ch][s] = ch < csvData.length ? csvData[ch][idx] : 0;
    }
  }
  csvIndex = (csvIndex + CHUNK_SIZE) % totalSamples;
  return samples;
}

async function loadCSV(file: string): Promise<void> {
  const resp = await fetch(`${(self as any).__BASE_URL || ""}data/${file}`);
  const text = await resp.text();
  const lines = text.trim().split("\n");
  const header = lines[0].split(",");

  // Find EEG channel columns (exclude timestamp, package_num, marker)
  const skipCols = new Set(["timestamp", "package_num", "marker"]);
  const channelIndices: number[] = [];
  const channelNames: string[] = [];
  for (let i = 0; i < header.length; i++) {
    if (!skipCols.has(header[i].trim())) {
      channelIndices.push(i);
      channelNames.push(header[i].trim());
    }
  }

  const numSamples = lines.length - 1;
  const data: Float64Array[] = Array.from({ length: channelIndices.length }, () => new Float64Array(numSamples));

  for (let row = 1; row < lines.length; row++) {
    const cols = lines[row].split(",");
    for (let c = 0; c < channelIndices.length; c++) {
      data[c][row - 1] = parseFloat(cols[channelIndices[c]]) || 0;
    }
  }

  csvData = data;
  csvIndex = 0;

  // Send config with actual channel names from CSV
  self.postMessage({
    type: "config",
    sample_rate: SAMPLE_RATE,
    num_channels: channelNames.length,
    channel_names: channelNames,
  });
}

// ── Alert Detection ───────────────────────────────────────────

function detectAlerts(samples: number[][], ts: number): any[] {
  const alerts: any[] = [];
  for (let ch = 0; ch < Math.min(samples.length, NUM_CH); ch++) {
    for (const val of samples[ch]) {
      if (Math.abs(val) > threshold) {
        alerts.push({
          id: ++alertId,
          channel: ch,
          name: `Amplitude spike`,
          value: Math.abs(val),
          threshold,
          ts,
          severity: Math.abs(val) > threshold * 2 ? "critical"
            : Math.abs(val) > threshold * 1.5 ? "high"
            : Math.abs(val) > threshold * 1.2 ? "medium"
            : "low",
        });
        break; // one alert per channel per chunk
      }
    }
  }
  return alerts;
}

// ── Streaming Loop ────────────────────────────────────────────

function tick(): void {
  const samples = mode === "csv" ? getCSVChunk() : generateSyntheticChunk();
  if (!samples) return;

  // Update FFT buffers
  for (let ch = 0; ch < Math.min(samples.length, NUM_CH); ch++) {
    for (const val of samples[ch]) {
      fftBuffers[ch][fftWritePos[ch]] = val;
      fftWritePos[ch] = (fftWritePos[ch] + 1) % FFT_SIZE;
    }
  }

  seq++;
  const ts = Date.now() / 1000;
  const uptime = (Date.now() - startTime) / 1000;

  // Compute band powers every 4th frame (~2.5 Hz update rate)
  let bands: Record<string, number[]> | undefined;
  if (seq % 4 === 0) {
    bands = { delta: [], theta: [], alpha: [], beta: [], gamma: [] };
    for (let ch = 0; ch < Math.min(samples.length, NUM_CH); ch++) {
      const bp = computeBandPower(fftBuffers[ch]);
      for (const band of Object.keys(bands)) {
        bands[band].push(bp[band]);
      }
    }
  }

  // Detect alerts
  const alerts = detectAlerts(samples, ts);

  // Emit EEG message
  self.postMessage({
    type: "eeg",
    seq,
    ts,
    samples,
    bands: bands || undefined,
    alerts: alerts.length > 0 ? alerts : undefined,
  });

  // Emit status periodically
  if (seq % 10 === 0) {
    self.postMessage({ type: "status", state: "streaming", uptime });
  }
}

function startStreaming(): void {
  if (running) return;
  running = true;
  seq = 0;
  startTime = Date.now();
  alertId = 0;
  fftWritePos.fill(0);
  fftBuffers.forEach((b) => b.fill(0));

  // Send config
  self.postMessage({
    type: "config",
    sample_rate: SAMPLE_RATE,
    num_channels: NUM_CH,
    channel_names: CHANNELS,
  });

  self.postMessage({ type: "status", state: "streaming", uptime: 0 });

  timer = setInterval(tick, TICK_MS);
}

function stopStreaming(): void {
  running = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  self.postMessage({ type: "status", state: "stopped", uptime: (Date.now() - startTime) / 1000 });
}

// ── Message Handler ───────────────────────────────────────────

self.onmessage = async (e: MessageEvent) => {
  const { action, ...rest } = e.data;

  switch (action) {
    case "start":
      mode = "synthetic";
      csvData = null;
      startStreaming();
      break;

    case "stop":
      stopStreaming();
      break;

    case "load_dataset": {
      const file = rest.file || rest.path;
      // Extract filename from path if needed
      const filename = typeof file === "string" ? file.split("/").pop()! : file;
      stopStreaming();
      try {
        await loadCSV(filename);
        mode = "csv";
        startStreaming();
      } catch (err) {
        console.error("Failed to load dataset:", err);
      }
      break;
    }

    case "set_threshold":
      threshold = rest.value ?? 150;
      break;
  }
};
