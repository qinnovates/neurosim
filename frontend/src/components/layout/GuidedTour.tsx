/**
 * First-run guided tour — modal overlay walkthrough.
 * Shows on first visit, re-launchable from help menu.
 */
import { useState, useEffect, useCallback } from "react";

const TOUR_KEY = "neurosim-tour-completed";

interface TourStep {
  title: string;
  description: string;
  icon: string;
}

const STEPS: TourStep[] = [
  {
    title: "Welcome to Open Neural Atlas",
    description:
      "Open Neural Atlas is a next-gen neural monitoring platform by Qinnovate. It streams brain-computer interface signals (real or synthetic) and lets you monitor, analyze, and explore multi-modal biosignals in real time — like mission control for the brain.",
    icon: "🧠",
  },
  {
    title: "Dashboard Overview",
    description:
      "The dashboard shows your system status, active modules, and key metrics at a glance. Click any active module tile to dive in. Metrics update in real time with trend indicators.",
    icon: "📊",
  },
  {
    title: "Signal Monitor",
    description:
      "Watch live EEG waveforms from all 16 channels. Each line is an electrode on the scalp. The wavy patterns are electrical activity from neurons firing. Hit Start Streaming to begin.",
    icon: "📡",
  },
  {
    title: "Spectrum Analyzer",
    description:
      "See brain signals broken into frequency bands: Delta (sleep), Theta (meditation), Alpha (relaxed), Beta (thinking), Gamma (complex processing). The bars show power in each band.",
    icon: "🌈",
  },
  {
    title: "Alert Center",
    description:
      "Every anomaly triggers an alert with severity level and timestamp. Alerts are grouped by type, color-coded, and include shape indicators for accessibility. Filter by severity or channel.",
    icon: "🚨",
  },
  {
    title: "Search & Navigate",
    description:
      "Use the search bar (⌘K) to quickly find any module, signal, or alert. The sidebar on the left gives you one-click access to every tool. Hover to see module names.",
    icon: "🔍",
  },
  {
    title: "Need Help?",
    description:
      "Click the ? button in any module header for a detailed explanation of what you're looking at. Every data point has context. You can always relaunch this tour from the help icon in the status bar.",
    icon: "❓",
  },
];

interface GuidedTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function GuidedTour({ forceOpen, onClose }: GuidedTourProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setVisible(true);
      setStep(0);
      return;
    }
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      setVisible(true);
    }
  }, [forceOpen]);

  const close = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "true");
    setVisible(false);
    setStep(0);
    onClose?.();
  }, [onClose]);

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else close();
  };
  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-[#1f2937]">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* Icon */}
          <div className="text-4xl mb-4">{current.icon}</div>

          {/* Content */}
          <h2 className="text-lg font-semibold text-gray-200 mb-2">{current.title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">{current.description}</p>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === step ? "w-6 bg-emerald-500" : i < step ? "w-2 bg-emerald-500/50" : "w-2 bg-[#1f2937]"
                }`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={close}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors mono"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="mono text-xs px-4 py-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={next}
                className="mono text-xs px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
              >
                {step === STEPS.length - 1 ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
