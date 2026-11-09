/**
 * ChromaForge - Colorimetric Engine
 * Native mathematical implementation of color conversions:
 * HEX <-> sRGB <-> Linear RGB <-> CIE XYZ (D65) <-> Oklab <-> OKLCH
 *
 * Implements Björn Ottosson's Oklab color space (2020) and CIE D65 transformations.
 * Zero external dependencies. All matrices are 64-bit floating point precision.
 */

import {
  LinearRgbColor,
  OklabColor,
  OklchColor,
  RgbColor,
  XyzD65Color,
} from '../../types/color';

// ============================================================================
// 1. HEX <-> sRGB (Gamma-Encoded Integer Space)
// ============================================================================

/**
 * Parses a standard 3, 6, or 8-digit hexadecimal color string into sRGB [0-255].
 */
export function hexToRgb(hex: string): RgbColor {
  let cleaned = hex.trim().replace(/^#/, '');

  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  } else if (cleaned.length === 4) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }

  if (cleaned.length !== 6 && cleaned.length !== 8) {
    // Default safe fallback to black on invalid hex
    return { r: 0, g: 0, b: 0, alpha: 1 };
  }

  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  const alpha =
    cleaned.length === 8
      ? parseFloat((parseInt(cleaned.substring(6, 8), 16) / 255).toFixed(4))
      : 1;

  return {
    r: isNaN(r) ? 0 : r,
    g: isNaN(g) ? 0 : g,
    b: isNaN(b) ? 0 : b,
    alpha: isNaN(alpha) ? 1 : alpha,
  };
}

/**
 * Converts sRGB [0-255] values to an uppercase 6-digit hex string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clampR = Math.min(255, Math.max(0, Math.round(r)));
  const clampG = Math.min(255, Math.max(0, Math.round(g)));
  const clampB = Math.min(255, Math.max(0, Math.round(b)));

  const hexR = clampR.toString(16).padStart(2, '0');
  const hexG = clampG.toString(16).padStart(2, '0');
  const hexB = clampB.toString(16).padStart(2, '0');

  return `#${hexR}${hexG}${hexB}`.toUpperCase();
}

// ============================================================================
// 2. sRGB <-> Linear RGB (Electro-Optical Transfer Function / Gamma Expansion)
// ============================================================================

/**
 * IEC 61966-2-1 Transfer Function (Gamma expansion).
 * Converts non-linear sRGB channel [0, 1] to Linear RGB [0, 1].
 */
export function srgbChannelToLinear(c: number): number {
  const clamped = Math.max(0, Math.min(1, c));
  if (clamped <= 0.04045) {
    return clamped / 12.92;
  }
  return Math.pow((clamped + 0.055) / 1.055, 2.4);
}

/**
 * Inverse IEC 61966-2-1 Transfer Function (Gamma companding).
 * Converts Linear RGB channel [0, 1] to non-linear sRGB channel [0, 1].
 */
export function linearChannelToSrgb(c: number): number {
  if (c <= 0.0031308) {
    return c * 12.92;
  }
  return 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055;
}

/**
 * Converts sRGB [0-255] to Linear sRGB [0.0-1.0].
 */
export function srgbToLinear(rgb: RgbColor): LinearRgbColor {
  return {
    r: srgbChannelToLinear(rgb.r / 255),
    g: srgbChannelToLinear(rgb.g / 255),
    b: srgbChannelToLinear(rgb.b / 255),
  };
}

/**
 * Converts Linear sRGB [0.0-1.0] to sRGB [0-255].
 */
export function linearToSrgb(linear: LinearRgbColor): RgbColor {
  return {
    r: Math.min(255, Math.max(0, Math.round(linearChannelToSrgb(linear.r) * 255))),
    g: Math.min(255, Math.max(0, Math.round(linearChannelToSrgb(linear.g) * 255))),
    b: Math.min(255, Math.max(0, Math.round(linearChannelToSrgb(linear.b) * 255))),
    alpha: 1,
  };
}

// ============================================================================
// 3. Linear sRGB <-> CIE XYZ (D65 Illuminant)
// ============================================================================

/**
 * Transforms Linear sRGB to CIE XYZ D65 using standard sRGB transformation matrix.
 */
export function linearRgbToXyz(linear: LinearRgbColor): XyzD65Color {
  const { r, g, b } = linear;
  return {
    x: 0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    y: 0.2126729 * r + 0.7151522 * g + 0.0721750 * b,
    z: 0.0193339 * r + 0.1191920 * g + 0.9503041 * b,
  };
}

/**
 * Transforms CIE XYZ D65 to Linear sRGB.
 */
export function xyzToLinearRgb(xyz: XyzD65Color): LinearRgbColor {
  const { x, y, z } = xyz;
  return {
    r: 3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
    g: -0.9692660 * x + 1.8760108 * y + 0.0415560 * z,
    b: 0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
  };
}

// ============================================================================
// 4. Linear sRGB <-> Oklab (Björn Ottosson, 2020)
// ============================================================================

/**
 * Converts Linear sRGB to Oklab coordinates (L, a, b).
 * L: Lightness [0, 1]
 * a: Green (-) to Red (+)
 * b: Blue (-) to Yellow (+)
 */
export function linearRgbToOklab(linear: LinearRgbColor): OklabColor {
  const { r, g, b } = linear;

  // Step 1: Cone response (LMS)
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  // Step 2: Non-linear cube root compression (preserving sign if needed)
  const l_ = Math.cbrt(Math.max(0, l));
  const m_ = Math.cbrt(Math.max(0, m));
  const s_ = Math.cbrt(Math.max(0, s));

  // Step 3: Oklab coordinates
  return {
    l: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}

/**
 * Converts Oklab coordinates (L, a, b) to Linear sRGB.
 */
export function oklabToLinearRgb(oklab: OklabColor): LinearRgbColor {
  const { l, a, b } = oklab;

  // Step 1: Invert Oklab to LMS cube roots
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  // Step 2: Cube to LMS
  const lCone = l_ * l_ * l_;
  const mCone = m_ * m_ * m_;
  const sCone = s_ * s_ * s_;

  // Step 3: LMS to Linear sRGB
  return {
    r: 4.0767416621 * lCone - 3.3077115913 * mCone + 0.2309699292 * sCone,
    g: -1.2684380046 * lCone + 2.6097574011 * mCone - 0.3413193965 * sCone,
    b: -0.0041960863 * lCone - 0.7034186147 * mCone + 1.7076147010 * sCone,
  };
}

// ============================================================================
// 5. Oklab <-> OKLCH (Polar Cylindrical Representation)
// ============================================================================

/**
 * Converts Cartesian Oklab (L, a, b) to Cylindrical OKLCH (L, C, H).
 * L: Lightness [0, 1]
 * C: Chroma [0, ~0.4]
 * H: Hue angle [0, 360)
 */
export function oklabToOklch(oklab: OklabColor): OklchColor {
  const { l, a, b, alpha } = oklab;
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;

  if (h < 0) {
    h += 360;
  }

  // Handle achroma: when chroma is near 0, hue is undefined (keep 0)
  if (c < 0.00001) {
    h = 0;
  }

  return {
    l,
    c,
    h,
    alpha: alpha ?? 1,
  };
}

/**
 * Converts Cylindrical OKLCH (L, C, H) to Cartesian Oklab (L, a, b).
 */
export function oklchToOklab(oklch: OklchColor): OklabColor {
  const { l, c, h, alpha } = oklch;
  const hRad = (h * Math.PI) / 180;

  return {
    l,
    a: c * Math.cos(hRad),
    b: c * Math.sin(hRad),
    alpha: alpha ?? 1,
  };
}

// ============================================================================
// 6. Direct Pipeline Helpers
// ============================================================================

/**
 * Converts Hex string directly to OKLCH.
 */
export function hexToOklch(hex: string): OklchColor {
  const rgb = hexToRgb(hex);
  const linear = srgbToLinear(rgb);
  const oklab = linearRgbToOklab(linear);
  return oklabToOklch({ ...oklab, alpha: rgb.alpha });
}

/**
 * Converts OKLCH directly to 8-bit sRGB. Clamps to [0, 255] if out-of-gamut.
 */
export function oklchToRgb(oklch: OklchColor): RgbColor {
  const oklab = oklchToOklab(oklch);
  const linear = oklabToLinearRgb(oklab);
  return linearToSrgb(linear);
}

/**
 * Converts OKLCH directly to Hex string.
 */
export function oklchToHex(oklch: OklchColor): string {
  const rgb = oklchToRgb(oklch);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Formats OKLCH into standard CSS Color 4 functional notation:
 * `oklch(L C H)` or `oklch(L C H / alpha)`
 */
export function formatOklchCss(oklch: OklchColor, precision: number = 4): string {
  const l = Number(oklch.l.toFixed(precision));
  const c = Number(oklch.c.toFixed(precision));
  const h = Number(oklch.h.toFixed(precision));

  if (oklch.alpha !== undefined && oklch.alpha < 1) {
    const a = Number(oklch.alpha.toFixed(precision));
    return `oklch(${l} ${c} ${h} / ${a})`;
  }

  return `oklch(${l} ${c} ${h})`;
}

// ============================================================================
// 7. Gamut Checking & Clipping (sRGB and Display P3)
// ============================================================================

const GAMUT_EPSILON = 0.0001;

/**
 * Tests whether a Linear RGB coordinate falls strictly inside the [0, 1] unit cube.
 */
export function isInSrgbGamut(linear: LinearRgbColor, epsilon: number = GAMUT_EPSILON): boolean {
  return (
    linear.r >= -epsilon &&
    linear.r <= 1.0 + epsilon &&
    linear.g >= -epsilon &&
    linear.g <= 1.0 + epsilon &&
    linear.b >= -epsilon &&
    linear.b <= 1.0 + epsilon
  );
}

/**
 * Tests whether an OKLCH color falls inside the standard sRGB gamut.
 */
export function isOklchInSrgbGamut(oklch: OklchColor): boolean {
  const oklab = oklchToOklab(oklch);
  const linear = oklabToLinearRgb(oklab);
  return isInSrgbGamut(linear);
}

/**
 * Transforms CIE XYZ D65 to Linear Display P3.
 */
export function xyzToLinearDisplayP3(xyz: XyzD65Color): LinearRgbColor {
  const { x, y, z } = xyz;
  return {
    r: 2.4934969119 * x - 0.9313836179 * y - 0.4027107845 * z,
    g: -0.8294889696 * x + 1.7626640603 * y + 0.0236246858 * z,
    b: 0.0358458302 * x - 0.0761723893 * y + 0.9568845240 * z,
  };
}

/**
 * Tests whether an OKLCH color falls inside the Display P3 wide gamut.
 */
export function isOklchInP3Gamut(oklch: OklchColor, epsilon: number = GAMUT_EPSILON): boolean {
  const oklab = oklchToOklab(oklch);
  const linearSrgb = oklabToLinearRgb(oklab);
  const xyz = linearRgbToXyz(linearSrgb);
  const p3 = xyzToLinearDisplayP3(xyz);

  return (
    p3.r >= -epsilon &&
    p3.r <= 1.0 + epsilon &&
    p3.g >= -epsilon &&
    p3.g <= 1.0 + epsilon &&
    p3.b >= -epsilon &&
    p3.b <= 1.0 + epsilon
  );
}

/**
 * Gamut Clipping via Binary Search on Chroma (CSS Color Module 4 candidate standard).
 *
 * Keeps Lightness (L) and Hue (H) constant, searching for the maximum Chroma (C)
 * that fits inside the standard sRGB gamut. Avoids hue shift and dirty brightness drops.
 */
export function clampOklchToSrgb(
  oklch: OklchColor,
  tolerance: number = 0.0001,
  maxIterations: number = 24
): OklchColor {
  // If already in sRGB, no reduction needed
  if (isOklchInSrgbGamut(oklch)) {
    return { ...oklch };
  }

  // Extreme lightness bounds: at L <= 0 or L >= 1, chroma is 0
  if (oklch.l <= 0.0001) {
    return { l: 0, c: 0, h: oklch.h, alpha: oklch.alpha };
  }
  if (oklch.l >= 0.9999) {
    return { l: 1, c: 0, h: oklch.h, alpha: oklch.alpha };
  }

  let lowC = 0.0;
  let highC = oklch.c;
  let midC = oklch.c / 2;

  for (let i = 0; i < maxIterations; i++) {
    midC = (lowC + highC) / 2;
    const testOklch: OklchColor = { l: oklch.l, c: midC, h: oklch.h };

    if (isOklchInSrgbGamut(testOklch)) {
      lowC = midC;
    } else {
      highC = midC;
    }

    if (highC - lowC <= tolerance) {
      break;
    }
  }

  return {
    l: oklch.l,
    c: lowC,
    h: oklch.h,
    alpha: oklch.alpha,
  };
}
