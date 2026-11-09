/**
 * ChromaForge - Token Architecture & Exporter Types
 * Modern token specifications for Tailwind v4, v3, CSS variables, and W3C Design Tokens.
 */

import { ColorRamp } from './color';

export type TokenExportFormat =
  | 'tailwind-v4'
  | 'tailwind-v3'
  | 'css-variables'
  | 'w3c-tokens'
  | 'typescript';

export interface TokenExportOptions {
  prefix?: string;
  useOklchInCss: boolean;
  includeFallbackHex: boolean;
  includeP3Fallback: boolean;
  indentSpaces: number;
}

export interface W3CTokenValue {
  $value: string;
  $type: 'color';
  $description?: string;
  $extensions?: {
    oklch?: {
      l: number;
      c: number;
      h: number;
    };
    gamut?: {
      inSrgb: boolean;
      inP3: boolean;
    };
  };
}

export interface W3CTokenGroup {
  [key: string]: W3CTokenValue | W3CTokenGroup;
}

export interface DesignSystemPalette {
  version: string;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  ramps: ColorRamp[];
}
