/**
 * NeuroSIM — Root layout with sidebar + routed module content.
 */
import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { StatusBar } from "./components/layout/StatusBar";
import { useData } from "./contexts/DataContext";
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

export default function App() {
  const { connected, streaming, sampleRate, channelNames, seq, uptime } = useData();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
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

        {/* Status bar */}
        <StatusBar
          connected={connected}
          streaming={streaming}
          sampleRate={sampleRate}
          channels={channelNames.length}
          seq={seq}
          uptime={uptime}
        />
      </div>
    </div>
  );
}
