/**
 * ChromaForge - Main Workbench Layout
 * High-density design tool layout (Linear/Figma/Geist aesthetic).
 * Integrates Ramp Navigator, Bézier Curve Editor, Precision Sliders,
 * the 11-step Color Swatch Strip, and deep Shade Inspector.
 * Fully responsive with collapsible sidebar and adaptive swatch grid.
 */

import React, { useState } from 'react';
import { useChromaStore } from '../../store/useChromaStore';
import { BezierCurveEditor } from '../scale-editor/BezierCurveEditor';
import { CurveParamControls } from '../scale-editor/CurveParamControls';
import { ColorShade, ColorStep } from '../../types/color';
import {
  Plus,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Check,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { formatOklchCss } from '../../core/color/conversions';

export const WorkbenchLayout: React.FC = () => {
  const {
    ramps,
    activeRampId,
    setActiveRampId,
    activeShadeStep,
    setActiveShadeStep,
    addRamp,
    removeRamp,
    duplicateRamp,
    updateRampName,
    updateRampLocked,
  } = useChromaStore();

  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [newRampName, setNewRampName] = useState('');
  const [newRampHex, setNewRampHex] = useState('#6366F1');
  const [isAddingRamp, setIsAddingRamp] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const activeRamp = ramps.find((r) => r.id === activeRampId) || ramps[0];
  const selectedShade: ColorShade =
    activeRamp.shades.find((s) => s.step === activeShadeStep) ||
    activeRamp.shades[5]; // Default to shade 500

  const handleCopyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHex(id);
      setTimeout(() => setCopiedHex(null), 1500);
    } catch {
      // fallback
    }
  };

  const handleCreateRamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRampName.trim()) return;
    addRamp(newRampName.trim(), newRampHex);
    setNewRampName('');
    setIsAddingRamp(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#09090B] text-[#F4F4F6] relative">
      {/* ==================================================================== */}
      {/* 1. LEFT SIDEBAR: Ramp Selector & Mathematical Curve Inspector        */}
      {/* ==================================================================== */}
      <aside
        className={`${
          isSidebarOpen ? 'w-84 xl:w-92' : 'w-0'
        } transition-all duration-200 ease-in-out border-r border-white/[0.08] bg-[#0D0D10] flex flex-col shrink-0 overflow-hidden select-none z-10`}
      >
        {/* Ramp List Header */}
        <div className="h-10 px-3.5 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#0D0D10]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Paletas ({ramps.length})
          </span>
          <button
            onClick={() => setIsAddingRamp(!isAddingRamp)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-primary-hover" />
            <span>Nova Paleta</span>
          </button>
        </div>

        {/* Inline Add Ramp Form */}
        {isAddingRamp && (
          <form
            onSubmit={handleCreateRamp}
            className="p-3 border-b border-white/[0.06] bg-zinc-950/60 space-y-2"
          >
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newRampHex}
                onChange={(e) => setNewRampHex(e.target.value)}
                className="w-8 h-8 rounded-lg border border-white/[0.1] bg-transparent cursor-pointer p-0 appearance-none"
              />
              <input
                type="text"
                placeholder="Nome da Paleta (ex: Warning Amber)"
                value={newRampName}
                onChange={(e) => setNewRampName(e.target.value)}
                autoFocus
                className="flex-1 h-8 px-2.5 text-xs font-mono bg-zinc-950 border border-white/[0.08] rounded-lg text-zinc-200 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingRamp(false)}
                className="px-2.5 py-1 text-xs font-mono text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-lg shadow-md shadow-primary/20 hover:opacity-95"
              >
                Adicionar
              </button>
            </div>
          </form>
        )}

        {/* Ramp List Navigation */}
        <div className="p-2 space-y-1 border-b border-white/[0.06] max-h-48 overflow-y-auto custom-scrollbar">
          {ramps.map((ramp) => {
            const isSelected = ramp.id === activeRampId;
            return (
              <div
                key={ramp.id}
                onClick={() => setActiveRampId(ramp.id)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-zinc-800/90 text-white border border-white/[0.08] shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/20 shadow-xs"
                    style={{ backgroundColor: ramp.keyHex }}
                  />
                  <span className="text-xs font-medium truncate">{ramp.name}</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateRampLocked(ramp.id, !ramp.locked);
                    }}
                    className="p-1 hover:text-white text-zinc-500 rounded-lg hover:bg-white/[0.04] transition-colors"
                    title={ramp.locked ? 'Unlock ramp' : 'Lock ramp'}
                  >
                    {ramp.locked ? (
                      <Lock className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateRamp(ramp.id);
                    }}
                    className="p-1 hover:text-white text-zinc-500 rounded-lg hover:bg-white/[0.04] transition-colors"
                    title="Duplicate ramp"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {ramps.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRamp(ramp.id);
                      }}
                      className="p-1 hover:text-rose-400 text-zinc-500 rounded-lg hover:bg-white/[0.04] transition-colors"
                      title="Delete ramp"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable Math & Curve Inspector Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <BezierCurveEditor />
          <div className="pt-4 border-t border-white/[0.06]">
            <CurveParamControls />
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* 2. CENTER STAGE: Ramp Details & 11 Swatches Strip                   */}
      {/* ==================================================================== */}
      <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 space-y-6 min-w-0">
        {/* Header Bar of Active Ramp */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] transition-colors"
              title={isSidebarOpen ? 'Recolher Painel Lateral' : 'Expandir Painel Lateral'}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4 text-primary-hover" />
              )}
            </button>

            <input
              type="text"
              value={activeRamp.name}
              onChange={(e) => updateRampName(activeRamp.id, e.target.value)}
              className="text-base font-semibold bg-transparent border-b border-transparent hover:border-white/[0.1] focus:border-primary text-zinc-100 focus:outline-none px-0.5"
            />

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-zinc-400">
                Key: {activeRamp.keyHex}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-zinc-400">
                {formatOklchCss(activeRamp.keyColor, 3)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
            <span>Cubic Bézier Interpolation</span>
            <span>·</span>
            <span className="text-success font-medium">sRGB Clamped</span>
          </div>
        </div>

        {/* 11 Shades Palette Bar (The Core Swatch Strip with Horizontal Scroll Support) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Perceptual Scale (Steps 50 — 950)
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              Click any swatch to inspect colorimetry
            </span>
          </div>

          {/* Scrollable Container so swatches are never squished */}
          <div className="overflow-x-auto pb-2 -mx-2 px-2 custom-scrollbar">
            <div className="grid grid-cols-11 gap-1.5 min-w-[760px]">
              {activeRamp.shades.map((shade) => {
                const isSelected = activeShadeStep === shade.step;
                const isDarkSwatch = shade.clampedOklch.l < 0.62;
                const textColorClass = isDarkSwatch ? 'text-white' : 'text-zinc-950';

                return (
                  <div
                    key={shade.step}
                    onClick={() => setActiveShadeStep(shade.step as ColorStep)}
                    className={`flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all bg-[#0D0D10] border ${
                      isSelected
                        ? 'border-primary ring-1 ring-primary shadow-lg shadow-primary/20 -translate-y-1'
                        : 'border-white/[0.08] hover:border-white/[0.18] hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Swatch preview */}
                    <div
                      className="h-28 w-full p-2 flex flex-col justify-between relative select-none"
                      style={{ backgroundColor: shade.clampedHex }}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-mono font-bold ${textColorClass}`}>
                          {shade.step}
                        </span>
                        {!shade.inSrgbGamut && (
                          <span
                            className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-amber-400/90 text-black shadow-xs"
                            title="Out of sRGB Gamut (Preserved in Display P3, clamped to sRGB boundary)"
                          >
                            P3
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <span
                          className={`text-[10px] font-mono font-medium opacity-90 ${textColorClass}`}
                        >
                          L: {shade.clampedOklch.l.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Swatch Metadata Card */}
                    <div className="p-2 space-y-1 bg-[#0D0D10] text-[10px] font-mono">
                      <div className="flex items-center justify-between text-zinc-300">
                        <span>{shade.clampedHex}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(shade.clampedHex, `hex-${shade.step}`);
                          }}
                          className="p-0.5 rounded text-zinc-500 hover:text-zinc-200"
                          title="Copy Hex"
                        >
                          {copiedHex === `hex-${shade.step}` ? (
                            <Check className="w-2.5 h-2.5 text-[#58DB91]" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                      </div>

                      <div className="text-[9px] text-zinc-500 truncate">
                        C:{shade.clampedOklch.c.toFixed(2)} H:{shade.clampedOklch.h.toFixed(0)}°
                      </div>

                      {/* Contrast scores against White */}
                      <div className="pt-1 border-t border-white/[0.05] flex items-center justify-between text-[9px]">
                        <span className="text-zinc-500">vs W:</span>
                        <span
                          className={`font-semibold ${
                            shade.contrastOnWhite.wcagRatio >= 4.5
                              ? 'text-[#58DB91]'
                              : shade.contrastOnWhite.wcagRatio >= 3.0
                              ? 'text-cyan-400'
                              : 'text-zinc-600'
                          }`}
                        >
                          {shade.contrastOnWhite.wcagRatio}:1
                        </span>
                      </div>

                      {/* Contrast scores against Black */}
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="text-zinc-500">vs B:</span>
                        <span
                          className={`font-semibold ${
                            shade.contrastOnBlack.wcagRatio >= 4.5
                              ? 'text-[#58DB91]'
                              : shade.contrastOnBlack.wcagRatio >= 3.0
                              ? 'text-cyan-400'
                              : 'text-zinc-600'
                          }`}
                        >
                          {shade.contrastOnBlack.wcagRatio}:1
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 3. SHADE INSPECTOR: Detailed Analysis of the Active Step            */}
        {/* ==================================================================== */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0D0D10] p-4 sm:p-5 space-y-4 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Shade Inspector — Step {selectedShade.step}
              </span>
              <span className="text-xs font-mono text-zinc-500">
                ({activeRamp.name}-{selectedShade.step})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleCopyText(
                    formatOklchCss(selectedShade.clampedOklch),
                    'copy-selected-css'
                  )
                }
                className="flex h-8 items-center gap-1.5 px-3 rounded-lg text-xs font-mono font-medium text-zinc-300 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] hover:text-white transition-colors"
              >
                {copiedHex === 'copy-selected-css' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" strokeWidth={2} />
                    <span className="text-success font-medium">Copied CSS</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
                    <span>Copy CSS OKLCH</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Colorimetry Coordinates without truncated text */}
            <div className="space-y-2 p-3.5 rounded-lg bg-zinc-950/80 border border-white/[0.06]">
              <span className="text-[11px] font-mono text-zinc-400 block uppercase">
                Colorimetric Values
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span className="text-zinc-500">Hex Code:</span>
                  <span className="text-zinc-200 font-medium">{selectedShade.clampedHex}</span>
                </div>
                {/* CSS Color 4 without truncation */}
                <div className="flex flex-col py-0.5 border-b border-white/[0.04] space-y-0.5">
                  <span className="text-zinc-500 text-[10px]">CSS Color 4 (Native):</span>
                  <span className="text-[#818CF8] text-[11px] font-mono select-all break-all">
                    {formatOklchCss(selectedShade.clampedOklch)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span className="text-zinc-500">Lightness (L):</span>
                  <span className="text-zinc-200">
                    {selectedShade.clampedOklch.l.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span className="text-zinc-500">Chroma (C):</span>
                  <span className="text-zinc-200">
                    {selectedShade.clampedOklch.c.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span className="text-zinc-500">Hue (H):</span>
                  <span className="text-zinc-200">
                    {selectedShade.clampedOklch.h.toFixed(2)}°
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-zinc-500">sRGB (0-255):</span>
                  <span className="text-zinc-400">
                    {selectedShade.rgb.r}, {selectedShade.rgb.g}, {selectedShade.rgb.b}
                  </span>
                </div>
              </div>
            </div>

            {/* Accessibility: Contrast on White */}
            <div className="space-y-2 p-3.5 rounded-lg bg-zinc-950/80 border border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400 uppercase">
                  Contraste em Branco (#FFFFFF)
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    selectedShade.contrastOnWhite.wcagRatio >= 4.5
                      ? 'bg-success/10 text-success border border-success/20'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {selectedShade.contrastOnWhite.wcagRatio >= 4.5 ? 'WCAG AA Pass' : 'Baixo Contraste'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span className="text-zinc-500">Razão WCAG 2.1:</span>
                  <span className="text-zinc-200 font-medium">
                    {selectedShade.contrastOnWhite.wcagRatio}:1
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span className="text-zinc-500">Score APCA (Lc):</span>
                  <span className="text-zinc-200 font-medium">
                    {selectedShade.contrastOnWhite.apcaScore > 0 ? `+${selectedShade.contrastOnWhite.apcaScore}` : selectedShade.contrastOnWhite.apcaScore} Lc
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span className="text-zinc-500">Texto Normal (AA):</span>
                  <span
                    className={
                      selectedShade.contrastOnWhite.wcagRatio >= 4.5
                        ? 'text-success'
                        : 'text-zinc-600'
                    }
                  >
                    {selectedShade.contrastOnWhite.wcagRatio >= 4.5 ? 'Aprovado (4.5:1)' : 'Reprovado'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-zinc-500">Texto Grande / UI:</span>
                  <span
                    className={
                      selectedShade.contrastOnWhite.wcagRatio >= 3.0
                        ? 'text-success'
                        : 'text-zinc-600'
                    }
                  >
                    {selectedShade.contrastOnWhite.wcagRatio >= 3.0 ? 'Aprovado (3.0:1)' : 'Reprovado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Accessibility: Contrast on Black with Educational Insight */}
            <div className="space-y-2 p-3.5 rounded-lg bg-zinc-950/80 border border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400 uppercase">
                  Contraste em Escuro (#000000)
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    selectedShade.contrastOnBlack.wcagRatio >= 4.5
                      ? 'bg-success/10 text-success border border-success/20'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {selectedShade.contrastOnBlack.wcagRatio >= 4.5 ? 'WCAG AA Pass' : 'Baixo Contraste'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span className="text-zinc-500">Razão WCAG 2.1:</span>
                  <span className="text-zinc-200 font-medium">
                    {selectedShade.contrastOnBlack.wcagRatio}:1
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span className="text-zinc-500">Score APCA (Lc):</span>
                  <span className="text-zinc-200 font-medium">
                    {selectedShade.contrastOnBlack.apcaScore} Lc
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span className="text-zinc-500">Texto Normal (AA):</span>
                  <span
                    className={
                      selectedShade.contrastOnBlack.wcagRatio >= 4.5
                        ? 'text-success'
                        : 'text-zinc-600'
                    }
                  >
                    {selectedShade.contrastOnBlack.wcagRatio >= 4.5 ? 'Aprovado (4.5:1)' : 'Reprovado'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-zinc-500">Texto Grande / UI:</span>
                  <span
                    className={
                      selectedShade.contrastOnBlack.wcagRatio >= 3.0
                        ? 'text-success'
                        : 'text-zinc-600'
                    }
                  >
                    {selectedShade.contrastOnBlack.wcagRatio >= 3.0 ? 'Aprovado (3.0:1)' : 'Reprovado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Token Snippet at the bottom */}
        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-zinc-950/80 flex items-center justify-between text-xs font-mono flex-wrap gap-2">
          <div className="flex items-center gap-2 truncate text-zinc-400">
            <span className="text-primary-hover font-semibold">Tailwind v4:</span>
            <span className="truncate select-all text-zinc-200">
              --color-{activeRamp.name.toLowerCase().replace(/\s+/g, '-')}-{selectedShade.step}:{' '}
              {formatOklchCss(selectedShade.clampedOklch)};
            </span>
          </div>
          <button
            onClick={() =>
              handleCopyText(
                `--color-${activeRamp.name.toLowerCase().replace(/\s+/g, '-')}-${selectedShade.step}: ${formatOklchCss(selectedShade.clampedOklch)};`,
                'copy-quick-token'
              )}
            className="flex h-8 items-center gap-1.5 px-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/[0.16] text-xs font-medium transition-colors shrink-0 ml-auto"
          >
            {copiedHex === 'copy-quick-token' ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" strokeWidth={2} />
                <span className="text-success font-medium">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
                <span>Copiar Token</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};
