/**
 * ChromaForge - Global Zustand Store
 * State management for color ramps, Bézier curves, active workbench context,
 * LocalStorage persistence, and URL sharing serialization.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ColorRamp, CurveConfig, ColorStep } from '../types/color';
import { DesignSystemPalette, TokenExportFormat, TokenExportOptions } from '../types/tokens';
import { ChromaState, StudioViewMode } from '../types/store';
import {
  createColorRamp,
  DEFAULT_CURVE_CONFIG,
  generateRampShades,
} from '../core/color/scale-generator';
import { hexToOklch } from '../core/color/conversions';

// ============================================================================
// Default Scales Specification
// Studio Theme Anchors: Indigo (#4F46E5), Purple (#9D4EDD), Green (#58DB91)
// ============================================================================

export const INITIAL_RAMPS: ColorRamp[] = [
  createColorRamp('ramp-indigo', 'Primary Indigo', '#4F46E5', {
    ...DEFAULT_CURVE_CONFIG,
    lightnessP1: [0.35, 0.1],
    lightnessP2: [0.65, 0.9],
    chromaMultiplier: 1.0,
    hueShift: 4.0, // slight optical warmth towards violet in dark shades
  }),
  createColorRamp('ramp-purple', 'Accent Purple', '#9D4EDD', {
    ...DEFAULT_CURVE_CONFIG,
    lightnessP1: [0.33, 0.08],
    lightnessP2: [0.67, 0.92],
    chromaMultiplier: 1.0,
    hueShift: -6.0,
  }),
  createColorRamp('ramp-green', 'Success Emerald', '#58DB91', {
    ...DEFAULT_CURVE_CONFIG,
    lightnessP1: [0.38, 0.12],
    lightnessP2: [0.62, 0.88],
    chromaMultiplier: 0.95,
    hueShift: 8.0,
  }),
  createColorRamp('ramp-slate', 'Neutral Slate', '#64748B', {
    ...DEFAULT_CURVE_CONFIG,
    lightnessP1: [0.3, 0.05],
    lightnessP2: [0.7, 0.95],
    chromaMultiplier: 0.35, // Low chroma neutral
    hueShift: 0.0,
  }),
];

const DEFAULT_EXPORT_OPTIONS: TokenExportOptions = {
  prefix: 'ds',
  useOklchInCss: true,
  includeFallbackHex: true,
  includeP3Fallback: false,
  indentSpaces: 2,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useChromaStore = create<ChromaState>()(
  persist(
    (set, get) => ({
      // Initial Data
      paletteName: 'ChromaForge Core',
      ramps: INITIAL_RAMPS,
      activeRampId: INITIAL_RAMPS[0].id,
      activeShadeStep: 500,
      activeFormat: 'tailwind-v4',
      activeView: 'workbench',
      exportOptions: DEFAULT_EXPORT_OPTIONS,

      // UI Context Actions
      setPaletteName: (name: string) => set({ paletteName: name }),

      setActiveRampId: (id: string) => {
        const rampExists = get().ramps.some((r) => r.id === id);
        if (rampExists) {
          set({ activeRampId: id });
        }
      },

      setActiveShadeStep: (step: ColorStep | null) => set({ activeShadeStep: step }),

      setActiveFormat: (format: TokenExportFormat) => set({ activeFormat: format }),

      setActiveView: (view: StudioViewMode) => set({ activeView: view }),

      updateExportOptions: (options: Partial<TokenExportOptions>) =>
        set((state) => ({
          exportOptions: { ...state.exportOptions, ...options },
        })),

      // Ramp CRUD & Mathematical Mutators
      addRamp: (name: string, keyHex: string) => {
        const newId = `ramp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        const newRamp = createColorRamp(newId, name, keyHex, DEFAULT_CURVE_CONFIG);

        set((state) => ({
          ramps: [...state.ramps, newRamp],
          activeRampId: newId,
        }));

        return newId;
      },

      removeRamp: (id: string) => {
        const { ramps, activeRampId } = get();
        if (ramps.length <= 1) {
          // Keep at least one ramp
          return;
        }

        const remaining = ramps.filter((r) => r.id !== id);
        const nextActiveId = activeRampId === id ? remaining[0].id : activeRampId;

        set({
          ramps: remaining,
          activeRampId: nextActiveId,
        });
      },

      duplicateRamp: (id: string) => {
        const { ramps } = get();
        const target = ramps.find((r) => r.id === id);
        if (!target) return;

        const newId = `ramp-${Date.now().toString(36)}`;
        const duplicate: ColorRamp = {
          ...target,
          id: newId,
          name: `${target.name} (Copy)`,
          curveConfig: { ...target.curveConfig },
          shades: generateRampShades(target.keyColor, target.curveConfig),
        };

        set((state) => ({
          ramps: [...state.ramps, duplicate],
          activeRampId: newId,
        }));
      },

      updateRampName: (id: string, name: string) => {
        set((state) => ({
          ramps: state.ramps.map((r) => (r.id === id ? { ...r, name } : r)),
        }));
      },

      updateRampKeyColor: (id: string, hex: string) => {
        set((state) => ({
          ramps: state.ramps.map((ramp) => {
            if (ramp.id !== id) return ramp;
            const keyColor = hexToOklch(hex);
            const shades = generateRampShades(keyColor, ramp.curveConfig);
            return {
              ...ramp,
              keyHex: hex,
              keyColor,
              shades,
            };
          }),
        }));
      },

      updateRampCurveConfig: (id: string, partialConfig: Partial<CurveConfig>) => {
        set((state) => ({
          ramps: state.ramps.map((ramp) => {
            if (ramp.id !== id) return ramp;
            const updatedConfig = { ...ramp.curveConfig, ...partialConfig };
            const shades = generateRampShades(ramp.keyColor, updatedConfig);
            return {
              ...ramp,
              curveConfig: updatedConfig,
              shades,
            };
          }),
        }));
      },

      updateRampLocked: (id: string, locked: boolean) => {
        set((state) => ({
          ramps: state.ramps.map((r) => (r.id === id ? { ...r, locked } : r)),
        }));
      },

      reorderRamps: (startIndex: number, endIndex: number) => {
        set((state) => {
          const result = Array.from(state.ramps);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return { ramps: result };
        });
      },

      resetToDefaults: () => {
        set({
          paletteName: 'ChromaForge Core',
          ramps: INITIAL_RAMPS,
          activeRampId: INITIAL_RAMPS[0].id,
          activeShadeStep: 500,
          activeFormat: 'tailwind-v4',
          activeView: 'workbench',
          exportOptions: DEFAULT_EXPORT_OPTIONS,
        });
      },

      importPalette: (palette: DesignSystemPalette) => {
        if (!palette.ramps || palette.ramps.length === 0) return;
        set({
          paletteName: palette.name || 'Imported Palette',
          ramps: palette.ramps,
          activeRampId: palette.ramps[0].id,
        });
      },

      exportPalette: (): DesignSystemPalette => {
        const { paletteName, ramps } = get();
        return {
          version: '1.0.0',
          id: `palette-${Date.now()}`,
          name: paletteName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ramps,
        };
      },

      // URL Query Serialization (Zero-Backend state sharing)
      getSerializedUrl: () => {
        const { paletteName, ramps } = get();
        const minimalData = {
          n: paletteName,
          r: ramps.map((ramp) => ({
            id: ramp.id,
            name: ramp.name,
            k: ramp.keyHex,
            c: {
              p1: ramp.curveConfig.lightnessP1,
              p2: ramp.curveConfig.lightnessP2,
              cm: ramp.curveConfig.chromaMultiplier,
              cc: ramp.curveConfig.chromaCurve,
              hs: ramp.curveConfig.hueShift,
              maxL: ramp.curveConfig.maxLightness,
              minL: ramp.curveConfig.minLightness,
            },
          })),
        };

        const jsonString = JSON.stringify(minimalData);
        const base64 = btoa(encodeURIComponent(jsonString));
        const url = new URL(window.location.href);
        url.searchParams.set('palette', base64);
        return url.toString();
      },

      loadFromSerializedUrl: (encoded: string): boolean => {
        try {
          const jsonString = decodeURIComponent(atob(encoded));
          const parsed = JSON.parse(jsonString);

          if (!parsed.r || !Array.isArray(parsed.r)) {
            return false;
          }

          const reconstructedRamps: ColorRamp[] = parsed.r.map((item: any) => {
            const config: CurveConfig = {
              lightnessP1: item.c?.p1 || DEFAULT_CURVE_CONFIG.lightnessP1,
              lightnessP2: item.c?.p2 || DEFAULT_CURVE_CONFIG.lightnessP2,
              chromaMultiplier: item.c?.cm ?? DEFAULT_CURVE_CONFIG.chromaMultiplier,
              chromaCurve: item.c?.cc || DEFAULT_CURVE_CONFIG.chromaCurve,
              hueShift: item.c?.hs ?? DEFAULT_CURVE_CONFIG.hueShift,
              maxLightness: item.c?.maxL ?? DEFAULT_CURVE_CONFIG.maxLightness,
              minLightness: item.c?.minL ?? DEFAULT_CURVE_CONFIG.minLightness,
            };
            return createColorRamp(item.id || `ramp-${Math.random()}`, item.name, item.k, config);
          });

          set({
            paletteName: parsed.n || 'Shared Palette',
            ramps: reconstructedRamps,
            activeRampId: reconstructedRamps[0].id,
          });

          return true;
        } catch (e) {
          console.error('Failed to parse serialized palette URL parameter:', e);
          return false;
        }
      },
    }),
    {
      name: 'chromaforge-palette-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        paletteName: state.paletteName,
        ramps: state.ramps,
        activeRampId: state.activeRampId,
        activeFormat: state.activeFormat,
        exportOptions: state.exportOptions,
      }),
    }
  )
);
