/**
 * ChromaForge - App Shell TopBar
 * High-density header with Linear/Geist aesthetic, view modes, and zero-backend URL sharing.
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

  const navItems: { id: StudioViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'workbench', label: 'Workbench', icon: Sliders },
    { id: 'matrix', label: 'Accessibility APCA', icon: ShieldCheck },
    { id: 'preview', label: 'Live Preview', icon: Box },
    { id: 'tokens', label: 'Tokens', icon: Code2 },
  ];

  return (
    <>
      <header className="h-12 border-b border-white/[0.07] px-4 flex items-center justify-between shrink-0 bg-[#0D0D10] select-none z-20">
        {/* Left: Branding & Palette Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-[#4F46E5] to-[#9D4EDD] flex items-center justify-center shadow-xs shadow-[#4F46E5]/40">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-xs tracking-wider uppercase text-zinc-200">
              ChromaForge
            </span>
          </div>

          <span className="text-zinc-600 text-xs">/</span>

          {isEditingName ? (
            <input
              type="text"
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              autoFocus
              className="h-6 px-1.5 text-xs font-mono bg-zinc-950 border border-white/[0.1] rounded text-zinc-200 focus:outline-none focus:border-[#4F46E5]"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-xs text-zinc-400 font-mono hover:text-zinc-200 px-1 py-0.5 rounded hover:bg-white/[0.04] transition-colors"
              title="Click to rename palette"
            >
              {paletteName}
            </button>
          )}

          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-500 border border-white/[0.04]">
            OKLCH Studio
          </span>
        </div>

        {/* Center: View Switcher (Segmented Control h-8) */}
        <nav className="flex items-center bg-[#131317] p-0.5 rounded-lg border border-white/[0.07]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  isActive
                    ? 'bg-[#1F1F28] text-white shadow-xs border border-white/[0.08]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Share URL (Zero-Backend) */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-mono text-zinc-300 bg-[#141418] hover:bg-[#1C1C24] border border-white/[0.07] transition-colors"
            title="Copy shareable zero-backend URL"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#58DB91]" />
                <span className="text-[#58DB91]">Copied URL</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Share</span>
              </>
            )}
          </button>

          {/* Reset Defaults */}
          <button
            onClick={resetToDefaults}
            className="h-8 w-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-200 bg-[#141418] hover:bg-[#1C1C24] border border-white/[0.07] transition-colors"
            title="Reset to default palette"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Export Tokens Dialog */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-mono font-medium text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-colors shadow-sm shadow-[#4F46E5]/20"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Export Tokens</span>
          </button>
        </div>
      </header>

      {/* Token Export Dialog */}
      <TokenExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </>
  );
};
