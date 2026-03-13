/**
 * First-open consent & disclaimer modal.
 * Must be accepted before using Open Neural Atlas. Persists to localStorage.
 */
import { useState, useEffect } from "react";

const CONSENT_KEY = "neurosim-consent-accepted";

interface ConsentModalProps {
  onAccept: () => void;
}

export function ConsentModal({ onAccept }: ConsentModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(CONSENT_KEY);
    if (!accepted) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    setVisible(false);
    onAccept();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <svg width="28" height="28" viewBox="0 0 32 32">
              <rect width="32" height="32" rx="4" fill="#0a0e17" />
              <path d="M8 16 Q12 8 16 16 Q20 24 24 16" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <circle cx="16" cy="16" r="2" fill="#10b981" />
            </svg>
            <div>
              <h1 className="text-lg font-bold text-gray-100">Welcome to Open Neural Atlas</h1>
              <span className="mono text-[10px] text-gray-600">Open Neurosecurity Stack — by Qinnovate</span>
            </div>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            Open Neural Atlas is an open-source neurosecurity stack for brain-computer interfaces —
            signal monitoring, threat analysis, and governance tooling in one platform.
            It is under <strong className="text-amber-400">active development</strong>.
          </p>

          {/* Call for BCI community */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mb-4">
            <h2 className="text-sm font-semibold text-emerald-400 mb-2">Calling All BCI Users</h2>
            <p className="text-[12px] text-gray-400 leading-relaxed">
              Our goal is to build this with input from real BCI users — especially those looking
              for careers in protecting other BCI users. If you use a brain-computer interface and want to
              help shape what neurosecurity tools look like, your feedback on this UI is invaluable.
              We want Open Neural Atlas to be <strong className="text-gray-300">BCI-accessible</strong> from day one.
            </p>
            <p className="text-[11px] text-emerald-400/60 mt-2">
              Reach out via <a href="https://github.com/qinnovates/neurosim/issues" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-300">GitHub Issues</a> or <a href="https://github.com/qinnovates/neurosim/discussions" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-300">Discussions</a> to share your experience.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-4">
            <h2 className="text-sm font-semibold text-amber-400 mb-2">Disclaimer</h2>
            <ul className="text-[12px] text-gray-400 leading-relaxed space-y-2">
              <li>
                This software is provided <strong className="text-gray-300">as-is</strong> for research
                and educational purposes. The developer is <strong className="text-gray-300">not liable</strong> for
                any damage, data loss, or unintended consequences arising from its use.
              </li>
              <li>
                <strong className="text-amber-300">Always use simulated EEG data</strong> if your host machine
                is not secured. Real BCI signals are sensitive biometric data. Do not stream real neural
                data over unsecured networks or on shared machines.
              </li>
              <li>
                <strong className="text-gray-300">Understand your security posture first.</strong> Before connecting real
                hardware, ensure your environment is trusted, your network is encrypted, and you understand
                the data you are transmitting.
              </li>
              <li>
                <strong className="text-gray-300">Non-anonymized brain data is never transmitted in production.</strong> The
                sample datasets in this demo are fully synthetic — generated from published research paradigms,
                not recorded from real subjects. This is how we approach data protection by design.
              </li>
              <li>
                All proposed frameworks (QIF, NISS, TARA, Neurowall) are <strong className="text-gray-300">unvalidated
                research tools</strong>, not production security products.
              </li>
            </ul>
          </div>
        </div>

        {/* Consent button */}
        <div className="px-6 pb-6">
          <button
            onClick={handleAccept}
            className="w-full mono text-sm px-6 py-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors font-semibold"
          >
            I Understand & Consent
          </button>
          <p className="text-[10px] text-gray-600 text-center mt-3">
            By clicking above, you acknowledge this disclaimer and agree to use Open Neural Atlas responsibly.
          </p>
        </div>
      </div>
    </div>
  );
}
