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
      {/* TopBar (Standardized to QRCraft anatomy) */}
      <TopBar />

      {/* View Orchestrator */}
      {activeView === 'workbench' && <WorkbenchLayout />}

      {/* Optical Accessibility Matrix & Gamut Map View */}
      {activeView === 'matrix' && <AccessibilityMatrix />}

      {/* Live Component Preview View */}
      {activeView === 'preview' && <LiveComponentPreview />}

      {/* Tokens Direct View with Full Format Tab Bar */}
      {activeView === 'tokens' && (
        <div className="flex-1 flex flex-col overflow-hidden p-3.5 sm:p-6 bg-[#09090B] space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary-hover" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  Compilador de Design Tokens
                </h2>
              </div>
              <p className="text-xs font-mono text-zinc-500 mt-0.5">
                Saída pronta para engenharia compatível com Tailwind v4, CSS Color Module 4 e especificações W3C DTCG.
              </p>
            </div>

            {/* Format Selection Tab Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-lg border border-white/[0.06]">
                {TOKEN_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setActiveFormat(format.id)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-[6px] transition-all border whitespace-nowrap ${
                      activeFormat === format.id
                        ? 'border-white/[0.08] bg-zinc-800/90 text-white shadow-sm font-medium'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    {format.label}
                  </button>
                ))}
              </div>

              {/* Hex Fallback Toggle */}
              <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 cursor-pointer px-2.5 py-1 rounded-lg bg-zinc-950/80 border border-white/[0.06] hover:text-zinc-300">
                <input
                  type="checkbox"
                  checked={exportOptions.includeFallbackHex}
                  onChange={(e) => updateExportOptions({ includeFallbackHex: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-primary accent-primary"
                />
                <span>Hex Fallback</span>
              </label>

              {/* Download File */}
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg text-xs font-medium text-zinc-300 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] hover:text-white transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-secondary-hover" strokeWidth={1.75} />
                <span>Download</span>
              </button>

              {/* Copy Code */}
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(compiledCode);
                  setCopiedTokens(true);
                  setTimeout(() => setCopiedTokens(false), 2000);
                }}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-primary to-secondary shadow-md shadow-primary/25 hover:opacity-95 transition-all"
              >
                {copiedTokens ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" strokeWidth={2} />
                    <span className="text-success font-medium">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-zinc-200" strokeWidth={1.75} />
                    <span>Copiar Tokens</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 overflow-auto rounded-xl border border-white/[0.08] bg-zinc-950/90 p-4 shadow-2xl shadow-black/60 custom-scrollbar">
            <pre className="text-xs font-mono text-zinc-300 select-all leading-relaxed">
              <code>{compiledCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
