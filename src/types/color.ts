/**
 * ChromaForge - Colorimetric & OKLCH Type Definitions
 * Mathematical color spaces, gamut boundaries, and ramp representations.
 */

export interface OklchColor {
  /** Perceptual Lightness: [0.0, 1.0] */
  l: number;
  /** Chroma (Saturation/Purity): [0.0, 0.4+] */
  c: number;
  /** Hue angle in degrees: [0.0, 360.0) */
  h: number;
  /** Alpha channel: [0.0, 1.0] (default: 1.0) */
  alpha?: number;
}

export interface OklabColor {
  /** Perceptual Lightness: [0.0, 1.0] */
  l: number;
  /** Green-Red opponent axis */
  a: number;
  /** Blue-Yellow opponent axis */
  b: number;
  alpha?: number;
}

export interface LinearRgbColor {
  /** Normalized linear red: [0.0, 1.0] */
  r: number;
  /** Normalized linear green: [0.0, 1.0] */
  g: number;
  /** Normalized linear blue: [0.0, 1.0] */
  b: number;
}

export interface RgbColor {
  /** sRGB Red channel: integer [0, 255] */
  r: number;
  /** sRGB Green channel: integer [0, 255] */
  g: number;
  /** sRGB Blue channel: integer [0, 255] */
  b: number;
  alpha?: number;
}

export interface XyzD65Color {
  /** CIE X coordinate (Illuminant D65) */
  x: number;
  /** CIE Y coordinate (Luminance) */
  y: number;
  /** CIE Z coordinate */
  z: number;
}

export type ColorStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export const COLOR_STEPS: readonly ColorStep[] = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;

export type BezierPoint = [number, number];

export interface BezierControlPoints {
  p0: BezierPoint;
  p1: BezierPoint;
  p2: BezierPoint;
  p3: BezierPoint;
}

export type ChromaDistributionModel = 'parabolic' | 'sine' | 'bezier';

export interface CurveConfig {
  /** Cubic Bézier handle 1 for lightness: [x, y] */
  lightnessP1: BezierPoint;
  /** Cubic Bézier handle 2 for lightness: [x, y] */
  lightnessP2: BezierPoint;
  /** Multiplier for maximum chroma reached at the midpoint (shade 500) */
  chromaMultiplier: number;
  /** Mathematical curve used to taper chroma towards 50 and 950 */
  chromaCurve: ChromaDistributionModel;
  /** Cubic Bézier handle 1 for chroma curve when using bezier model */
  chromaP1?: BezierPoint;
  /** Cubic Bézier handle 2 for chroma curve when using bezier model */
  chromaP2?: BezierPoint;
  /** Hue shift in degrees applied smoothly across shades (-60 to +60) */
  hueShift: number;
  /** Anchor lightness for step 50 (lightest shade) */
  maxLightness: number;
  /** Anchor lightness for step 950 (darkest shade) */
  minLightness: number;
}

export interface ColorShade {
  step: ColorStep;
  /** Mathematical target OKLCH */
  oklch: OklchColor;
  /** Raw hexadecimal string (unclamped or native) */
  hex: string;
  /** Standard sRGB values (0-255) */
  rgb: RgbColor;
  /** Whether the pure OKLCH coordinates reside inside standard sRGB gamut */
  inSrgbGamut: boolean;
  /** Whether the pure OKLCH coordinates reside inside Display P3 gamut */
  inP3Gamut: boolean;
  /** Clamped OKLCH with Chroma reduced via binary search to fit sRGB */
  clampedOklch: OklchColor;
  /** Safe clamped Hex code for web display */
  clampedHex: string;
  /** Contrast against standard white (#FFFFFF) */
  contrastOnWhite: {
    wcagRatio: number;
    apcaScore: number;
  };
  /** Contrast against standard black (#000000) */
  contrastOnBlack: {
    wcagRatio: number;
    apcaScore: number;
  };
}

export interface ColorRamp {
  id: string;
  name: string;
  keyColor: OklchColor;
  keyHex: string;
  shades: ColorShade[];
  curveConfig: CurveConfig;
  locked: boolean;
}
