/**
 * ChromaForge - Store State & Actions Definition
 */

import { ColorRamp, ColorStep, CurveConfig } from './color';
import { DesignSystemPalette, TokenExportFormat, TokenExportOptions } from './tokens';

export type StudioViewMode = 'workbench' | 'matrix' | 'gamut' | 'preview' | 'tokens';

export interface ChromaState {
  // Data
  paletteName: string;
  ramps: ColorRamp[];
  activeRampId: string;
  activeShadeStep: ColorStep | null;
  activeFormat: TokenExportFormat;
  activeView: StudioViewMode;
  exportOptions: TokenExportOptions;

  // Actions
  setPaletteName: (name: string) => void;
  setActiveRampId: (id: string) => void;
  setActiveShadeStep: (step: ColorStep | null) => void;
  setActiveFormat: (format: TokenExportFormat) => void;
  setActiveView: (view: StudioViewMode) => void;
  updateExportOptions: (options: Partial<TokenExportOptions>) => void;

  addRamp: (name: string, keyHex: string) => string;
  removeRamp: (id: string) => void;
  duplicateRamp: (id: string) => void;
  updateRampName: (id: string, name: string) => void;
  updateRampKeyColor: (id: string, hex: string) => void;
  updateRampCurveConfig: (id: string, config: Partial<CurveConfig>) => void;
  updateRampLocked: (id: string, locked: boolean) => void;
  reorderRamps: (startIndex: number, endIndex: number) => void;

  resetToDefaults: () => void;
  importPalette: (palette: DesignSystemPalette) => void;
  exportPalette: () => DesignSystemPalette;
  getSerializedUrl: () => string;
  loadFromSerializedUrl: (encoded: string) => boolean;
}
