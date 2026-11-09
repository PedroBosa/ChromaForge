/**
 * ChromaForge - 2D Canvas Gamut Plotter
 * High-performance Canvas 2D visualization of the Oklab (a, b) chromaticity plane.
 * Features adaptive auto-zoom for low-chroma neutral ramps, real-time binary search
 * gamut boundaries (sRGB & Display P3), and non-obstructive technical legends.
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
  const maxAxis = zoomMode === 'fit' ? Math.max(0.08, maxChromaInRamp * 1.45) : 0.32;

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

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(`C:${radiusC.toFixed(2)}`, centerX + radiusC * scale + 3, centerY - 3);
      }
    });

    // Crosshairs (a=0, b=0)
    ctx.beginPath();
    ctx.moveTo(centerX, 10);
    ctx.lineTo(centerX, height - 10);
    ctx.moveTo(10, centerY);
    ctx.lineTo(width - 10, centerY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('+b (Yellow)', centerX + 6, 16);
    ctx.fillText('-b (Blue)', centerX + 6, height - 8);
    ctx.fillText('-a (Green)', 12, centerY - 6);
    ctx.fillText('+a (Red)', width - 58, centerY - 6);

    const targetLightness =
      plotMode === 'slice' ? selectedShade.clampedOklch.l : 0.65;

    // 3. Draw Display P3 Boundary
    const p3Polygon = computeGamutPolygon(targetLightness, true);
    if (p3Polygon.length > 0) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(p3Polygon[0].a), toCanvasY(p3Polygon[0].b));
      for (let i = 1; i < p3Polygon.length; i++) {
        ctx.lineTo(toCanvasX(p3Polygon[i].a), toCanvasY(p3Polygon[i].b));
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(157, 78, 221, 0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(199, 125, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Draw sRGB Boundary
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

    // 5. Connect Ramp Points with Smooth Trajectory
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

    // 6. Draw Vector Clamping Lines & Points
    rampCoords.forEach((pt) => {
      const isSelected = activeShadeStep === pt.step;
      const isHovered = hoveredStep === pt.step;

      if (pt.isClipped) {
        ctx.beginPath();
        ctx.moveTo(pt.rawX, pt.rawY);
        ctx.lineTo(pt.x, pt.y);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(pt.rawX, pt.rawY, 3.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.beginPath();
      const radius = isSelected ? 6.5 : isHovered ? 5.5 : 4;
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = pt.hex;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#FFFFFF' : 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      if (pt.step === 50 || pt.step === 500 || pt.step === 950 || isSelected || isHovered) {
        ctx.fillStyle = isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(String(pt.step), pt.x + 6, pt.y - 4);
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
      className="flex flex-col rounded-xl border border-white/[0.07] bg-[#0D0D10] overflow-hidden"
    >
      {/* Plotter Header */}
      <div className="h-10 px-3.5 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#131317]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">
            Gamut Chromaticity (Oklab a-b)
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.04]">
            L: {selectedShade.clampedOklch.l.toFixed(3)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Zoom Toggle */}
          <button
            onClick={() => setZoomMode(zoomMode === 'full' ? 'fit' : 'full')}
            className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded border transition-colors ${
              zoomMode === 'fit'
                ? 'bg-[#1F1F28] text-[#818CF8] border-[#818CF8]/40 font-semibold'
                : 'text-zinc-400 border-white/[0.06] hover:bg-white/[0.04]'
            }`}
            title={zoomMode === 'fit' ? 'Reset to Full Gamut' : 'Auto-Fit Zoom (Great for neutral/low-chroma ramps)'}
          >
            {zoomMode === 'fit' ? <ZoomOut className="w-3 h-3" /> : <ZoomIn className="w-3 h-3" />}
            <span>{zoomMode === 'fit' ? 'Fit Zoom' : '1x Zoom'}</span>
          </button>

          {/* Mode Selector */}
          <div className="flex items-center bg-[#070709] p-0.5 rounded border border-white/[0.06] text-[10px] font-mono">
            <button
              onClick={() => setPlotMode('slice')}
              className={`px-2 py-0.5 rounded transition-colors ${
                plotMode === 'slice'
                  ? 'bg-[#1F1F28] text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Slice @ {selectedShade.step}
            </button>
            <button
              onClick={() => setPlotMode('envelope')}
              className={`px-2 py-0.5 rounded transition-colors ${
                plotMode === 'envelope'
                  ? 'bg-[#1F1F28] text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Mid L:0.65
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative p-2 bg-[#070709] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredStep(null)}
          className="w-full h-[270px] cursor-crosshair block rounded-lg select-none"
        />
      </div>

      {/* Clean Bottom Legend Strip (Non-obtrusive, doesn't block the canvas) */}
      <div className="px-3 py-1.5 border-t border-white/[0.06] bg-[#0A0A0D] flex items-center justify-between text-[10px] font-mono flex-wrap gap-2">
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
