/**
 * ChromaForge - App Shell TopBar
 * Standardized to QRCraft benchmark anatomy:
 * h-14 height, brand badge, tactile segmented view switcher, unified action toolbar, and repo link.
 */

import React, { useState } from 'react';
import { useChromaStore } from '../../store/useChromaStore';
import {
  Sparkles,
  Sliders,
  ShieldCheck,
  Box,
  Code2,
  Share2,
  Check,
  RotateCcw,
  FileCode,
} from 'lucide-react';
import { TokenExportModal } from '../exporter/TokenExportModal';
import { StudioViewMode } from '../../types/store';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const TopBar: React.FC = () => {
  const {
    paletteName,
    setPaletteName,
    activeView,
    setActiveView,
    getSerializedUrl,
    resetToDefaults,
  } = useChromaStore();

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const handleShare = async () => {
    try {
      const url = getSerializedUrl();
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // fallback
    }
  };

  const navItems: {
    id: StudioViewMode;
    label: string;
    shortLabel: string;
    icon: React.ElementType;
  }[] = [
    { id: 'workbench', label: 'Workbench', shortLabel: 'Studio', icon: Sliders },
    { id: 'matrix', label: 'Accessibility APCA', shortLabel: 'APCA', icon: ShieldCheck },
    { id: 'preview', label: 'Live Preview', shortLabel: 'Preview', icon: Box },
    { id: 'tokens', label: 'Tokens', shortLabel: 'Tokens', icon: Code2 },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#09090B]/80 backdrop-blur-md">
        <div className="flex h-14 w-full items-center justify-between px-3 sm:px-4 select-none gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-secondary shadow-md shadow-primary/20 shrink-0">
              <Sparkles className="h-4.5 w-4.5 text-white" strokeWidth={2} />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">ChromaForge</span>
              <span className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-medium text-zinc-400">
                OKLCH
              </span>
            </div>

            <span className="text-zinc-600 text-xs hidden sm:inline mx-0.5">/</span>

            {isEditingName ? (
              <input
                type="text"
                value={paletteName}
                onChange={(e) => setPaletteName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                autoFocus
                className="h-7 px-2 text-xs font-mono bg-zinc-950 border border-white/[0.1] rounded-lg text-zinc-200 focus:outline-none focus:border-primary max-w-[130px]"
              />
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="text-xs text-zinc-400 font-mono hover:text-zinc-200 px-1.5 py-1 rounded-lg hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-colors truncate max-w-[110px] sm:max-w-none"
                title="Renomear paleta"
              >
                {paletteName}
              </button>
            )}
          </div>

          {/* Center: View Switcher (Segmented Control) */}
          <nav className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-zinc-950/80 p-1 shrink-0 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center gap-1.5 rounded-[6px] px-2.5 sm:px-3 py-1 text-xs font-medium transition-all border whitespace-nowrap ${
                    isActive
                      ? 'border-white/[0.08] bg-zinc-800/90 text-white shadow-sm'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                  title={item.label}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-primary-hover' : 'text-zinc-500'}`} strokeWidth={isActive ? 2 : 1.75} />
                  <span className="hidden md:inline">{item.label}</span>
                  <span className="md:hidden">{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Global Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Share URL (Zero-Backend) */}
            <button
              onClick={handleShare}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 sm:px-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white"
              title="Compartilhar Link (Zero-Backend)"
            >
              {copiedUrl ? (
                <>
                  <Check className="h-4 w-4 text-success shrink-0" strokeWidth={2} />
                  <span className="text-success font-medium hidden sm:inline">Copiado</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 text-zinc-400 shrink-0" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Compartilhar</span>
                </>
              )}
            </button>

            {/* Reset Defaults */}
            <button
              onClick={resetToDefaults}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-colors hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white"
              title="Resetar paleta para padrões"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
            </button>

            {/* Export Tokens Dialog CTA */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary px-2.5 sm:px-3 text-xs font-semibold text-white shadow-md shadow-primary/25 hover:opacity-95 transition-all"
            >
              <FileCode className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="hidden sm:inline">Exportar Tokens</span>
              <span className="sm:hidden">Tokens</span>
            </button>

            <div className="h-4 w-[1px] bg-white/[0.08] mx-0.5 hidden sm:block" />

            {/* GitHub Repo */}
            <a
              href="https://github.com/PedroBosa/ChromaForge"
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-colors hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white"
              title="Ver no GitHub (Repositório Oficial)"
            >
              <GithubIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Token Export Dialog */}
      <TokenExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </>
  );
};
