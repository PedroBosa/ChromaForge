# ChromaForge

> **OKLCH Colorimetric Engineering Studio & Zero-Backend Design Token Engine**  
> Engineered for the next generation of web interfaces: Tailwind CSS v4 `@theme`, CSS Color Module 4, and W3C Design Tokens.

[![Live Demo](https://img.shields.io/badge/Live_Demo-pedrobosa.github.io%2FChromaForge-indigo?style=for-the-badge&logo=github)](https://pedrobosa.github.io/ChromaForge/)

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4_Ready-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Color Space](https://img.shields.io/badge/Color_Space-OKLCH_%2F_Oklab-indigo)](https://bottosson.github.io/posts/oklab/)
[![Accessibility](https://img.shields.io/badge/Accessibility-APCA_+_WCAG_2.1-58DB91)](#optical-accessibility-matrix)
[![Deploy](https://img.shields.io/badge/Deploy-GitHub_Pages-black?logo=github)](https://pedrobosa.github.io/ChromaForge/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Overview

**ChromaForge** is an open-source, client-side color engineering studio crafted in the aesthetic standard of high-density developer tools (*Linear, Figma, Vercel Geist*).

Traditional color pickers and design token generators rely on legacy HSL or naive sRGB interpolation. In HSL, colors with identical lightness values have wildly divergent human perceptual brightness—for instance, pure yellow (`hsl(60, 100%, 50%)`) has a perceived relative luminance over **6× higher** than pure blue (`hsl(240, 100%, 50%)`), making contrast ratios erratic and automated scale generation inconsistent.

ChromaForge operates natively in the **OKLCH (Oklab Cylindrical)** color space, ensuring:
- **Perceptual Uniformity:** Shade `500` in Indigo, Purple, and Emerald maintain mathematically verified identical perceived lightness ($L$).
- **Predictable Contrast:** Guarantees accessible text and UI contrast pairs across every hue.
- **Display P3 Wide Gamut & Non-Destructive Clamping:** Automatically detects when a color exceeds physical sRGB bounds and clips chroma using binary search, preserving perceived lightness and hue angle without clipping artifacts.

---

## Architectural Highlights

```
src/
├── core/                         # Zero-DOM, Zero-React Pure Mathematics Layer
│   ├── color/
│   │   ├── conversions.ts        # sRGB <-> Linear RGB <-> CIE XYZ D65 <-> Oklab <-> OKLCH
│   │   ├── contrast.ts           # WCAG 2.1 & APCA 0.98G-4g (WCAG 3.0 draft)
│   │   ├── bezier.ts             # Newton-Raphson cubic Bézier solver
│   │   └── scale-generator.ts    # 11-step scale generator (50 to 950) with parabolic chroma envelopes
│   └── tokens/
│       └── formatters.ts         # Compilers for Tailwind v4, Tailwind v3, CSS, W3C JSON, TypeScript
├── types/                        # Strict Domain Types & Math Interfaces
├── store/
│   └── useChromaStore.ts         # Zustand store with LocalStorage persistence & URL sharing
└── modules/                      # High-Density Workbench Interface
    ├── workbench/                # App Shell, TopBar, and 11-Shade Palette Strip
    ├── scale-editor/             # Interactive SVG Bézier Curve Editor & OKLCH Sliders
    ├── accessibility/            # 11x11 Optical Matrix with Live Typography Inspector
    ├── gamut-map/                # 2D Canvas Chromaticity Diagram (sRGB vs Display P3)
    ├── preview/                  # Live SaaS Dashboard with ΔL derived button states
    └── exporter/                 # Universal 1-Click Token Export Modal
```

---

## Mathematical Foundations

### 1. Color Space Transformations
Every conversion pipeline is implemented natively in 64-bit floating point precision according to Björn Ottosson's 2020 specification:

$$\begin{bmatrix} l \\ m \\ s \end{bmatrix} = M_1 \cdot \begin{bmatrix} R_{lin} \\ G_{lin} \\ B_{lin} \end{bmatrix}$$

$$l' = \sqrt[3]{l}, \quad m' = \sqrt[3]{m}, \quad s' = \sqrt[3]{s}$$

$$\begin{bmatrix} L \\ a \\ b \end{bmatrix} = M_2 \cdot \begin{bmatrix} l' \\ m' \\ s' \end{bmatrix}$$

$$C = \sqrt{a^2 + b^2}, \quad H = \operatorname{atan2}(b, a) \cdot \frac{180}{\pi}$$

### 2. Gamut Clipping via Binary Search on Chroma
When a target OKLCH coordinate exceeds the sRGB unit cube ($[0, 1]^3$), ChromaForge avoids naive channel clamping (which distorts hue and brightness). Instead, it conducts a 24-iteration binary search on Chroma $C$ while maintaining exact Lightness $L$ and Hue $H$ constant:

$$C_{mid} = \frac{C_{low} + C_{high}}{2}$$

Finding the exact intersection with the physical gamut boundary with an error $\epsilon \le 10^{-4}$.

### 3. Accessible Perceptual Contrast Algorithm (APCA)
Implements standard **APCA 0.98G-4g** (W3C Silver / WCAG 3.0 draft), which models human spatial vision, black-level stray light flare, and polarity differences:
- **Positive $L^c$ ($+106$ max):** Dark text on light background (BoW).
- **Negative $L^c$ ($-108$ max):** Light text on dark background (WoB).
- **Tiers:** $|L^c| \ge 90$ (Fluent Body Text), $\ge 75$ (Standard Body), $\ge 60$ (Headlines), $\ge 45$ (UI Components), $< 30$ (Inaccessible).

---

## Features

### 1. Interactive SVG Bézier Curve Editor
- Visualizes the parametric easing space $[0, 1] \times [0, 1]$.
- Draggable tangent handles $P_1$ (Indigo) and $P_2$ (Purple) with pointer capture.
- Real-time display of the 11 shade points plotted along the curve.
- Quick curve presets: *S-Curve, Linear, Ease-In, Ease-Out, Steep*.

### 2. Optical Accessibility Matrix ($11 \times 11$)
- Cross-ramp interactive matrix (e.g., Primary text on Neutral surface).
- Toggle between APCA $L^c$ and WCAG 2.1 ratio modes.
- Color-coded optical approval indicators (Soft Green `#58DB91`, Cyan `#22D3EE`).
- Live Typography Pair Inspector with body text, headings, and component badges.

### 3. 2D Canvas Gamut Chromaticity Diagram
- Visualizes the Oklab $(a, b)$ plane with retina high-DPI scaling.
- Evaluates real-time polygon cross-sections for both sRGB and Display P3 at the exact lightness slice of the active shade.
- Displays vector lines from unclipped target coordinates to clamped boundary coordinates.

### 4. Live SaaS Dashboard Preview
- Renders KPI metrics, SVG sparklines, and an area spline chart using active tokens.
- Production data table with status chips (Success Emerald, Accent Purple, Primary Indigo).
- Interactive buttons with states (`:hover`, `:active`) derived through constant $\Delta L$ shifts in OKLCH.
- Theme mode toggle (Dark UI vs. Light UI surface).

### 5. Universal Token Exporter (1-Click)
- **Tailwind CSS v4:** `@theme { --color-primary-500: oklch(...); }`
- **Tailwind CSS v3:** `tailwind.config.js` with `<alpha-value>` support.
- **CSS Custom Properties:** `:root` with sRGB fallback + `@supports (color: oklch(0 0 0))`.
- **W3C Design Tokens:** DTCG standard `.json` format with OKLCH extensions.
- **TypeScript Constants:** Strongly typed `as const` object definitions.

### 6. Zero-Backend State Sharing
- Instant palette sharing via URL query parameter `?palette=<base64>`.
- Fully client-side, privacy-first, zero-database architecture.

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested on v20 and v24)
- npm 9+

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/PedroBosa/ChromaForge.git
cd ChromaForge

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
# Typecheck and build optimized bundle for GitHub Pages
npm run build

# Preview local production build
npm run preview
```

---

## Deployment to GitHub Pages

This project is configured with GitHub Actions for automated deployment.
1. Repository deployed at: `https://github.com/PedroBosa/ChromaForge`
2. Live production application: `https://pedrobosa.github.io/ChromaForge/`
3. The workflow in `.github/workflows/deploy.yml` automatically builds and deploys `dist/` on every push to `main`.

---

## License

MIT © 2026 [Pedro Bosa](https://github.com/PedroBosa).
