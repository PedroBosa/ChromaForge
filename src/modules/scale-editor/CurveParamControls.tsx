/**
 * ChromaForge - Precision OKLCH Curve Parameter Controls
 * High-density sliders and numeric inputs for Chroma Multiplier, Hue Shift,
 * Lightness Extrema, and live Gamut Clipping alerts.
 */

import React from 'react';
import { useChromaStore } from '../../store/useChromaStore';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export const CurveParamControls: React.FC = () => {
  const { ramps, activeRampId, updateRampCurveConfig, updateRampKeyColor } = useChromaStore();
  const activeRamp = ramps.find((r) => r.id === activeRampId) || ramps[0];
  const { curveConfig, keyHex, keyColor, shades } = activeRamp;

  // Gamut health assessment
  const outOfSrgbShades = shades.filter((s) => !s.inSrgbGamut);
  const outOfP3Shades = shades.filter((s) => !s.inP3Gamut);

  return (
    <div className="flex flex-col space-y-4">
      {/* 1. Base Key Color & OKLCH Anchor */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
          <span>Anchor Color (Shade 500)</span>
          <span className="text-zinc-500 font-mono text-[10px]">
            H: {keyColor.h.toFixed(1)}°
          </span>
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <input
              type="color"
              value={keyHex}
              onChange={(e) => updateRampKeyColor(activeRamp.id, e.target.value)}
              className="w-8 h-8 rounded-lg border border-white/[0.1] bg-transparent cursor-pointer p-0 appearance-none outline-none"
            />
          </div>
          <input
            type="text"
            value={keyHex}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                if (val.length === 7) {
                  updateRampKeyColor(activeRamp.id, val);
                }
              }
            }}
            className="flex-1 h-8 px-2.5 text-xs font-mono bg-zinc-950 border border-white/[0.08] rounded-lg text-zinc-200 focus:border-primary focus:outline-none"
            placeholder="#4F46E5"
          />
          <div className="px-2.5 h-8 flex items-center bg-zinc-950/80 border border-white/[0.06] rounded-lg text-[11px] font-mono text-zinc-400">
            C: {keyColor.c.toFixed(3)}
          </div>
        </div>
      </div>

      {/* 2. Chroma Multiplier Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-zinc-400">Chroma Multiplier</span>
          <span className="text-[#818CF8] font-medium">
            {curveConfig.chromaMultiplier.toFixed(2)}×
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0.2"
            max="2.0"
            step="0.05"
            value={curveConfig.chromaMultiplier}
            onChange={(e) =>
              updateRampCurveConfig(activeRamp.id, {
                chromaMultiplier: parseFloat(e.target.value),
              })
            }
            className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#4F46E5]"
          />
          <input
            type="number"
            min="0.2"
            max="2.0"
            step="0.05"
            value={curveConfig.chromaMultiplier}
            onChange={(e) =>
              updateRampCurveConfig(activeRamp.id, {
                chromaMultiplier: parseFloat(e.target.value) || 1.0,
              })
            }
            className="w-14 h-7 px-1.5 text-center text-xs font-mono bg-zinc-950 border border-white/[0.08] rounded-lg text-zinc-300 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* 3. Hue Shift Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-zinc-400">Hue Rotation (Shift)</span>
          <span className="text-[#C77DFF] font-medium">
            {curveConfig.hueShift > 0 ? `+${curveConfig.hueShift}°` : `${curveConfig.hueShift}°`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="-60"
            max="60"
            step="1"
            value={curveConfig.hueShift}
            onChange={(e) =>
              updateRampCurveConfig(activeRamp.id, {
                hueShift: parseInt(e.target.value, 10),
              })
            }
            className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#9D4EDD]"
          />
          <input
            type="number"
            min="-60"
            max="60"
            step="1"
            value={curveConfig.hueShift}
            onChange={(e) =>
              updateRampCurveConfig(activeRamp.id, {
                hueShift: parseInt(e.target.value, 10) || 0,
              })
            }
            className="w-14 h-7 px-1.5 text-center text-xs font-mono bg-zinc-950 border border-white/[0.08] rounded-lg text-zinc-300 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* 4. Lightness Bounds (Max Lightness & Min Lightness) */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>Max L (50)</span>
            <span className="text-zinc-300 font-medium">
              {curveConfig.maxLightness.toFixed(3)}
            </span>
          </div>
          <input
            type="range"
            min="0.90"
            max="0.99"
            step="0.005"
            value={curveConfig.maxLightness}
            onChange={(e) =>
              updateRampCurveConfig(activeRamp.id, {
                maxLightness: parseFloat(e.target.value),
              })
            }
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-400"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>Min L (950)</span>
            <span className="text-zinc-300 font-medium">
              {curveConfig.minLightness.toFixed(3)}
            </span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.25"
            step="0.005"
            value={curveConfig.minLightness}
            onChange={(e) =>
              updateRampCurveConfig(activeRamp.id, {
                minLightness: parseFloat(e.target.value),
              })
            }
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-400"
          />
        </div>
      </div>

      {/* 5. Chroma Distribution Model */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
          Chroma Envelope Model
        </span>
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950/80 rounded-lg border border-white/[0.06]">
          <button
            onClick={() => updateRampCurveConfig(activeRamp.id, { chromaCurve: 'parabolic' })}
            className={`py-1 text-xs font-mono rounded-[6px] transition-all border whitespace-nowrap ${
              curveConfig.chromaCurve === 'parabolic'
                ? 'border-white/[0.08] bg-zinc-800/90 text-white shadow-sm font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            Parabolic 4t(1-t)
          </button>
          <button
            onClick={() => updateRampCurveConfig(activeRamp.id, { chromaCurve: 'sine' })}
            className={`py-1 text-xs font-mono rounded-[6px] transition-all border whitespace-nowrap ${
              curveConfig.chromaCurve === 'sine'
                ? 'border-white/[0.08] bg-zinc-800/90 text-white shadow-sm font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            Sine Wave sin(πt)
          </button>
        </div>
      </div>

      {/* 6. Optical Gamut Health Badge */}
      <div className="pt-2 border-t border-white/[0.06]">
        {outOfSrgbShades.length === 0 ? (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-success/10 border border-success/20 text-success text-[11px] font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>All 11 shades within sRGB Gamut</span>
          </div>
        ) : (
          <div className="flex flex-col space-y-1 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>
                {outOfSrgbShades.length} {outOfSrgbShades.length === 1 ? 'shade' : 'shades'} out-of-gamut (sRGB)
              </span>
            </div>
            <div className="text-[10px] text-amber-400/80 flex items-center gap-1 flex-wrap pl-5">
              <span>Clipped steps:</span>
              {outOfSrgbShades.map((s) => (
                <span
                  key={s.step}
                  className="px-1.5 py-0.5 rounded-[4px] bg-amber-400/20 text-amber-200 font-bold"
                >
                  {s.step}
                </span>
              ))}
            </div>
            {outOfP3Shades.length > 0 && (
              <div className="text-[10px] text-rose-400 pl-5">
                Warning: {outOfP3Shades.length} shades exceed even Display P3 boundary.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
