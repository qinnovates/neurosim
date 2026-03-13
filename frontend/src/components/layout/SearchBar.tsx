/**
 * Global KQL-style search bar — persistent at the top of every view.
 * Searches across modules, alerts, and data.
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MODULES, type ModuleDefinition } from "../../modules/registry";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<ModuleDefinition[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const matched = MODULES.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q),
    );
    setResults(matched);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = (mod: ModuleDefinition) => {
    navigate(mod.path);
    setQuery("");
    setFocused(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative flex-1 max-w-xl">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
          focused
            ? "bg-[#1a2332] border-[#374151] ring-1 ring-emerald-500/20"
            : "bg-[#111827] border-[#1f2937] hover:border-[#374151]"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 flex-shrink-0">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search modules, signals, alerts..."
          className="flex-1 bg-transparent text-xs text-gray-300 placeholder:text-gray-600 outline-none mono"
        />
        <kbd className="hidden sm:inline-block text-[9px] mono px-1.5 py-0.5 rounded bg-[#1f2937] text-gray-500 border border-[#374151]">
          {navigator.platform.includes("Mac") ? "\u2318" : "Ctrl"}+K
        </kbd>
      </div>

      {focused && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#111827] border border-[#1f2937] rounded-lg shadow-xl z-50 overflow-hidden">
          {results.map((mod) => (
            <button
              key={mod.id}
              onMouseDown={() => handleSelect(mod)}
              className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-[#1a2332] transition-colors"
            >
              <mod.Icon size={16} style={{ color: mod.color }} />
              <div>
                <div className="text-xs text-gray-300 font-medium">{mod.name}</div>
                <div className="text-[10px] text-gray-600">{mod.category}</div>
              </div>
              {mod.status !== "active" && (
                <span className="ml-auto text-[9px] mono text-gray-600 uppercase">{mod.status}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
