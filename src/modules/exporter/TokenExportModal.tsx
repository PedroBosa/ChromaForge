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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-[#0D0D10] border border-white/[0.08] rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="h-12 px-4 border-b border-white/[0.07] flex items-center justify-between shrink-0 bg-[#131317]">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[#818CF8]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Export Design Tokens
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="p-3 border-b border-white/[0.06] flex items-center justify-between gap-3 bg-[#0A0A0D] flex-wrap">
          <div className="flex items-center gap-1 bg-[#131317] p-0.5 rounded border border-white/[0.06]">
            {FORMATS.map((format) => (
              <button
                key={format.id}
                onClick={() => setActiveFormat(format.id)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  activeFormat === format.id
                    ? 'bg-[#1F1F28] text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {format.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={exportOptions.includeFallbackHex}
                onChange={(e) => updateExportOptions({ includeFallbackHex: e.target.checked })}
                className="rounded border-zinc-700 bg-zinc-900 text-[#4F46E5] accent-[#4F46E5]"
              />
              <span>Hex Fallback</span>
            </label>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-[#070709]">
          <pre className="text-xs font-mono text-zinc-300 leading-relaxed select-all">
            <code>{code}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="h-12 px-4 border-t border-white/[0.07] flex items-center justify-between bg-[#0D0D10] shrink-0">
          <span className="text-[11px] font-mono text-zinc-500">
            {ramps.length} color ramps · 100% Client-side OKLCH
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-zinc-300 bg-[#18181E] hover:bg-[#22222B] border border-white/[0.06] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-colors shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#58DB91]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
