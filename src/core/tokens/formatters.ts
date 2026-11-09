/**
 * ChromaForge - Universal Token Exporter
 * Generates output code for Tailwind v4, Tailwind v3, CSS variables,
 * W3C Design Tokens Studio JSON, and typed TypeScript constants.
 */

import { ColorRamp } from '../../types/color';
import { TokenExportFormat, TokenExportOptions, W3CTokenGroup } from '../../types/tokens';
import { formatOklchCss } from '../color/conversions';

/**
 * Sanitizes a ramp name for code identifiers (kebab-case).
 */
export function sanitizeTokenName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Compiles ramps to Tailwind CSS v4 `@theme` block.
 */
export function compileTailwindV4(
  ramps: ColorRamp[],
  options: Partial<TokenExportOptions> = {}
): string {
  const lines: string[] = ['@theme {'];

  for (const ramp of ramps) {
    const slug = sanitizeTokenName(ramp.name);
    lines.push(`  /* ${ramp.name} Ramp */`);
    for (const shade of ramp.shades) {
      const oklchStr = formatOklchCss(shade.clampedOklch);
      if (options.includeFallbackHex) {
        lines.push(`  --color-${slug}-${shade.step}: ${oklchStr}; /* fallback: ${shade.clampedHex} */`);
      } else {
        lines.push(`  --color-${slug}-${shade.step}: ${oklchStr};`);
      }
    }
    lines.push('');
  }

  // Remove trailing blank line if present
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Compiles ramps to Tailwind CSS v3 `tailwind.config.js` colors object.
 */
export function compileTailwindV3(ramps: ColorRamp[]): string {
  const lines: string[] = [
    '/** @type {import("tailwindcss").Config} */',
    'module.exports = {',
    '  theme: {',
    '    extend: {',
    '      colors: {',
  ];

  for (const ramp of ramps) {
    const slug = sanitizeTokenName(ramp.name);
    lines.push(`        '${slug}': {`);
    for (const shade of ramp.shades) {
      const oklch = shade.clampedOklch;
      const l = Number(oklch.l.toFixed(4));
      const c = Number(oklch.c.toFixed(4));
      const h = Number(oklch.h.toFixed(2));
      lines.push(
        `          ${shade.step}: 'oklch(${l} ${c} ${h} / <alpha-value>)',`
      );
    }
    lines.push('        },');
  }

  lines.push('      },');
  lines.push('    },');
  lines.push('  },', '};');
  return lines.join('\n');
}

/**
 * Compiles ramps to CSS Custom Properties with Hex fallback and @supports block.
 */
export function compileCssVariables(
  ramps: ColorRamp[],
  options: Partial<TokenExportOptions> = {}
): string {
  const prefix = options.prefix ? `${options.prefix}-` : '';
  const lines: string[] = [':root {'];

  // 1. Fallback Hex values
  lines.push('  /* Fallback Hex (sRGB Gamut) */');
  for (const ramp of ramps) {
    const slug = sanitizeTokenName(ramp.name);
    for (const shade of ramp.shades) {
      lines.push(`  --${prefix}${slug}-${shade.step}: ${shade.clampedHex};`);
    }
  }

  lines.push('}');
  lines.push('');

  // 2. High-precision OKLCH inside @supports block
  lines.push('@supports (color: oklch(0 0 0)) {');
  lines.push('  :root {');
  lines.push('    /* Native OKLCH Colors */');
  for (const ramp of ramps) {
    const slug = sanitizeTokenName(ramp.name);
    for (const shade of ramp.shades) {
      const oklchStr = formatOklchCss(shade.clampedOklch);
      lines.push(`    --${prefix}${slug}-${shade.step}: ${oklchStr};`);
    }
  }
  lines.push('  }');
  lines.push('}');

  return lines.join('\n');
}

/**
 * Compiles ramps into W3C Design Tokens Community Group JSON format.
 */
export function compileW3cTokens(ramps: ColorRamp[]): string {
  const root: { color: W3CTokenGroup } = { color: {} };

  for (const ramp of ramps) {
    const slug = sanitizeTokenName(ramp.name);
    const rampGroup: W3CTokenGroup = {};

    for (const shade of ramp.shades) {
      rampGroup[shade.step] = {
        $value: formatOklchCss(shade.clampedOklch),
        $type: 'color',
        $description: `${ramp.name} shade ${shade.step} - Contrast on white: ${shade.contrastOnWhite.wcagRatio}:1`,
        $extensions: {
          oklch: {
            l: shade.clampedOklch.l,
            c: shade.clampedOklch.c,
            h: shade.clampedOklch.h,
          },
          gamut: {
            inSrgb: shade.inSrgbGamut,
            inP3: shade.inP3Gamut,
          },
        },
      };
    }

    root.color[slug] = rampGroup;
  }

  return JSON.stringify(root, null, 2);
}

/**
 * Compiles ramps into strongly typed TypeScript constants.
 */
export function compileTypeScript(ramps: ColorRamp[]): string {
  const lines: string[] = [
    '/**',
    ' * ChromaForge Generated Design Tokens',
    ' * Perceptually uniform OKLCH color scales.',
    ' */',
    '',
    'export const palette = {',
  ];

  for (const ramp of ramps) {
    const slug = sanitizeTokenName(ramp.name);
    lines.push(`  ${slug}: {`);
    for (const shade of ramp.shades) {
      lines.push(`    ${shade.step}: {`);
      lines.push(`      hex: '${shade.clampedHex}',`);
      lines.push(`      oklch: '${formatOklchCss(shade.clampedOklch)}',`);
      lines.push(`      l: ${shade.clampedOklch.l},`);
      lines.push(`      c: ${shade.clampedOklch.c},`);
      lines.push(`      h: ${shade.clampedOklch.h},`);
      lines.push(`    },`);
    }
    lines.push('  },');
  }

  lines.push('} as const;');
  lines.push('');
  lines.push('export type PaletteColor = keyof typeof palette;');
  lines.push('export type PaletteStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;');

  return lines.join('\n');
}

/**
 * Master compilation dispatcher.
 */
export function compileTokens(
  ramps: ColorRamp[],
  format: TokenExportFormat,
  options?: Partial<TokenExportOptions>
): string {
  switch (format) {
    case 'tailwind-v4':
      return compileTailwindV4(ramps, options);
    case 'tailwind-v3':
      return compileTailwindV3(ramps);
    case 'css-variables':
      return compileCssVariables(ramps, options);
    case 'w3c-tokens':
      return compileW3cTokens(ramps);
    case 'typescript':
      return compileTypeScript(ramps);
    default:
      return compileTailwindV4(ramps, options);
  }
}
