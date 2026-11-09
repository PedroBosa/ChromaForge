/**
 * ChromaForge - Optical Accessibility Matrix & Contrast Inspector
 * 11x11 bidirectional cross-ramp contrast grid calculating simultaneous
 * APCA Lc (-108 to +106) and WCAG 2.1 ratios with live typography previews.
 * Fully responsive with educational polarity and divergence insights.
 */

import React, { useState, useMemo } from 'react';
import { useChromaStore } from '../../store/useChromaStore';
import { COLOR_STEPS, ColorStep } from '../../types/color';
import { evaluateContrast } from '../../core/color/contrast';
import { GamutCanvasPlotter } from '../gamut-map/GamutCanvasPlotter';
import {
  ShieldCheck,
  Check,
  Copy,
  Info,
} from 'lucide-react';

export const AccessibilityMatrix: React.FC = () => {
  const { ramps, activeRampId } = useChromaStore();

  // Active foreground and background ramp selections
  const [fgRampId, setFgRampId] = useState<string>(activeRampId);
  const [bgRampId, setBgRampId] = useState<string>(
    ramps.length > 1 ? ramps[ramps.length - 1].id : activeRampId
  );

  // Metric mode: APCA Lc vs WCAG 2.1
  const [metricMode, setMetricMode] = useState<'apca' | 'wcag'>('apca');

  // Selected cell for live inspection
  const [selectedPair, setSelectedPair] = useState<{
    textStep: ColorStep;
    surfaceStep: ColorStep;
  }>({
    textStep: 900,
    surfaceStep: 50,
  });

  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const fgRamp = ramps.find((r) => r.id === fgRampId) || ramps[0];
  const bgRamp = ramps.find((r) => r.id === bgRampId) || ramps[0];

  // Selected shade data
  const textShade =
    fgRamp.shades.find((s) => s.step === selectedPair.textStep) || fgRamp.shades[9];
  const surfaceShade =
    bgRamp.shades.find((s) => s.step === selectedPair.surfaceStep) || bgRamp.shades[0];

  // Evaluate contrast of the selected pair
  const activeReport = useMemo(
    () => evaluateContrast(textShade.clampedHex, surfaceShade.clampedHex),
    [textShade.clampedHex, surfaceShade.clampedHex]
  );

  // Detect genuine divergence between WCAG 2.1 and APCA
  const hasMethodologyDivergence =
    (activeReport.wcagAA && Math.abs(activeReport.apcaScore) < 45) ||
    (!activeReport.wcagAA && Math.abs(activeReport.apcaScore) >= 60);

  const handleCopySnippet = async () => {
    const css = `/* ChromaForge Accessible Pair */\ncolor: ${textShade.clampedHex}; /* ${fgRamp.name}-${textShade.step} */\nbackground-color: ${surfaceShade.clampedHex}; /* ${bgRamp.name}-${surfaceShade.step} */\n/* WCAG: ${activeReport.wcagRatio}:1 · APCA: ${activeReport.apcaScore} Lc */`;
    try {
      await navigator.clipboard.writeText(css);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-[#09090B] text-[#F4F4F6]">
      {/* ==================================================================== */}
      {/* 1. LEFT / CENTER: The 11x11 Optical Matrix Table                     */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 space-y-6 min-w-0">
        {/* Matrix Controls & Ramp Selectors Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Foreground Ramp Selector */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-zinc-500">Text:</span>
              <select
                value={fgRampId}
                onChange={(e) => setFgRampId(e.target.value)}
                className="h-8 px-2.5 rounded bg-[#131317] border border-white/[0.08] text-zinc-200 focus:outline-none focus:border-[#4F46E5] text-xs font-mono"
              >
                {ramps.map((ramp) => (
                  <option key={ramp.id} value={ramp.id}>
                    {ramp.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-zinc-600 font-mono text-xs">on</span>

            {/* Background Ramp Selector */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-zinc-500">Surface:</span>
              <select
                value={bgRampId}
                onChange={(e) => setBgRampId(e.target.value)}
                className="h-8 px-2.5 rounded bg-[#131317] border border-white/[0.08] text-zinc-200 focus:outline-none focus:border-[#4F46E5] text-xs font-mono"
              >
                {ramps.map((ramp) => (
                  <option key={ramp.id} value={ramp.id}>
                    {ramp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metric Mode Toggle (APCA Lc vs WCAG 2.1) */}
          <div className="flex items-center bg-[#131317] p-0.5 rounded border border-white/[0.07] text-xs font-mono">
            <button
              onClick={() => setMetricMode('apca')}
              className={`px-3 py-1 rounded transition-colors ${
                metricMode === 'apca'
                  ? 'bg-[#1F1F28] text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              APCA Lc (WCAG 3.0 draft)
            </button>
            <button
              onClick={() => setMetricMode('wcag')}
              className={`px-3 py-1 rounded transition-colors ${
                metricMode === 'wcag'
                  ? 'bg-[#1F1F28] text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              WCAG 2.1 Ratio
            </button>
          </div>
        </div>

        {/* The 11x11 Grid Matrix Container with Horizontal Scroll */}
        <div className="rounded-xl border border-white/[0.07] bg-[#0D0D10] p-4 overflow-x-auto shadow-sm">
          <div className="min-w-[640px]">
            {/* Column Headers (Surface Shades) */}
            <div className="grid grid-cols-12 gap-1 pb-2 border-b border-white/[0.06] text-center text-[10px] font-mono">
              <div className="text-left text-zinc-500 flex items-center pl-1">
                <span>Text \ Surf</span>
              </div>
              {COLOR_STEPS.map((step) => {
                const shade = bgRamp.shades.find((s) => s.step === step);
                return (
                  <div key={step} className="flex flex-col items-center gap-1">
                    <div
                      className="w-4 h-4 rounded-xs border border-white/20 shadow-xs"
                      style={{ backgroundColor: shade?.clampedHex }}
                      title={`Surface: ${step}`}
                    />
                    <span className="text-zinc-400 font-medium">{step}</span>
                  </div>
                );
              })}
            </div>

            {/* Matrix Rows (Text Shades) */}
            <div className="space-y-1 pt-2">
              {COLOR_STEPS.map((textStep) => {
                const tShade = fgRamp.shades.find((s) => s.step === textStep);
                return (
                  <div key={textStep} className="grid grid-cols-12 gap-1 items-center">
                    {/* Row Header */}
                    <div className="flex items-center gap-1.5 pl-1 text-[10px] font-mono">
                      <div
                        className="w-3.5 h-3.5 rounded-xs border border-white/20 shrink-0"
                        style={{ backgroundColor: tShade?.clampedHex }}
                      />
                      <span className="text-zinc-300 font-medium">{textStep}</span>
                    </div>

                    {/* 11 Surface Cells */}
                    {COLOR_STEPS.map((surfStep) => {
                      const sShade = bgRamp.shades.find((s) => s.step === surfStep);
                      if (!tShade || !sShade) return null;

                      const report = evaluateContrast(tShade.clampedHex, sShade.clampedHex);
                      const isSelected =
                        selectedPair.textStep === textStep &&
                        selectedPair.surfaceStep === surfStep;

                      let cellStyle = 'bg-zinc-900/40 text-zinc-600 border-transparent';
                      let scoreText = '';

                      if (metricMode === 'apca') {
                        const absLc = Math.abs(report.apcaScore);
                        scoreText =
                          report.apcaScore > 0
                            ? `+${report.apcaScore}`
                            : `${report.apcaScore}`;

                        if (absLc >= 90) {
                          cellStyle =
                            'bg-[#58DB91]/20 text-[#58DB91] border-[#58DB91]/30 font-semibold';
                        } else if (absLc >= 75) {
                          cellStyle =
                            'bg-[#58DB91]/10 text-[#58DB91]/90 border-[#58DB91]/20';
                        } else if (absLc >= 60) {
                          cellStyle = 'bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/25';
                        } else if (absLc >= 45) {
                          cellStyle = 'bg-cyan-500/5 text-cyan-400/80 border-cyan-500/10';
                        } else if (absLc >= 30) {
                          cellStyle = 'bg-zinc-800/30 text-zinc-500 border-white/[0.03]';
                        }
                      } else {
                        scoreText = `${report.wcagRatio}`;
                        if (report.wcagAAA) {
                          cellStyle =
                            'bg-[#58DB91]/20 text-[#58DB91] border-[#58DB91]/30 font-semibold';
                        } else if (report.wcagAA) {
                          cellStyle =
                            'bg-[#58DB91]/10 text-[#58DB91]/90 border-[#58DB91]/20';
                        } else if (report.wcagAALarge) {
                          cellStyle = 'bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/25';
                        }
                      }

                      return (
                        <button
                          key={surfStep}
                          onClick={() =>
                            setSelectedPair({ textStep, surfaceStep: surfStep })
                          }
                          className={`h-7 rounded text-[10px] font-mono border transition-all flex items-center justify-center truncate ${cellStyle} ${
                            isSelected
                              ? 'ring-2 ring-white border-white scale-105 z-10 shadow-md font-bold'
                              : 'hover:border-white/40 hover:scale-102'
                          }`}
                          title={`Text ${textStep} on Surface ${surfStep} · APCA: ${report.apcaScore} Lc · WCAG: ${report.wcagRatio}:1`}
                        >
                          {scoreText}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Matrix Legend & Educational Polarity Guide */}
        <div className="flex flex-col space-y-2 p-3 rounded-lg bg-[#0D0D10] border border-white/[0.06] text-xs font-mono">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-zinc-500 uppercase text-[10px]">Tiers:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#58DB91]/30 border border-[#58DB91]" />
                <span className="text-zinc-300">Optimal (|Lc| ≥ 90 / AAA)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#58DB91]/10 border border-[#58DB91]/30" />
                <span className="text-zinc-300">Body Text (|Lc| ≥ 75 / AA)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#22D3EE]/20 border border-[#22D3EE]" />
                <span className="text-zinc-300">Headlines / UI (|Lc| ≥ 60)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-zinc-800 border border-zinc-700" />
                <span className="text-zinc-500">Fail / Non-Text</span>
              </div>
            </div>
            <span className="text-zinc-500 text-[10px]">
              Rows: Foreground · Columns: Background
            </span>
          </div>

          <div className="pt-2 border-t border-white/[0.04] text-[10px] text-zinc-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 text-[#818CF8]" />
            <span>
              <strong>Note on APCA Polarity:</strong> Positive values (+Lc) indicate dark text on light surfaces. Negative values (-Lc) indicate light text on dark surfaces. High absolute values (|Lc| ≥ 75) mean safe readability in both polarities.
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. RIGHT SIDEBAR: Gamut Map Plotter & Contrast Pair Inspector       */}
      {/* ==================================================================== */}
      <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/[0.07] bg-[#0D0D10] flex flex-col shrink-0 overflow-y-auto">
        {/* Upper Section: Gamut Canvas Plotter */}
        <div className="p-4 border-b border-white/[0.06]">
          <GamutCanvasPlotter />
        </div>

        {/* Lower Section: Pair Contrast Inspector & Live Typography Preview */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#58DB91]" />
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-300">
                Pair Contrast Inspector
              </span>
            </div>
            <button
              onClick={handleCopySnippet}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Copy CSS Pair"
            >
              {copiedSnippet ? (
                <Check className="w-3.5 h-3.5 text-[#58DB91]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Color Pair Indicator */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-[#070709] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-zinc-500 block">Foreground (Text)</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-xs border border-white/20"
                  style={{ backgroundColor: textShade.clampedHex }}
                />
                <span className="font-semibold text-zinc-200">
                  {fgRamp.name}-{textShade.step}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 block">{textShade.clampedHex}</span>
            </div>

            <div className="p-2 rounded bg-[#070709] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-zinc-500 block">Background (Surface)</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-xs border border-white/20"
                  style={{ backgroundColor: surfaceShade.clampedHex }}
                />
                <span className="font-semibold text-zinc-200">
                  {bgRamp.name}-{surfaceShade.step}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 block">{surfaceShade.clampedHex}</span>
            </div>
          </div>

          {/* Live Typography Preview Box */}
          <div
            className="p-4 rounded-xl border border-white/[0.08] transition-colors select-none space-y-2.5 shadow-sm"
            style={{
              backgroundColor: surfaceShade.clampedHex,
              color: textShade.clampedHex,
            }}
          >
            <div className="text-base font-bold tracking-tight">
              High Contrast Typography
            </div>
            <p className="text-xs leading-relaxed opacity-95">
              ChromaForge generates uniform perceptual lightness across the entire design system using OKLCH space.
            </p>
            <div className="pt-2 flex items-center justify-between border-t border-current/15">
              <span className="text-[10px] font-mono opacity-80">
                14px Body · 18px Bold Heading
              </span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-current/30"
              >
                Sample UI Chip
              </span>
            </div>
          </div>

          {/* Contrast Diagnostic Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {/* APCA Score Card */}
            <div className="p-2.5 rounded-lg bg-[#070709] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-zinc-500">APCA Lc Score</span>
              <div className="text-base font-bold text-zinc-100">
                {activeReport.apcaScore > 0 ? `+${activeReport.apcaScore}` : activeReport.apcaScore} Lc
              </div>
              <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                <span>Polarity:</span>
                <span className="text-[#818CF8]">
                  {activeReport.polarity === 'darkOnLight' ? 'Dark on Light' : 'Light on Dark'}
                </span>
              </div>
            </div>

            {/* WCAG Ratio Card */}
            <div className="p-2.5 rounded-lg bg-[#070709] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-zinc-500">WCAG 2.1 Ratio</span>
              <div className="text-base font-bold text-zinc-100">
                {activeReport.wcagRatio}:1
              </div>
              <div className="text-[10px] flex items-center gap-1">
                <span
                  className={
                    activeReport.wcagAA ? 'text-[#58DB91]' : 'text-zinc-600'
                  }
                >
                  AA: {activeReport.wcagAA ? 'Pass' : 'Fail'}
                </span>
                <span className="text-zinc-600">·</span>
                <span
                  className={
                    activeReport.wcagAAA ? 'text-[#58DB91]' : 'text-zinc-600'
                  }
                >
                  AAA: {activeReport.wcagAAA ? 'Pass' : 'Fail'}
                </span>
              </div>
            </div>
          </div>

          {/* Divergence Insight Callout if WCAG and APCA diverge */}
          {hasMethodologyDivergence && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] font-mono space-y-1">
              <div className="font-semibold flex items-center gap-1 text-amber-300">
                <Info className="w-3.5 h-3.5" />
                <span>Methodology Divergence Detected</span>
              </div>
              <p className="text-[10px] text-amber-200/80 leading-relaxed">
                WCAG 2.1 and APCA assess this pair differently. Classical WCAG 2.1 overestimates dark-mode contrast due to simple linear offset (+0.05), whereas APCA incorporates human visual spatial frequency and black-level flare.
              </p>
            </div>
          )}

          {/* Typography Recommendation */}
          <div className="p-3 rounded-lg bg-[#131317] border border-white/[0.06] space-y-1.5 text-xs font-mono">
            <span className="text-[10px] uppercase text-zinc-400 block tracking-wider">
              Optical Guidance & Size Threshold
            </span>
            <p className="text-zinc-200 font-medium">
              {activeReport.recommendedFontSize}
            </p>
            <div className="text-[10px] text-zinc-400 pt-1 border-t border-white/[0.04]">
              {Math.abs(activeReport.apcaScore) >= 75 ? (
                <span className="text-[#58DB91]">
                  ✓ Certified safe for body text, paragraph content, and interactive controls.
                </span>
              ) : Math.abs(activeReport.apcaScore) >= 45 ? (
                <span className="text-cyan-400">
                  ℹ Safe for large headlines (18px+ bold), component borders, and icons.
                </span>
              ) : (
                <span className="text-amber-400">
                  ⚠ Inadequate contrast for running text. Use for decorative or disabled elements only.
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
