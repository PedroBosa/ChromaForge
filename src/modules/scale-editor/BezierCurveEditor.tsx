/**
 * ChromaForge - Interactive SVG Cubic Bézier Curve Editor
 * High-density design tool component representing the parametric space [0, 1] x [0, 1].
 * Provides real-time interactive manipulation of handles P1 and P2 with pointer capture.
 */

import React, { useRef, useState, useCallback } from 'react';
import { useChromaStore } from '../../store/useChromaStore';
import { solveCubicBezierY } from '../../core/color/bezier';
import { BezierPoint } from '../../types/color';

interface PresetCurve {
  name: string;
  p1: BezierPoint;
  p2: BezierPoint;
}

const PRESETS: PresetCurve[] = [
  { name: 'S-Curve', p1: [0.35, 0.1], p2: [0.65, 0.9] },
  { name: 'Linear', p1: [0.33, 0.33], p2: [0.67, 0.67] },
  { name: 'Ease-In', p1: [0.42, 0.0], p2: [1.0, 1.0] },
  { name: 'Ease-Out', p1: [0.0, 0.0], p2: [0.58, 1.0] },
  { name: 'Steep', p1: [0.2, 0.0], p2: [0.8, 1.0] },
];

export const BezierCurveEditor: React.FC = () => {
  const { ramps, activeRampId, updateRampCurveConfig, activeShadeStep, setActiveShadeStep } =
    useChromaStore();

  const activeRamp = ramps.find((r) => r.id === activeRampId) || ramps[0];
  const { lightnessP1, lightnessP2 } = activeRamp.curveConfig;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<'p1' | 'p2' | null>(null);

  // SVG coordinate configuration
  const size = 220; // Plotting canvas dimension
  const padding = 16;
  const viewBoxSize = size + padding * 2;

  // Coordinate transformation:
  // Math space [0, 1] x [0, 1] where (0,0) is bottom-left, (1,1) is top-right.
  // SVG space: X goes 0 -> size, Y goes size -> 0 (inverted).
  const mathToSvg = useCallback(
    (point: BezierPoint): [number, number] => {
      const x = padding + point[0] * size;
      const y = padding + (1 - point[1]) * size;
      return [x, y];
    },
    [size, padding]
  );

  const svgToMath = useCallback(
    (clientX: number, clientY: number): BezierPoint => {
      if (!svgRef.current) return [0, 0];
      const rect = svgRef.current.getBoundingClientRect();
      const rawX = (clientX - rect.left - padding) / size;
      const rawY = 1 - (clientY - rect.top - padding) / size;

      const clampedX = Math.max(0, Math.min(1, Number(rawX.toFixed(3))));
      const clampedY = Math.max(0, Math.min(1, Number(rawY.toFixed(3))));

      return [clampedX, clampedY];
    },
    [size, padding]
  );

  const handlePointerDown = (handle: 'p1' | 'p2', e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingHandle(handle);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingHandle) return;
    const newCoords = svgToMath(e.clientX, e.clientY);

    if (draggingHandle === 'p1') {
      updateRampCurveConfig(activeRamp.id, { lightnessP1: newCoords });
    } else if (draggingHandle === 'p2') {
      updateRampCurveConfig(activeRamp.id, { lightnessP2: newCoords });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingHandle) {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture already released
      }
      setDraggingHandle(null);
    }
  };

  // Convert points to SVG coordinates
  const p0Svg = mathToSvg([0, 0]);
  const p1Svg = mathToSvg(lightnessP1);
  const p2Svg = mathToSvg(lightnessP2);
  const p3Svg = mathToSvg([1, 1]);

  // Construct SVG cubic path: M P0 C P1 P2 P3
  const bezierPathD = `M ${p0Svg[0]} ${p0Svg[1]} C ${p1Svg[0]} ${p1Svg[1]}, ${p2Svg[0]} ${p2Svg[1]}, ${p3Svg[0]} ${p3Svg[1]}`;

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
          Lightness Easing (Bézier)
        </span>
        <span className="text-[10px] font-mono text-zinc-500">
          t: [0, 1] → L
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex items-center justify-center p-2 rounded-lg bg-[#070709] border border-white/[0.07]">
        <svg
          ref={svgRef}
          width={viewBoxSize}
          height={viewBoxSize}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="select-none touch-none overflow-visible"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <defs>
            {/* Subtle grid pattern */}
            <pattern id="bezierGrid" width={size / 4} height={size / 4} patternUnits="userSpaceOnUse">
              <path
                d={`M ${size / 4} 0 L 0 0 0 ${size / 4}`}
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect
            x={padding}
            y={padding}
            width={size}
            height={size}
            fill="url(#bezierGrid)"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
            rx="4"
          />

          {/* Linear Reference Diagonal */}
          <line
            x1={p0Svg[0]}
            y1={p0Svg[1]}
            x2={p3Svg[0]}
            y2={p3Svg[1]}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Tangent Handle Line P0 -> P1 */}
          <line
            x1={p0Svg[0]}
            y1={p0Svg[1]}
            x2={p1Svg[0]}
            y2={p1Svg[1]}
            stroke="#6366F1"
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />

          {/* Tangent Handle Line P3 -> P2 */}
          <line
            x1={p3Svg[0]}
            y1={p3Svg[1]}
            x2={p2Svg[0]}
            y2={p2Svg[1]}
            stroke="#C77DFF"
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />

          {/* The Main Cubic Bézier Curve */}
          <path
            d={bezierPathD}
            fill="none"
            stroke="#F4F4F6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Interpolated 11 Shades Markers along the Curve */}
          {activeRamp.shades.map((shade, i) => {
            const t = i / (activeRamp.shades.length - 1);
            const y = solveCubicBezierY(t, lightnessP1, lightnessP2);
            const [ptX, ptY] = mathToSvg([t, y]);
            const isSelected = activeShadeStep === shade.step;

            return (
              <g
                key={shade.step}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => setActiveShadeStep(shade.step)}
              >
                <circle
                  cx={ptX}
                  cy={ptY}
                  r={isSelected ? 5 : 3.5}
                  fill={shade.clampedHex}
                  stroke={isSelected ? '#FFFFFF' : 'rgba(0,0,0,0.6)'}
                  strokeWidth={isSelected ? 2 : 1}
                />
              </g>
            );
          })}

          {/* Anchor Points P0 & P3 */}
          <circle cx={p0Svg[0]} cy={p0Svg[1]} r={3} fill="#8E8E9F" />
          <circle cx={p3Svg[0]} cy={p3Svg[1]} r={3} fill="#8E8E9F" />

          {/* Interactive Handle P1 (Indigo) */}
          <g
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => handlePointerDown('p1', e)}
          >
            <circle
              cx={p1Svg[0]}
              cy={p1Svg[1]}
              r={12}
              fill="transparent"
            />
            <circle
              cx={p1Svg[0]}
              cy={p1Svg[1]}
              r={6.5}
              fill="#4F46E5"
              stroke="#FFFFFF"
              strokeWidth="2"
              className="drop-shadow-md transition-shadow hover:stroke-[#818CF8]"
            />
          </g>

          {/* Interactive Handle P2 (Purple) */}
          <g
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => handlePointerDown('p2', e)}
          >
            <circle
              cx={p2Svg[0]}
              cy={p2Svg[1]}
              r={12}
              fill="transparent"
            />
            <circle
              cx={p2Svg[0]}
              cy={p2Svg[1]}
              r={6.5}
              fill="#9D4EDD"
              stroke="#FFFFFF"
              strokeWidth="2"
              className="drop-shadow-md transition-shadow hover:stroke-[#C77DFF]"
            />
          </g>
        </svg>
      </div>

      {/* Coordinate Displays */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="flex items-center justify-between px-2 py-1 rounded bg-[#131317] border border-white/[0.06]">
          <span className="text-[#818CF8]">P1</span>
          <span className="text-zinc-300">
            [{lightnessP1[0].toFixed(2)}, {lightnessP1[1].toFixed(2)}]
          </span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 rounded bg-[#131317] border border-white/[0.06]">
          <span className="text-[#C77DFF]">P2</span>
          <span className="text-zinc-300">
            [{lightnessP2[0].toFixed(2)}, {lightnessP2[1].toFixed(2)}]
          </span>
        </div>
      </div>

      {/* Quick Curve Presets */}
      <div className="flex items-center gap-1 overflow-x-auto py-1">
        {PRESETS.map((preset) => {
          const isActive =
            lightnessP1[0] === preset.p1[0] &&
            lightnessP1[1] === preset.p1[1] &&
            lightnessP2[0] === preset.p2[0] &&
            lightnessP2[1] === preset.p2[1];

          return (
            <button
              key={preset.name}
              onClick={() =>
                updateRampCurveConfig(activeRamp.id, {
                  lightnessP1: preset.p1,
                  lightnessP2: preset.p2,
                })
              }
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#1F1F28] text-white border border-white/[0.15]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
              }`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
