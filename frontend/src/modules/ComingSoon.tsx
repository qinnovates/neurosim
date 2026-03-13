/**
 * Shared "Coming Soon" shell for modules still in development.
 * Shows a preview of planned features with the module's help text.
 */
import { ModuleShell } from "../components/layout/ModuleShell";
import type { ModuleDefinition } from "./registry";

interface ComingSoonProps {
  module: ModuleDefinition;
  features: string[];
  concept?: string;
}

export function ComingSoon({ module, features, concept }: ComingSoonProps) {
  return (
    <ModuleShell module={module}>
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <module.Icon size={48} style={{ color: module.color }} className="mb-4" />
        <h2 className="text-lg font-semibold text-gray-300 mb-2">{module.name}</h2>
        <p className="text-sm text-gray-500 text-center max-w-md mb-6">
          {module.description}
        </p>

        {concept && (
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 max-w-lg mb-6 w-full">
            <h3 className="mono text-[10px] text-gray-500 uppercase tracking-wider mb-2">Concept</h3>
            <p className="text-[12px] text-gray-400 leading-relaxed">{concept}</p>
          </div>
        )}

        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 max-w-lg w-full">
          <h3 className="mono text-[10px] text-gray-500 uppercase tracking-wider mb-2">Planned Features</h3>
          <ul className="space-y-1.5">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-gray-400">
                <span className="text-gray-600 mt-0.5">&#9633;</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 mono text-[10px] text-gray-600 uppercase tracking-wider">
          In Development
        </div>
      </div>
    </ModuleShell>
  );
}
