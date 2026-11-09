/**
 * ChromaForge - Cubic Bézier & Parametric Mathematics
 * High-precision Newton-Raphson solver for cubic Bézier curves.
 * Used for perceptual lightness distribution and chroma envelopes.
 */

import { BezierPoint } from '../../types/color';

const NEWTON_ITERATIONS = 8;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_MAX_ITERATIONS = 10;
const SUBDIVISION_PRECISION = 0.00001;

/**
 * Computes 1D cubic Bézier coordinate for a given parameter t.
 * P0 is assumed to be 0, P3 is assumed to be 1.
 */
function sampleCurveX(t: number, p1x: number, p2x: number): number {
  // ((1 - 3*p2 + 3*p1)*t + (3*p2 - 6*p1))*t + 3*p1
  return (((1 - 3 * p2x + 3 * p1x) * t + (3 * p2x - 6 * p1x)) * t + 3 * p1x) * t;
}

function sampleCurveY(t: number, p1y: number, p2y: number): number {
  return (((1 - 3 * p2y + 3 * p1y) * t + (3 * p2y - 6 * p1y)) * t + 3 * p1y) * t;
}

function sampleCurveDerivativeX(t: number, p1x: number, p2x: number): number {
  return (3 * (1 - 3 * p2x + 3 * p1x) * t + 2 * (3 * p2x - 6 * p1x)) * t + 3 * p1x;
}

/**
 * Solves t for a given x along a cubic Bézier curve using Newton-Raphson.
 * Falls back to bisection if derivative is too small.
 */
export function solveCubicBezierT(x: number, p1: BezierPoint, p2: BezierPoint): number {
  const [p1x] = p1;
  const [p2x] = p2;

  // First try Newton-Raphson method
  let t = x;
  for (let i = 0; i < NEWTON_ITERATIONS; i++) {
    const currentX = sampleCurveX(t, p1x, p2x) - x;
    if (Math.abs(currentX) < SUBDIVISION_PRECISION) {
      return t;
    }
    const currentSlope = sampleCurveDerivativeX(t, p1x, p2x);
    if (Math.abs(currentSlope) < NEWTON_MIN_SLOPE) {
      break;
    }
    t -= currentX / currentSlope;
  }

  // Fallback to bisection
  let t0 = 0.0;
  let t1 = 1.0;
  t = x;

  for (let i = 0; i < SUBDIVISION_MAX_ITERATIONS; i++) {
    const currentX = sampleCurveX(t, p1x, p2x);
    if (Math.abs(currentX - x) < SUBDIVISION_PRECISION) {
      return t;
    }
    if (x > currentX) {
      t0 = t;
    } else {
      t1 = t;
    }
    t = (t1 + t0) / 2.0;
  }

  return t;
}

/**
 * Given an input x in [0, 1] and two control points, returns the interpolated y in [0, 1].
 */
export function solveCubicBezierY(x: number, p1: BezierPoint, p2: BezierPoint): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const t = solveCubicBezierT(x, p1, p2);
  return sampleCurveY(t, p1[1], p2[1]);
}

/**
 * Evaluates an arbitrary 2D cubic Bézier curve at parameter t in [0, 1].
 */
export function evalCubicBezier2D(
  t: number,
  p0: BezierPoint,
  p1: BezierPoint,
  p2: BezierPoint,
  p3: BezierPoint
): BezierPoint {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  const x = uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0];
  const y = uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1];

  return [x, y];
}
