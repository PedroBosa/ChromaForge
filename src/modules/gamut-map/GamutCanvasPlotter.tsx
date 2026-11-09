/**
 * ChromaForge - 2D Canvas Gamut Plotter (Refactored & Anti-Collision)
 * High-performance Canvas 2D visualization of the Oklab (a, b) chromaticity plane.
 * - Dynamic adaptive auto-zoom ('Fit' for neutral/low-chroma ramps, '1x' for wide gamut).
 * - Full reference envelope (dashed) + active lightness slice (filled).
 * - Anti-collision coordinate labeling: radial chroma markers along diagonal (45°),
 *   cardinal axes along orthogonal crosshairs, and intelligent point label offsets.
 * - Focused vector clamping on the active shade to prevent stacked line clutter.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useChromaStore } from '../../store/useChromaStore';
import { ColorShade, ColorStep } from '../../types/color';
import {
  isOklchInP3Gamut,
  isOklchInSrgbGamut,
  oklchToOklab,
} from '../../core/color/conversions';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface GamutPoint {
  a: number;
  b: number;
}

export const GamutCanvasPlotter: React.FC = () => {
  const { ramps, activeRampId, activeShadeStep, setActiveShadeStep } = useChromaStore();
  const activeRamp = ramps.find((r) => r.id === activeRampId) || ramps[0];
  const selectedShade: ColorShade =
    activeRamp.shades.find((s) => s.step === activeShadeStep) || activeRamp.shades[5];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [plotMode, setPlotMode] = useState<'slice' | 'envelope'>('slice');
  const [zoomMode, setZoomMode] = useState<'fit' | 'full'>('full');
  const [hoveredStep, setHoveredStep] = useState<ColorStep | null>(null);

  // Dynamic axis range: in 'fit' mode, zoom in to display subtle neutral shifts
  const maxChromaInRamp = Math.max(...activeRamp.shades.map((s) => s.clampedOklch.c));
  const maxAxis = zoomMode === 'fit' ? Math.max(0.08, maxChromaInRamp * 1.5) : 0.32;

  /**
   * Calculates the gamut boundary polygon in (a, b) space for a given lightness L
   * using binary search on chroma across 72 radial angles (every 5 degrees).
   */
  const computeGamutPolygon = useCallback(
    (lightness: number, isP3: boolean): GamutPoint[] => {
      const points: GamutPoint[] = [];
      const numAngles = 72;
      const angleStep = 360 / numAngles;

      for (let i = 0; i < numAngles; i++) {
        const deg = i * angleStep;
        const rad = (deg * Math.PI) / 180;

        let lowC = 0.0;
        let highC = 0.45;

        for (let iter = 0; iter < 9; iter++) {
          const midC = (lowC + highC) / 2;
          const testOklch = { l: lightness, c: midC, h: deg };
          const inGamut = isP3 ? isOklchInP3Gamut(testOklch) : isOklchInSrgbGamut(testOklch);

          if (inGamut) {
            lowC = midC;
          } else {
            highC = midC;
          }
        }

        points.push({
          a: lowC * Math.cos(rad),
          b: lowC * Math.sin(rad),
        });
      }

      return points;
    },
    []
  );

  // Draw the Gamut Plot on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI display scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = (Math.min(width, height) * 0.44) / maxAxis;

    const toCanvasX = (a: number) => centerX + a * scale;
    const toCanvasY = (b: number) => centerY - b * scale;

    // 1. Clear & Background
    ctx.fillStyle = '#070709';
    ctx.fillRect(0, 0, width, height);

    // 2. Technical Radial & Orthogonal Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Dynamic ring intervals based on zoom
    const ringSteps = zoomMode === 'fit' ? [0.02, 0.05, 0.1] : [0.1, 0.2, 0.3];
    ringSteps.forEach((radiusC) => {
      if (radiusC * scale <= Math.min(width, height) * 0.48) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radiusC * scale, 0, Math.PI * 2);
        ctx.stroke();

        // Place chroma labels along 45° diagonal to avoid collision with cardinal axes!
        const diagOffset = (radiusC * scale) / Math.SQRT2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillText(`C:${radiusC.toFixed(2)}`, centerX + diagOffset + 2, centerY - diagOffset - 2);
      }
    });

    // Crosshairs (a=0, b=0)
    ctx.beginPath();
    ctx.moveTo(centerX, 12);
    ctx.lineTo(centerX, height - 12);
    ctx.moveTo(12, centerY);
    ctx.lineTo(width - 12, centerY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Axis Labels with safe padding
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('+b (Yellow)', centerX + 6, 14);
    ctx.fillText('-b (Blue)', centerX + 6, height - 6);
    ctx.fillText('-a (Green)', 12, centerY - 6);
    ctx.fillText('+a (Red)', width - 52, centerY - 6);

    // 3. Draw Outer Reference Envelope (Max Gamut at L = 0.65) in subtle dotted line
    // This gives context so the user understands the full volume even when slice is dark
    if (plotMode === 'slice') {
      const refPolygon = computeGamutPolygon(0.65, false);
      if (refPolygon.length > 0) {
        ctx.beginPath();
        ctx.moveTo(toCanvasX(refPolygon[0].a), toCanvasY(refPolygon[0].b));
        for (let i = 1; i < refPolygon.length; i++) {
          ctx.lineTo(toCanvasX(refPolygon[i].a), toCanvasY(refPolygon[i].b));
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    const targetLightness =
      plotMode === 'slice' ? selectedShade.clampedOklch.l : 0.65;

    // 4. Draw Display P3 Boundary
    const p3Polygon = computeGamutPolygon(targetLightness, true);
    if (p3Polygon.length > 0) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(p3Polygon[0].a), toCanvasY(p3Polygon[0].b));
      for (let i = 1; i < p3Polygon.length; i++) {
        ctx.lineTo(toCanvasX(p3Polygon[i].a), toCanvasY(p3Polygon[i].b));
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(157, 78, 221, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(199, 125, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Draw sRGB Boundary
    const srgbPolygon = computeGamutPolygon(targetLightness, false);
    if (srgbPolygon.length > 0) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(srgbPolygon[0].a), toCanvasY(srgbPolygon[0].b));
      for (let i = 1; i < srgbPolygon.length; i++) {
        ctx.lineTo(toCanvasX(srgbPolygon[i].a), toCanvasY(srgbPolygon[i].b));
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(79, 70, 229, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 6. Connect Ramp Points with Smooth Trajectory
    const rampCoords = activeRamp.shades.map((shade) => {
      const oklab = oklchToOklab(shade.clampedOklch);
      const rawOklab = oklchToOklab(shade.oklch);
      return {
        step: shade.step,
        x: toCanvasX(oklab.a),
        y: toCanvasY(oklab.b),
        rawX: toCanvasX(rawOklab.a),
        rawY: toCanvasY(rawOklab.b),
        isClipped: !shade.inSrgbGamut,
        hex: shade.clampedHex,
        l: shade.clampedOklch.l,
        c: shade.clampedOklch.c,
        h: shade.clampedOklch.h,
      };
    });

    ctx.beginPath();
    ctx.moveTo(rampCoords[0].x, rampCoords[0].y);
    for (let i = 1; i < rampCoords.length; i++) {
      ctx.lineTo(rampCoords[i].x, rampCoords[i].y);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 7. Draw Points & Clamping Vectors (Focused to avoid line clutter)
    rampCoords.forEach((pt) => {
      const isSelected = activeShadeStep === pt.step;
      const isHovered = hoveredStep === pt.step;

      // Draw vector clamping ONLY for the selected or hovered shade to avoid line mess!
      if (pt.isClipped && (isSelected || isHovered)) {
        ctx.beginPath();
        ctx.moveTo(pt.rawX, pt.rawY);
        ctx.lineTo(pt.x, pt.y);
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target unclipped point (hollow ring)
        ctx.beginPath();
        ctx.arc(pt.rawX, pt.rawY, 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (pt.isClipped) {
        // Discrete small indicator for other clamped points
        ctx.beginPath();
        ctx.arc(pt.rawX, pt.rawY, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.fill();
      }

      // Clamped in-gamut point
      ctx.beginPath();
      const radius = isSelected ? 6.5 : isHovered ? 5.5 : 4;
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = pt.hex;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#FFFFFF' : 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Intelligent Label Placement with Anti-Collision:
      // - Step 50: place above-left
      // - Step 950: place below-right
      // - Selected / Hovered: place with priority
      if (isSelected || isHovered) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillText(String(pt.step), pt.x + 8, pt.y - 4);
      } else if (pt.step === 50) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText('50', pt.x - 14, pt.y - 6);
      } else if (pt.step === 950) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText('950', pt.x + 6, pt.y + 10);
      } else if (pt.step === 500) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText('500', pt.x + 8, pt.y - 4);
      }
    });
  }, [
    activeRamp,
    selectedShade,
    plotMode,
    zoomMode,
    maxAxis,
    activeShadeStep,
    hoveredStep,
    computeGamutPolygon,
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = (Math.min(width, height) * 0.44) / maxAxis;

    let closestStep: ColorStep | null = null;
    let minDistance = 24;

    activeRamp.shades.forEach((shade) => {
      const oklab = oklchToOklab(shade.clampedOklch);
      const ptX = centerX + oklab.a * scale;
      const ptY = centerY - oklab.b * scale;

      const dist = Math.hypot(clickX - ptX, clickY - ptY);
      if (dist < minDistance) {
        minDistance = dist;
        closestStep = shade.step;
      }
    });

    if (closestStep) {
      setActiveShadeStep(closestStep);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = (Math.min(width, height) * 0.44) / maxAxis;

    let closestStep: ColorStep | null = null;
    let minDistance = 18;

    activeRamp.shades.forEach((shade) => {
      const oklab = oklchToOklab(shade.clampedOklch);
      const ptX = centerX + oklab.a * scale;
      const ptY = centerY - oklab.b * scale;

      const dist = Math.hypot(mouseX - ptX, mouseY - ptY);
      if (dist < minDistance) {
        minDistance = dist;
        closestStep = shade.step;
      }
    });

    setHoveredStep(closestStep);
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col rounded-xl border border-white/[0.08] bg-[#0D0D10] overflow-hidden shadow-2xl"
    >
      {/* Plotter Header: Flexible padding and safe layout */}
      <div className="py-2.5 px-3.5 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#0D0D10] gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 truncate">
            Gamut Chromaticity
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-zinc-400 shrink-0">
            L: {selectedShade.clampedOklch.l.toFixed(3)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Zoom Toggle */}
          <button
            onClick={() => setZoomMode(zoomMode === 'full' ? 'fit' : 'full')}
            className={`flex items-center gap-1 h-7 px-2 text-[10px] font-mono rounded-[6px] border transition-all ${
              zoomMode === 'fit'
                ? 'border-white/[0.08] bg-zinc-800 text-primary-hover font-semibold shadow-sm'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
            title={zoomMode === 'fit' ? 'Reset to Full Gamut' : 'Auto-Fit Zoom'}
          >
            {zoomMode === 'fit' ? <ZoomOut className="w-3 h-3" /> : <ZoomIn className="w-3 h-3" />}
            <span>{zoomMode === 'fit' ? 'Fit' : '1x'}</span>
          </button>

          {/* Mode Selector */}
          <div className="flex items-center gap-1 bg-zinc-950/80 p-0.5 rounded-lg border border-white/[0.06] text-[10px] font-mono">
            <button
              onClick={() => setPlotMode('slice')}
              className={`px-2 py-1 rounded-[6px] transition-all border whitespace-nowrap ${
                plotMode === 'slice'
                  ? 'border-white/[0.08] bg-zinc-800/90 text-white shadow-sm font-medium'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              Slice @ {selectedShade.step}
            </button>
            <button
              onClick={() => setPlotMode('envelope')}
              className={`px-2 py-1 rounded-[6px] transition-all border whitespace-nowrap ${
                plotMode === 'envelope'
                  ? 'border-white/[0.08] bg-zinc-800/90 text-white shadow-sm font-medium'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              Mid L:0.65
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative p-2 bg-[#09090B] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredStep(null)}
          className="w-full h-[270px] cursor-crosshair block rounded-lg select-none"
        />
      </div>

      {/* Clean Bottom Legend Strip */}
      <div className="px-3.5 py-2 border-t border-white/[0.06] bg-[#0D0D10] flex items-center justify-between text-[10px] font-mono flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-[#6366F1] rounded-xs" />
            <span className="text-zinc-400">sRGB</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 border-t border-dashed border-[#C77DFF]" />
            <span className="text-zinc-400">P3</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="text-zinc-400">Ramp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-amber-400" />
            <span className="text-amber-400">Clamped</span>
          </div>
        </div>

        <span
          className={
            selectedShade.inSrgbGamut
              ? 'text-[#58DB91]'
              : selectedShade.inP3Gamut
              ? 'text-amber-400'
              : 'text-rose-400'
          }
        >
          {selectedShade.inSrgbGamut
            ? '✓ In sRGB'
            : selectedShade.inP3Gamut
            ? '⚠️ Clamped to sRGB'
            : 'Out of Gamut'}
        </span>
      </div>
    </div>
  );
};
