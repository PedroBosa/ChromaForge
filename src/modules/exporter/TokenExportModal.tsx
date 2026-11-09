/**
 * ChromaForge - Universal Token Export Dialog
 * Provides 1-click copying and code preview for Tailwind v4, v3, CSS variables,
 * W3C Design Tokens JSON, and TypeScript definitions.
 */

import React, { useState } from 'react';
import { useChromaStore } from '../../store/useChromaStore';
import { TokenExportFormat } from '../../types/tokens';
import { compileTokens } from '../../core/tokens/formatters';
import { X, Copy, Check, Download, FileCode } from 'lucide-react';

interface TokenExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FORMATS: { id: TokenExportFormat; label: string; ext: string }[] = [
  { id: 'tailwind-v4', label: 'Tailwind v4 @theme', ext: 'css' },
  { id: 'tailwind-v3', label: 'Tailwind v3 Config', ext: 'js' },
  { id: 'css-variables', label: 'CSS :root Variables', ext: 'css' },
  { id: 'w3c-tokens', label: 'W3C Design Tokens', ext: 'json' },
  { id: 'typescript', label: 'TypeScript Constants', ext: 'ts' },
];

export const TokenExportModal: React.FC<TokenExportModalProps> = ({ isOpen, onClose }) => {
  const { ramps, activeFormat, setActiveFormat, exportOptions, updateExportOptions } =
    useChromaStore();

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const code = compileTokens(ramps, activeFormat, exportOptions);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const currentFormat = FORMATS.find((f) => f.id === activeFormat) || FORMATS[0];
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chromaforge-tokens.${currentFormat.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-[#0D0D10] border border-white/[0.08] rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="h-14 px-5 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#0D0D10]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-secondary shadow-md shadow-primary/20 shrink-0">
              <FileCode className="h-4.5 w-4.5 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-white">
                Exportar Design Tokens
              </h2>
              <p className="text-[11px] font-mono text-zinc-500">
                100% no cliente · OKLCH Color Module 4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between gap-3 bg-zinc-950/60 flex-wrap">
          <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-lg border border-white/[0.06] overflow-x-auto no-scrollbar">
            {FORMATS.map((format) => (
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

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 cursor-pointer px-2.5 py-1 rounded-lg bg-zinc-950/80 border border-white/[0.06] hover:text-zinc-200">
              <input
                type="checkbox"
                checked={exportOptions.includeFallbackHex}
                onChange={(e) => updateExportOptions({ includeFallbackHex: e.target.checked })}
                className="rounded border-zinc-700 bg-zinc-900 text-primary accent-primary"
              />
              <span>Hex Fallback</span>
            </label>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-zinc-950/90 custom-scrollbar">
          <pre className="text-xs font-mono text-zinc-300 leading-relaxed select-all">
            <code>{code}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="h-14 px-5 border-t border-white/[0.06] flex items-center justify-between bg-[#0D0D10] shrink-0">
          <span className="text-[11px] font-mono text-zinc-500">
            {ramps.length} paletas ativas · W3C DTCG
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex h-8 items-center gap-1.5 px-3 rounded-lg text-xs font-medium text-zinc-300 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-secondary-hover" strokeWidth={1.75} />
              <span>Baixar Arquivo</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex h-8 items-center gap-1.5 px-3.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-primary to-secondary shadow-md shadow-primary/25 hover:opacity-95 transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" strokeWidth={2} />
                  <span className="text-success font-medium">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-zinc-200" strokeWidth={1.75} />
                  <span>Copiar Código</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
