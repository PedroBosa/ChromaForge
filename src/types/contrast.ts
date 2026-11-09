/**
 * ChromaForge - Contrast & Accessibility Types
 * Models for WCAG 2.1 and APCA (Accessible Perceptual Contrast Algorithm - WCAG 3.0 draft).
 */

export type WcagRating = 'AAA' | 'AA' | 'AA-Large' | 'Fail';

export type ApcaReadabilityLevel =
  | 'FluentText' // |Lc| >= 90: Optimal for body text (14-16px normal)
  | 'BodyText'   // |Lc| >= 75: Standard body text (16-18px normal or 14px bold)
  | 'LargeText'  // |Lc| >= 60: Headlines and large content (24px+ normal or 18px+ bold)
  | 'UI'         // |Lc| >= 45: Interactive components, active icons, large borders
  | 'NonText'    // |Lc| >= 30: Secondary borders, disabled states, decorative
  | 'Fail';      // |Lc| < 30: Invisible or unacceptable contrast

export interface ContrastReport {
  /** WCAG 2.1 relative luminance ratio (1.0 to 21.0) */
  wcagRatio: number;
  /** Pass status for WCAG 2.1 AA Normal Text (>= 4.5:1) */
  wcagAA: boolean;
  /** Pass status for WCAG 2.1 AAA Normal Text (>= 7.0:1) */
  wcagAAA: boolean;
  /** Pass status for WCAG 2.1 AA Large Text (>= 3.0:1) */
  wcagAALarge: boolean;
  /** Pass status for WCAG 2.1 AAA Large Text (>= 4.5:1) */
  wcagAAALarge: boolean;
  /** APCA contrast value Lc (-108 to +106) */
  apcaScore: number;
  /** APCA readability certification */
  apcaLevel: ApcaReadabilityLevel;
  /** Polarity of the pair: dark-on-light (positive Lc) or light-on-dark (negative Lc) */
  polarity: 'darkOnLight' | 'lightOnDark';
  /** Recommended minimum font size in points/pixels for this contrast pair */
  recommendedFontSize: string;
}

export interface ContrastMatrixCell {
  textStep: number;
  surfaceStep: number;
  textHex: string;
  surfaceHex: string;
  report: ContrastReport;
}
