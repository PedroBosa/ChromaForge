/**
 * ChromaForge - Perceptually Uniform Scale Generator
 * Generates the 11 design system steps (50 to 950) in OKLCH color space.
 * Features Bézier parametric lightness interpolation, parabolic chroma envelopes,
 * hue rotation, and binary-search sRGB gamut clipping.
 */

import {
  COLOR_STEPS,
  ColorRamp,
  ColorShade,
  ColorStep,
  CurveConfig,
  OklchColor,
} from '../../types/color';
import { solveCubicBezierY } from './bezier';
import {
  clampOklchToSrgb,
  hexToOklch,
  isOklchInP3Gamut,
  isOklchInSrgbGamut,
  oklchToHex,
  oklchToRgb,
} from './conversions';
import { calcApcaContrast, calcWcagContrast } from './contrast';

// ============================================================================
// Default Curve Configuration
// ============================================================================

export const DEFAULT_CURVE_CONFIG: CurveConfig = {
  lightnessP1: [0.32, 0.08],
  lightnessP2: [0.68, 0.92],
  chromaMultiplier: 1.0,
  chromaCurve: 'parabolic',
  hueShift: 0.0,
  maxLightness: 0.975, // Step 50
  minLightness: 0.165, // Step 950
};

// ============================================================================
// Helper Functions
// ============================================================================

const WHITE_RGB = { r: 255, g: 255, b: 255 };
const BLACK_RGB = { r: 0, g: 0, b: 0 };

/**
 * Calculates chroma envelope scaling factor for a normalized step parameter t in [0, 1].
 * Step 50 is at t=0, Step 500 is at t=0.5, Step 950 is at t=1.0.
 */
function getChromaEnvelope(t: number, model: CurveConfig['chromaCurve']): number {
  if (model === 'sine') {
    // Sine arch with minimum tint floor
    return 0.18 + 0.82 * Math.sin(Math.PI * t);
  }

  // Parabolic bell curve: 4 * t * (1 - t) peaks at 1.0 when t = 0.5
  const parabola = 4 * t * (1 - t);
  return 0.15 + 0.85 * parabola;
}

/**
 * Normalizes an angle into the [0, 360) range.
 */
function normalizeHue(angle: number): number {
  let h = angle % 360;
  if (h < 0) h += 360;
  return Number(h.toFixed(2));
}

// ============================================================================
// Scale Generation Pipeline
// ============================================================================

/**
 * Generates an individual shade at index i (0 to 10) corresponding to step (50 to 950).
 */
export function generateShade(
  step: ColorStep,
  index: number,
  totalSteps: number,
  keyColor: OklchColor,
  curveConfig: CurveConfig
): ColorShade {
  // Normalized position along the ramp: t in [0.0, 1.0]
  const t = index / (totalSteps - 1);

  // 1. Lightness (L): Solved via Cubic Bézier easing
  const bezierT = solveCubicBezierY(t, curveConfig.lightnessP1, curveConfig.lightnessP2);
  const l = curveConfig.maxLightness - bezierT * (curveConfig.maxLightness - curveConfig.minLightness);
  const clampedL = Math.max(0.01, Math.min(0.99, Number(l.toFixed(4))));

  // 2. Chroma (C): Envelope scaled from the key color's chroma
  const envelope = getChromaEnvelope(t, curveConfig.chromaCurve);
  const targetC = keyColor.c * curveConfig.chromaMultiplier * envelope;
  const clampedC = Math.max(0, Number(targetC.toFixed(4)));

  // 3. Hue (H): Smooth shift centered around step 500 (t = 0.5)
  const targetH = normalizeHue(keyColor.h + curveConfig.hueShift * (t - 0.5));

  // Pure target OKLCH
  const targetOklch: OklchColor = {
    l: clampedL,
    c: clampedC,
    h: targetH,
    alpha: 1,
  };

  // Gamut detection
  const inSrgbGamut = isOklchInSrgbGamut(targetOklch);
  const inP3Gamut = isOklchInP3Gamut(targetOklch);

  // Gamut Clamping for safe rendering
  const clampedOklch = inSrgbGamut ? targetOklch : clampOklchToSrgb(targetOklch);

  const rgb = oklchToRgb(targetOklch);
  const hex = oklchToHex(targetOklch);
  const clampedHex = oklchToHex(clampedOklch);
  const clampedRgb = oklchToRgb(clampedOklch);

  // Contrast scores
  const contrastOnWhite = {
    wcagRatio: calcWcagContrast(clampedRgb, WHITE_RGB),
    apcaScore: calcApcaContrast(clampedRgb, WHITE_RGB),
  };

  const contrastOnBlack = {
    wcagRatio: calcWcagContrast(clampedRgb, BLACK_RGB),
    apcaScore: calcApcaContrast(clampedRgb, BLACK_RGB),
  };

  return {
    step,
    oklch: targetOklch,
    hex,
    rgb,
    inSrgbGamut,
    inP3Gamut,
    clampedOklch,
    clampedHex,
    contrastOnWhite,
    contrastOnBlack,
  };
}

/**
 * Generates all 11 shades for a given color ramp.
 */
export function generateRampShades(
  keyColor: OklchColor,
  curveConfig: CurveConfig = DEFAULT_CURVE_CONFIG
): ColorShade[] {
  return COLOR_STEPS.map((step, index) =>
    generateShade(step, index, COLOR_STEPS.length, keyColor, curveConfig)
  );
}

/**
 * Creates a fully initialized ColorRamp from a name and hexadecimal key color.
 */
export function createColorRamp(
  id: string,
  name: string,
  keyHex: string,
  curveConfig: CurveConfig = DEFAULT_CURVE_CONFIG
): ColorRamp {
  const keyColor = hexToOklch(keyHex);
  const shades = generateRampShades(keyColor, curveConfig);

  return {
    id,
    name,
    keyColor,
    keyHex,
    shades,
    curveConfig,
    locked: false,
  };
}
