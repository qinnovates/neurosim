/**
 * Open Neural Atlas — Root layout with sidebar, search bar, routed modules, status bar.
 * © qinnovate
 */
import { Suspense, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { StatusBar } from "./components/layout/StatusBar";
import { SearchBar } from "./components/layout/SearchBar";
import { GuidedTour } from "./components/layout/GuidedTour";
import { ConsentModal } from "./components/layout/ConsentModal";
import { useData } from "./contexts/DataContext";
import { useTheme } from "./contexts/ThemeContext";
import Dashboard from "./modules/dashboard/Dashboard";
import { MODULES } from "./modules/registry";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
        <span className="mono text-xs text-gray-500">Loading module...</span>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

export default function App() {
  const { connected, streaming, sampleRate, channelNames, seq, uptime, paused } = useData();
  const [showTour, setShowTour] = useState(false);
  const [consentGiven, setConsentGiven] = useState(
    () => !!localStorage.getItem("neurosim-consent-accepted"),
  );

  return (
    <div className="flex h-screen">
      {/* Consent modal — blocks everything until accepted */}
      {!consentGiven && <ConsentModal onAccept={() => setConsentGiven(true)} />}

      {/* Guided Tour — only after consent */}
      {consentGiven && <GuidedTour forceOpen={showTour} onClose={() => setShowTour(false)} />}

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Global search bar + theme toggle */}
        <header className="flex items-center gap-3 px-4 py-2 bg-[#0d1117] border-b border-[#1f2937] flex-shrink-0">
          <SearchBar />
          {paused && (
            <span className="mono text-[10px] px-2 py-1 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              PAUSED
            </span>
          )}
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              {MODULES.map((mod) => (
                <Route
                  key={mod.id}
                  path={mod.path}
                  element={<mod.component />}
                />
              ))}
            </Routes>
          </Suspense>
        </div>

        {/* Status bar with watermark */}
        <StatusBar
          connected={connected}
          streaming={streaming}
          sampleRate={sampleRate}
          channels={channelNames.length}
          seq={seq}
          uptime={uptime}
          onTourClick={() => setShowTour(true)}
        />
      </div>
    </div>
  );
}
