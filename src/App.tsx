/**
 * ChromaForge - Main Application Root
 * Orchestrates TopBar, Workbench Layout, View Switching, and URL State Loading.
 */

import { useEffect, useState } from 'react';
import { useChromaStore } from './store/useChromaStore';
import { TopBar } from './modules/workbench/TopBar';
import { WorkbenchLayout } from './modules/workbench/WorkbenchLayout';
import { AccessibilityMatrix } from './modules/accessibility/AccessibilityMatrix';
import { LiveComponentPreview } from './modules/preview/LiveComponentPreview';
import { compileTokens } from './core/tokens/formatters';
import { TokenExportFormat } from './types/tokens';
import { Copy, Check, Download, FileCode } from 'lucide-react';

const TOKEN_FORMATS: { id: TokenExportFormat; label: string; ext: string }[] = [
  { id: 'tailwind-v4', label: 'Tailwind v4 @theme', ext: 'css' },
  { id: 'tailwind-v3', label: 'Tailwind v3 Config', ext: 'js' },
  { id: 'css-variables', label: 'CSS :root Variables', ext: 'css' },
  { id: 'w3c-tokens', label: 'W3C Design Tokens', ext: 'json' },
  { id: 'typescript', label: 'TypeScript Constants', ext: 'ts' },
];

export default function App() {
  const {
    activeView,
    ramps,
    activeFormat,
    setActiveFormat,
    exportOptions,
    updateExportOptions,
    loadFromSerializedUrl,
  } = useChromaStore();

  const [copiedTokens, setCopiedTokens] = useState(false);

  // Initialize state from URL if shared via ?palette=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paletteParam = params.get('palette');
    if (paletteParam) {
      loadFromSerializedUrl(paletteParam);
    }
  }, [loadFromSerializedUrl]);

  const compiledCode = compileTokens(ramps, activeFormat, exportOptions);

  const handleDownload = () => {
    const currentFormat = TOKEN_FORMATS.find((f) => f.id === activeFormat) || TOKEN_FORMATS[0];
    const blob = new Blob([compiledCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chromaforge-tokens.${currentFormat.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

      {/* Tokens Direct View with Full Format Tab Bar */}
      {activeView === 'tokens' && (
        <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 bg-[#09090B] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#818CF8]" />
                <h2 className="text-sm font-semibold text-zinc-200">
                  Design Tokens Compiler
                </h2>
              </div>
              <p className="text-xs font-mono text-zinc-500 mt-0.5">
                Ready-to-use output engineered for Tailwind v4, CSS Color Module 4, and W3C DTCG specs.
              </p>
            </div>

            {/* Format Selection Tab Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-[#131317] p-0.5 rounded border border-white/[0.06]">
                {TOKEN_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setActiveFormat(format.id)}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                      activeFormat === format.id
                        ? 'bg-[#1F1F28] text-white shadow-xs font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {format.label}
                  </button>
                ))}
              </div>

              {/* Hex Fallback Toggle */}
              <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 cursor-pointer px-2 py-1 rounded bg-[#131317] border border-white/[0.06]">
                <input
                  type="checkbox"
                  checked={exportOptions.includeFallbackHex}
                  onChange={(e) => updateExportOptions({ includeFallbackHex: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-[#4F46E5] accent-[#4F46E5]"
                />
                <span>Hex Fallback</span>
              </label>

              {/* Download File */}
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-zinc-300 bg-[#18181E] hover:bg-[#22222B] border border-white/[0.06] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>

              {/* Copy Code */}
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(compiledCode);
                  setCopiedTokens(true);
                  setTimeout(() => setCopiedTokens(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-colors shadow-sm"
              >
                {copiedTokens ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#58DB91]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Palette</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 overflow-auto rounded-xl border border-white/[0.07] bg-[#070709] p-4 shadow-inner">
            <pre className="text-xs font-mono text-zinc-300 select-all leading-relaxed">
              <code>{compiledCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
