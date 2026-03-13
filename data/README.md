# Open Neural Atlas -- Sample EEG Data

## Important Disclaimer

These are **SYNTHETIC datasets** generated algorithmically to mimic known EEG patterns. They are **NOT real brain recordings** from human subjects. No human subjects were involved, and no IRB approval was required.

These datasets are suitable for:
- Software testing and development
- Algorithm prototyping (filtering, artifact rejection, classification)
- Learning and education about EEG signal characteristics
- UI/visualization development for BCI tools

They are **NOT suitable for**:
- Clinical decision-making
- Scientific conclusions about brain function
- Training production-grade machine learning models (use real datasets for that)

## Datasets

| File | Paradigm | Duration | Key Feature |
|------|----------|----------|-------------|
| `resting_eyes_closed.csv` | Resting state | 60s | Alpha-dominant (8-13Hz) |
| `resting_eyes_open.csv` | Resting state | 60s | Beta-dominant, alpha suppressed |
| `motor_imagery_left.csv` | Motor imagery | 30s | ERD at C4, mu suppression |
| `motor_imagery_right.csv` | Motor imagery | 30s | ERD at C3, mu suppression |
| `p300_oddball.csv` | ERP | 120s | P300 with target/non-target markers |
| `ssvep_12hz.csv` | SSVEP | 30s | 12Hz + harmonics in occipital channels |
| `sleep_stage_n2.csv` | Sleep | 60s | Sleep spindles, K-complexes |
| `artifact_eye_blink.csv` | Artifact | 30s | Frontal eye blink artifacts |
| `seizure_simulation.csv` | Epilepsy | 30s | Evolving rhythmic discharges |
| `meditation_theta.csv` | Meditation | 60s | Enhanced frontal midline theta |

All datasets: 16 channels (10-20 system), 250 Hz sample rate.

## CSV Format

Each CSV contains:
- `timestamp` -- UNIX epoch (float64, microsecond precision)
- `package_num` -- monotonic sample counter
- 16 EEG channels in microvolts: `Fp1, Fp2, F3, F4, C3, C4, P3, P4, O1, O2, F7, F8, T3, T4, Pz, Oz`
- `marker` -- event markers (0.0 = no event, positive values = events; see `manifest.json` for codes)

## Signal Generation Approach

The generator (`generate_sample_data.py`) builds signals from:

1. **Band-specific sinusoids** at physiological frequencies (delta 1-4Hz, theta 4-8Hz, alpha 8-13Hz, beta 13-30Hz, gamma 30-50Hz) with configurable amplitudes per dataset type
2. **1/f pink noise** background (characteristic of cortical field potentials)
3. **Inter-channel spatial correlation** based on 10-20 electrode adjacency
4. **Region-specific amplitude scaling** (e.g., occipital alpha is stronger, frontal channels are slightly noisier)
5. **Paradigm-specific features**: P300 waveforms, sleep spindles, SSVEP harmonics, seizure evolution, blink artifacts

Amplitude range: 10-100 uV typical, up to 200 uV for artifacts and seizures.

## Scientific Basis

The signal patterns are based on well-established neuroscience findings:

- **Alpha rhythm**: Berger (1929); Pfurtscheller & Lopes da Silva (1999). Posterior dominant rhythm at 8-13Hz, suppressed by eye opening.
- **Event-related desynchronization (ERD/ERS)**: Pfurtscheller & Aranibar (1979). Contralateral mu rhythm suppression during motor imagery.
- **P300 ERP**: Sutton et al. (1965); Farwell & Donchin (1988). Positive deflection at ~300ms post-stimulus for rare/target events, maximal at parietal midline.
- **SSVEP**: Regan (1989); Vialatte et al. (2010). Steady-state response at stimulus frequency and harmonics in visual cortex.
- **Sleep spindles and K-complexes**: De Gennaro & Ferrara (2003). Sigma-band (12-14Hz) bursts and large biphasic waves characteristic of NREM stage 2.
- **Epileptiform discharges**: Niedermeyer & Lopes da Silva (2005). Rhythmic activity that evolves in frequency and amplitude, often focal-to-generalized.
- **Frontal midline theta**: Aftanas & Golocheikine (2001). Enhanced 5-7Hz activity during meditation and focused attention.

## Regenerating Data

```bash
cd /path/to/neurosim/data
python3 generate_sample_data.py
```

The script uses a fixed random seed (`numpy.random.default_rng(42)`) for reproducibility. To generate different data, change the seed in the script.

Requirements: Python 3.10+, numpy.

## Customizing Parameters

Edit `generate_sample_data.py` to:
- Change band amplitudes per dataset (the `band_amplitudes` dict in each generator function)
- Adjust duration, sample rate, or channel count (constants at the top)
- Add new paradigms by writing a new `gen_*` function following the existing pattern
- Modify spatial correlation strength (`rho_adjacent` parameter)
- Change the 1/f noise level (`pink_amplitude` parameter)
