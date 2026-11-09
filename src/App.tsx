/**
 * ChromaForge - Main Application Root
 * Orchestrates TopBar, Workbench Layout, View Switching, and URL State Loading.
 */

import React, { useEffect } from 'react';
import { useChromaStore } from './store/useChromaStore';
import { TopBar } from './modules/workbench/TopBar';
import { WorkbenchLayout } from './modules/workbench/WorkbenchLayout';
import { AccessibilityMatrix } from './modules/accessibility/AccessibilityMatrix';
import { LiveComponentPreview } from './modules/preview/LiveComponentPreview';
import { compileTokens } from './core/tokens/formatters';
import { Copy, Check } from 'lucide-react';

export default function App() {
  const {
    activeView,
    ramps,
    activeFormat,
    exportOptions,
    loadFromSerializedUrl,
  } = useChromaStore();

  const [copiedTokens, setCopiedTokens] = React.useState(false);

  // Initialize state from URL if shared via ?palette=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paletteParam = params.get('palette');
    if (paletteParam) {
      loadFromSerializedUrl(paletteParam);
    }
  }, [loadFromSerializedUrl]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090B] text-[#F4F4F6] font-sans overflow-hidden">
      {/* TopBar (Linear / Geist style) */}
      <TopBar />

      {/* View Orchestrator */}
      {activeView === 'workbench' && <WorkbenchLayout />}

      {/* Optical Accessibility Matrix & Gamut Map View */}
      {activeView === 'matrix' && <AccessibilityMatrix />}

      {/* Live Component Preview View */}
      {activeView === 'preview' && <LiveComponentPreview />}

      {/* Tokens View */}
      {activeView === 'tokens' && (
        <div className="flex-1 flex flex-col overflow-hidden p-6 bg-[#09090B] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">
                Design Tokens Direct Output
              </h2>
              <p className="text-xs font-mono text-zinc-500">
                Production-ready code generated for modern frontend toolchains.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const code = compileTokens(ramps, activeFormat, exportOptions);
                  await navigator.clipboard.writeText(code);
                  setCopiedTokens(true);
                  setTimeout(() => setCopiedTokens(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-colors"
              >
                {copiedTokens ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#58DB91]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Palette</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-white/[0.07] bg-[#070709] p-4">
            <pre className="text-xs font-mono text-zinc-300 select-all leading-relaxed">
              <code>{compileTokens(ramps, activeFormat, exportOptions)}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
