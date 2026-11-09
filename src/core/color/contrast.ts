/**
 * ChromaForge - Accessibility & Contrast Engine
 * Mathematical implementation of WCAG 2.1 and APCA (Accessible Perceptual Contrast Algorithm - WCAG 3.0 draft).
 * Standard APCA version 0.98G-4g by Andrew Somers (W3C AGWG).
 */

import { ContrastReport, ApcaReadabilityLevel } from '../../types/contrast';
import { RgbColor } from '../../types/color';
import { hexToRgb, srgbToLinear } from './conversions';

// ============================================================================
// APCA 0.98G Mathematical Constants
// ============================================================================

const MAIN_TRC = 2.4; // Simple power curve for sRGB transfer function in APCA
const S_R_CO = 0.2126729; // CIE 1931 linear red coefficient
const S_G_CO = 0.7151522; // CIE 1931 linear green coefficient
const S_B_CO = 0.0721750; // CIE 1931 linear blue coefficient

// Exponents for normal polarity (dark text on light background)
const NORM_BG = 0.56;
const NORM_TXT = 0.57;

// Exponents for reverse polarity (light text on dark background)
const REV_TXT = 0.62;
const REV_BG = 0.65;

// Black level flare / stray light soft clamp parameters
const BLK_THRS = 0.022;
const BLK_CLMP = 1.414;

// Output scaling factors
const SCALE_BOW = 1.14; // Black on White
const SCALE_WOB = 1.14; // White on Black
const LO_CLIP = 0.1; // Low contrast threshold clip
const DELTA_Y_MIN = 0.0005; // Minimum luminance difference to avoid noise

// ============================================================================
// 1. Luminance Calculations
// ============================================================================

/**
 * Calculates WCAG 2.1 relative luminance Y according to W3C recommendation:
 * Y = 0.2126729*R + 0.7151522*G + 0.0721750*B (Linear space)
 */
export function getWcagRelativeLuminance(rgb: RgbColor): number {
  const linear = srgbToLinear(rgb);
  return S_R_CO * linear.r + S_G_CO * linear.g + S_B_CO * linear.b;
}

/**
 * Calculates APCA luminance Y using simple 2.4 power curve companding.
 */
export function getApcaLuminance(rgb: RgbColor): number {
  const r = Math.pow(Math.max(0, Math.min(255, rgb.r)) / 255, MAIN_TRC);
  const g = Math.pow(Math.max(0, Math.min(255, rgb.g)) / 255, MAIN_TRC);
  const b = Math.pow(Math.max(0, Math.min(255, rgb.b)) / 255, MAIN_TRC);
  return S_R_CO * r + S_G_CO * g + S_B_CO * b;
}

// ============================================================================
// 2. WCAG 2.1 Contrast Ratio
// ============================================================================

/**
 * Computes WCAG 2.1 contrast ratio between two colors (range 1.0 to 21.0).
 */
export function calcWcagContrast(foreground: RgbColor, background: RgbColor): number {
  const lum1 = getWcagRelativeLuminance(foreground);
  const lum2 = getWcagRelativeLuminance(background);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Number(ratio.toFixed(2));
}

// ============================================================================
// 3. APCA (WCAG 3.0 Silver Draft) Contrast Calculation
// ============================================================================

/**
 * Calculates APCA contrast score Lc (-108.0 to +106.0) between text and background.
 *
 * Negative values indicate Light text on Dark background (White on Black = -106 to -108).
 * Positive values indicate Dark text on Light background (Black on White = +106).
 */
export function calcApcaContrast(textRgb: RgbColor, bgRgb: RgbColor): number {
  const yTxtRaw = getApcaLuminance(textRgb);
  const yBgRaw = getApcaLuminance(bgRgb);

  // Evaluate minimum delta threshold
  if (Math.abs(yBgRaw - yTxtRaw) < DELTA_Y_MIN) {
    return 0.0;
  }

  // Soft clamp black level flare
  const yTxt = yTxtRaw > BLK_THRS ? yTxtRaw : yTxtRaw + Math.pow(BLK_THRS - yTxtRaw, BLK_CLMP);
  const yBg = yBgRaw > BLK_THRS ? yBgRaw : yBgRaw + Math.pow(BLK_THRS - yBgRaw, BLK_CLMP);

  let sapc = 0;

  if (yBg >= yTxt) {
    // Normal polarity: Dark text on Light background (BoW)
    sapc = (Math.pow(yBg, NORM_BG) - Math.pow(yTxt, NORM_TXT)) * SCALE_BOW;
    const lc = sapc < LO_CLIP ? 0 : (sapc - LO_CLIP) * 100;
    return Number(lc.toFixed(1));
  } else {
    // Reverse polarity: Light text on Dark background (WoB)
    sapc = (Math.pow(yBg, REV_BG) - Math.pow(yTxt, REV_TXT)) * SCALE_WOB;
    const lc = sapc > -LO_CLIP ? 0 : (sapc + LO_CLIP) * 100;
    return Number(lc.toFixed(1));
  }
}

// ============================================================================
// 4. Readability Categorization & Full Audit
// ============================================================================

export function getApcaReadabilityLevel(absLc: number): ApcaReadabilityLevel {
  if (absLc >= 90) return 'FluentText';
  if (absLc >= 75) return 'BodyText';
  if (absLc >= 60) return 'LargeText';
  if (absLc >= 45) return 'UI';
  if (absLc >= 30) return 'NonText';
  return 'Fail';
}

export function getRecommendedFontSize(absLc: number): string {
  if (absLc >= 90) return '14px+ Regular (Any Body Text)';
  if (absLc >= 75) return '16px Regular / 14px Bold';
  if (absLc >= 60) return '24px Regular / 18px Bold (Headings)';
  if (absLc >= 45) return '36px Regular / UI Icons & Components';
  if (absLc >= 30) return 'Disabled & Decorative Only';
  return 'Not readable for text';
}

/**
 * Generates an exhaustive contrast report evaluating both WCAG 2.1 and APCA.
 */
export function evaluateContrast(textHex: string, surfaceHex: string): ContrastReport {
  const textRgb = hexToRgb(textHex);
  const bgRgb = hexToRgb(surfaceHex);

  const wcagRatio = calcWcagContrast(textRgb, bgRgb);
  const apcaScore = calcApcaContrast(textRgb, bgRgb);
  const absLc = Math.abs(apcaScore);

  const apcaLevel = getApcaReadabilityLevel(absLc);
  const polarity: 'darkOnLight' | 'lightOnDark' = apcaScore >= 0 ? 'darkOnLight' : 'lightOnDark';

  return {
    wcagRatio,
    wcagAA: wcagRatio >= 4.5,
    wcagAAA: wcagRatio >= 7.0,
    wcagAALarge: wcagRatio >= 3.0,
    wcagAAALarge: wcagRatio >= 4.5,
    apcaScore,
    apcaLevel,
    polarity,
    recommendedFontSize: getRecommendedFontSize(absLc),
  };
}
