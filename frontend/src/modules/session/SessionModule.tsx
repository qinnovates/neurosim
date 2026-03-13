/**
 * Session Recorder — Record, replay, annotate brain signal sessions.
 * Includes clinical/professional use disclaimer for biometric data awareness.
 */
import { useState } from "react";
import { ModuleShell } from "../../components/layout/ModuleShell";
import { getModuleById } from "../registry";

const MODULE = getModuleById("session")!;
const CONSENT_KEY = "neurosim-session-consent";

function SessionDisclaimer({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Warning header */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-100">Session Recording — Important Notice</h2>
              <span className="mono text-[10px] text-gray-600">Please read before recording</span>
            </div>
          </div>

          {/* Clinical/Professional disclaimer */}
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-amber-400 mb-2">Who Should Use Session Recording</h3>
            <p className="text-[12px] text-gray-400 leading-relaxed mb-3">
              Session recording is intended for <strong className="text-gray-300">clinical professionals, researchers,
              and informed individuals</strong> who understand the implications of capturing and storing brain signal data.
            </p>
            <ul className="text-[12px] text-gray-400 leading-relaxed space-y-2">
              <li className="flex gap-2">
                <span className="text-amber-400 flex-shrink-0">1.</span>
                <span>
                  <strong className="text-gray-300">EEG data is biometric data.</strong> Recorded brainwaves
                  can reveal information about cognitive states, neurological conditions, emotional responses,
                  and other sensitive personal characteristics. Under regulations such as GDPR, CCPA, and
                  state biometric privacy laws (BIPA, etc.), this data may be classified as sensitive biometric
                  information requiring explicit consent and careful handling.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 flex-shrink-0">2.</span>
                <span>
                  <strong className="text-gray-300">You are responsible for what you record.</strong> If you
                  record your own brainwaves without understanding what that data contains, you may inadvertently
                  expose personal neurological information. If you record someone else, you must obtain their
                  informed consent and comply with applicable privacy regulations.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 flex-shrink-0">3.</span>
                <span>
                  <strong className="text-gray-300">Do not share recordings without understanding the risks.</strong> Raw
                  EEG files contain temporal patterns that may be re-identifiable. Sharing a session file is
                  analogous to sharing a fingerprint or voice recording — treat it with the same level of care.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 flex-shrink-0">4.</span>
                <span>
                  <strong className="text-gray-300">Synthetic data is safe.</strong> If you are using the
                  built-in synthetic board (no real hardware), recorded data is computer-generated and
                  carries no privacy risk. This is the recommended starting point for learning how session
                  recording works.
                </span>
              </li>
            </ul>
          </div>

          {/* Professional guidance */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">For Non-Professional Users</h3>
            <p className="text-[12px] text-gray-400 leading-relaxed">
              If you are recording your own brainwaves for personal exploration and do not have clinical or
              research training, we strongly recommend:
            </p>
            <ul className="text-[12px] text-gray-400 leading-relaxed mt-2 space-y-1.5">
              <li>&#8226; Start with synthetic data only until you understand the recording workflow</li>
              <li>&#8226; Never share raw session files publicly or upload them to cloud services</li>
              <li>&#8226; Store recordings in an encrypted folder on your local machine</li>
              <li>&#8226; Consult a clinician or neuroscientist if you want to interpret your own EEG data</li>
              <li>&#8226; Delete recordings you no longer need — data minimization protects you</li>
            </ul>
          </div>

          {/* Qinnovate stance */}
          <p className="text-[11px] text-gray-600 leading-relaxed mb-4">
            Qinnovate builds tools for neural monitoring and security research. We do not collect, store,
            or transmit any session data. All recordings are stored locally on your machine. We are not
            responsible for how you use, share, or store your recorded data.
          </p>
        </div>

        {/* Consent */}
        <div className="px-6 pb-6">
          <button
            onClick={onAccept}
            className="w-full mono text-sm px-6 py-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors font-semibold"
          >
            I Understand the Implications
          </button>
          <p className="text-[10px] text-gray-600 text-center mt-3">
            By clicking above, you acknowledge that brain signal recordings are sensitive biometric data
            and accept responsibility for their storage and use.
          </p>
        </div>
      </div>
    </div>
  );
}

function SessionRecorderUI() {
  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#111827] border border-[#1f2937] rounded-lg">
          <span className="w-2 h-2 rounded-full bg-gray-600" />
          <span className="mono text-xs text-gray-400">Not Recording</span>
        </div>
        <button
          disabled
          className="mono text-xs px-4 py-2 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 opacity-50 cursor-not-allowed"
        >
          Start Recording
        </button>
        <span className="mono text-[10px] text-gray-600">Recording engine coming in next release</span>
      </div>

      {/* Planned features */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <h3 className="mono text-xs text-gray-400 uppercase tracking-wider mb-3">Planned Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: "One-Click Record", desc: "Start/stop full session capture with keyboard shortcut" },
            { title: "Event Markers", desc: "Tag moments in the timeline (stimulus, response, anomaly)" },
            { title: "Variable-Speed Replay", desc: "Replay sessions at 0.5x, 1x, 2x, or 4x speed" },
            { title: "Side-by-Side Compare", desc: "Compare two sessions with synchronized timelines" },
            { title: "Multi-Format Export", desc: "Export as EDF, BrainVision, CSV, or BIDS-compatible" },
            { title: "Session Library", desc: "Browse, search, and filter your recorded sessions" },
            { title: "Auto-Save Mode", desc: "Continuous recording with configurable retention" },
            { title: "Metadata Capture", desc: "Board config, duration, channel map, alert count" },
          ].map((f) => (
            <div key={f.title} className="px-3 py-2 bg-[#0a0e17] rounded-lg border border-[#1f2937]">
              <div className="text-[11px] font-semibold text-gray-300 mb-0.5">{f.title}</div>
              <div className="text-[10px] text-gray-600">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data safety reminder */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="mono text-[10px] text-amber-400 uppercase">Data Safety Reminder</span>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          All session recordings are stored locally on your machine. Open Neural Atlas does not transmit
          neural data to any server. When recording with real hardware, remember that EEG data is biometric
          data — store it securely and share it only with informed consent.
        </p>
      </div>
    </div>
  );
}

export default function SessionModule() {
  const [consentGiven, setConsentGiven] = useState(
    () => !!localStorage.getItem(CONSENT_KEY),
  );

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    setConsentGiven(true);
  };

  if (!consentGiven) {
    return (
      <ModuleShell module={MODULE}>
        <SessionDisclaimer onAccept={handleAccept} />
      </ModuleShell>
    );
  }

  return (
    <ModuleShell module={MODULE}>
      <SessionRecorderUI />
    </ModuleShell>
  );
}
