/**
 * ChromaForge - Live Component Preview (Design System in Action)
 * Real-time high-density SaaS dashboard demonstrating active OKLCH tokens:
 * KPI metric cards, SVG spline area charts, status tables, and buttons
 * with mathematically derived interactive states (constant ΔL shifts).
 */

import React, { useState, useMemo } from 'react';
import { useChromaStore } from '../../store/useChromaStore';
import {
  TrendingUp,
  Activity,
  Cpu,
  Layers,
  CheckCircle2,
  Sun,
  Moon,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { formatOklchCss } from '../../core/color/conversions';

export const LiveComponentPreview: React.FC = () => {
  const { ramps, activeRampId, setActiveRampId } = useChromaStore();

  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'settings'>('overview');
  const [toggleState, setToggleState] = useState(true);
  const [clickCount, setClickCount] = useState(0);
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const [isBtnActive, setIsBtnActive] = useState(false);

  // Active color anchors
  const primaryRamp = ramps.find((r) => r.id === activeRampId) || ramps[0];
  const purpleRamp =
    ramps.find((r) => r.name.toLowerCase().includes('purple') || r.name.toLowerCase().includes('accent')) ||
    ramps[1] ||
    ramps[0];
  const greenRamp =
    ramps.find((r) => r.name.toLowerCase().includes('green') || r.name.toLowerCase().includes('success')) ||
    ramps[2] ||
    ramps[0];
  const slateRamp =
    ramps.find((r) => r.name.toLowerCase().includes('neutral') || r.name.toLowerCase().includes('slate')) ||
    ramps[ramps.length - 1] ||
    ramps[0];

  // Map key shades
  const p100 = primaryRamp.shades[1].clampedHex;
  const p200 = primaryRamp.shades[2].clampedHex;
  const p500 = primaryRamp.shades[5].clampedHex;
  const p700 = primaryRamp.shades[7].clampedHex;
  const p900 = primaryRamp.shades[9].clampedHex;

  const purple500 = purpleRamp.shades[5].clampedHex;
  const purple100 = purpleRamp.shades[1].clampedHex;
  const purple900 = purpleRamp.shades[9].clampedHex;

  const green500 = greenRamp.shades[5].clampedHex;
  const green100 = greenRamp.shades[1].clampedHex;
  const green900 = greenRamp.shades[9].clampedHex;

  const slate100 = slateRamp.shades[1].clampedHex;
  const slate500 = slateRamp.shades[5].clampedHex;
  const slate900 = slateRamp.shades[9].clampedHex;

  // Derivation of hover/active OKLCH states for Primary Button:
  // We take primary 500 and shift lightness by ΔL = +0.05 on hover and -0.04 on active
  const baseL = primaryRamp.shades[5].clampedOklch.l;
  const baseC = primaryRamp.shades[5].clampedOklch.c;
  const baseH = primaryRamp.shades[5].clampedOklch.h;

  const hoverOklchCss = useMemo(
    () =>
      formatOklchCss({
        l: Math.min(0.98, baseL + 0.05),
        c: baseC,
        h: baseH,
      }),
    [baseL, baseC, baseH]
  );

  const activeOklchCss = useMemo(
    () =>
      formatOklchCss({
        l: Math.max(0.05, baseL - 0.05),
        c: baseC,
        h: baseH,
      }),
    [baseL, baseC, baseH]
  );

  // Surface colors depending on preview dark/light mode
  const isDark = previewTheme === 'dark';
  const surfaceBg = isDark ? '#09090B' : '#F9FAFB';
  const cardBg = isDark ? '#0D0D10' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const textColor = isDark ? '#F4F4F6' : '#111827';
  const textMuted = isDark ? '#8E8E9F' : '#6B7280';
  const subSurface = isDark ? '#141418' : '#F3F4F6';

  // Sample data table rows
  const tableRows = [
    {
      id: 'cluster-us-east',
      name: 'prod-us-east-1-cluster',
      type: 'Distributed Node',
      latency: '18ms',
      status: 'Healthy',
      statusColor: green500,
      statusBg: isDark ? `${green900}40` : green100,
      sparkline: 'M0,15 Q20,5 40,12 T80,8',
    },
    {
      id: 'cluster-eu-west',
      name: 'prod-eu-west-2-cluster',
      type: 'Primary Ingress',
      latency: '24ms',
      status: 'Syncing',
      statusColor: purple500,
      statusBg: isDark ? `${purple900}40` : purple100,
      sparkline: 'M0,8 Q20,18 40,6 T80,10',
    },
    {
      id: 'cluster-ap-tokyo',
      name: 'prod-ap-northeast-1',
      type: 'Edge Cache Proxy',
      latency: '31ms',
      status: 'Active',
      statusColor: p500,
      statusBg: isDark ? `${p900}40` : p100,
      sparkline: 'M0,12 Q20,8 40,14 T80,4',
    },
    {
      id: 'cluster-sa-east',
      name: 'prod-sa-east-backup',
      type: 'Cold Replica',
      latency: '114ms',
      status: 'Idle',
      statusColor: slate500,
      statusBg: isDark ? `${slate900}40` : slate100,
      sparkline: 'M0,10 Q20,10 40,10 T80,10',
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#09090B] text-[#F4F4F6]">
      {/* 1. Preview Controller Top Bar */}
      <div className="h-12 px-6 border-b border-white/[0.07] flex items-center justify-between shrink-0 bg-[#0D0D10]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p500 }} />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 hidden sm:inline">
              Live Token Environment
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-zinc-500 hidden sm:inline">Theme:</span>
            <select
              value={activeRampId}
              onChange={(e) => setActiveRampId(e.target.value)}
              className="h-7 px-2 rounded bg-[#131317] border border-white/[0.08] text-zinc-200 focus:outline-none focus:border-[#4F46E5] text-xs font-mono"
            >
              {ramps.map((ramp) => (
                <option key={ramp.id} value={ramp.id}>
                  {ramp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Theme Mode Toggle (Dark UI / Light UI surface test) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#131317] p-0.5 rounded border border-white/[0.07] text-xs font-mono">
            <button
              onClick={() => setPreviewTheme('dark')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                isDark ? 'bg-[#1F1F28] text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Moon className="w-3 h-3 text-[#818CF8]" />
              <span>Dark Surface</span>
            </button>
            <button
              onClick={() => setPreviewTheme('light')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                !isDark ? 'bg-[#FFFFFF] text-zinc-900 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span>Light Surface</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Live Preview Canvas */}
      <div
        className="flex-1 p-6 md:p-8 space-y-6 transition-colors duration-200"
        style={{ backgroundColor: surfaceBg, color: textColor }}
      >
        {/* Dashboard Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: cardBorder }}>
          <div>
            <h1 className="text-lg font-bold tracking-tight">System Infrastructure Hub</h1>
            <p className="text-xs font-mono mt-0.5" style={{ color: textMuted }}>
              Real-time telemetry styled purely via ChromaForge generated OKLCH tokens.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Soft Token Button */}
            <button
              onClick={() => setClickCount((c) => c + 1)}
              className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg border transition-all"
              style={{
                backgroundColor: isDark ? `${p900}50` : p100,
                color: isDark ? p200 : p700,
                borderColor: isDark ? `${p500}40` : `${p500}30`,
              }}
            >
              Toggled: {clickCount} times
            </button>

            {/* Mathematically Derived Primary OKLCH Button with ΔL hover/active */}
            <button
              onMouseEnter={() => setIsBtnHovered(true)}
              onMouseLeave={() => {
                setIsBtnHovered(false);
                setIsBtnActive(false);
              }}
              onMouseDown={() => setIsBtnActive(true)}
              onMouseUp={() => setIsBtnActive(false)}
              style={{
                backgroundColor: isBtnActive ? activeOklchCss : isBtnHovered ? hoverOklchCss : p500,
                color: primaryRamp.shades[5].clampedOklch.l > 0.65 ? '#09090B' : '#FFFFFF',
              }}
              className="group relative px-4 py-1.5 text-xs font-mono font-semibold rounded-lg shadow-sm transition-all hover:scale-102 active:scale-98"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deploy OKLCH v4</span>
              </span>
            </button>
          </div>
        </div>

        {/* 3. KPI Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1: Primary Metrics */}
          <div
            className="p-4 rounded-xl border flex flex-col justify-between space-y-3"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono" style={{ color: textMuted }}>
                Network Throughput
              </span>
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ backgroundColor: isDark ? `${p900}60` : p100, color: p500 }}
              >
                <Activity className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono tracking-tight">4.82 Gbps</div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono mt-1" style={{ color: green500 }}>
                <TrendingUp className="w-3 h-3" />
                <span>+14.8% vs last epoch</span>
              </div>
            </div>
            {/* SVG Sparkline in Primary Color */}
            <svg viewBox="0 0 120 28" className="w-full h-7 overflow-visible">
              <path
                d="M0,22 Q30,4 60,18 T120,6"
                fill="none"
                stroke={p500}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Card 2: Accent Purple Metric */}
          <div
            className="p-4 rounded-xl border flex flex-col justify-between space-y-3"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono" style={{ color: textMuted }}>
                Active OKLCH Ramps
              </span>
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ backgroundColor: isDark ? `${purple900}60` : purple100, color: purple500 }}
              >
                <Layers className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono tracking-tight">
                {ramps.length} Scales / 44 Swatches
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono mt-1" style={{ color: purple500 }}>
                <CheckCircle2 className="w-3 h-3" />
                <span>Uniform Lightness Anchors</span>
              </div>
            </div>
            <svg viewBox="0 0 120 28" className="w-full h-7 overflow-visible">
              <path
                d="M0,14 Q30,24 60,8 T120,12"
                fill="none"
                stroke={purple500}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Card 3: Success Emerald Metric */}
          <div
            className="p-4 rounded-xl border flex flex-col justify-between space-y-3"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono" style={{ color: textMuted }}>
                APCA Visual Rating
              </span>
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ backgroundColor: isDark ? `${green900}60` : green100, color: green500 }}
              >
                <Cpu className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono tracking-tight">96.2 Lc</div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono mt-1" style={{ color: green500 }}>
                <span>Optimal (Fluent Text Tier)</span>
              </div>
            </div>
            <svg viewBox="0 0 120 28" className="w-full h-7 overflow-visible">
              <path
                d="M0,18 Q30,12 60,6 T120,4"
                fill="none"
                stroke={green500}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Card 4: Gamut Compatibility */}
          <div
            className="p-4 rounded-xl border flex flex-col justify-between space-y-3"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono" style={{ color: textMuted }}>
                Color Gamut Health
              </span>
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center font-mono text-[10px] font-bold"
                style={{ backgroundColor: isDark ? '#1E1E26' : slate100, color: slate500 }}
              >
                P3
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono tracking-tight">100% Clamped</div>
              <div className="text-[11px] font-mono mt-1" style={{ color: textMuted }}>
                sRGB fallback verified
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: subSurface }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: '92%',
                  background: `linear-gradient(90deg, ${p500}, ${green500})`,
                }}
              />
            </div>
          </div>
        </div>

        {/* 4. Main Chart Area & Interactive Component Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real-time SVG Area Spline Chart (2 cols) */}
          <div
            className="lg:col-span-2 p-5 rounded-xl border space-y-4"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Perceptual Lightness vs Spectral Power</h3>
                <p className="text-[11px] font-mono" style={{ color: textMuted }}>
                  Cubic Bézier easing evaluated at 60 fps with CSS OKLCH gradient fills.
                </p>
              </div>

              {/* Segmented Control Inside Preview */}
              <div className="flex items-center p-0.5 rounded-lg border text-xs font-mono" style={{ backgroundColor: subSurface, borderColor: cardBorder }}>
                {(['overview', 'activity', 'settings'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-2.5 py-1 rounded capitalize transition-all"
                    style={{
                      backgroundColor: activeTab === tab ? (isDark ? '#262630' : '#FFFFFF') : 'transparent',
                      color: activeTab === tab ? textColor : textMuted,
                      boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Area Chart */}
            <div className="h-52 w-full relative">
              <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={p500} stopOpacity={isDark ? '0.4' : '0.25'} />
                    <stop offset="100%" stopColor={p500} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                {[40, 90, 140, 190].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="600"
                    y2={y}
                    stroke={cardBorder}
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Spline Area Fill */}
                <path
                  d="M0,160 Q80,140 150,70 T300,100 T450,40 T600,80 L600,200 L0,200 Z"
                  fill="url(#areaGradient)"
                />

                {/* Spline Stroke Line */}
                <path
                  d="M0,160 Q80,140 150,70 T300,100 T450,40 T600,80"
                  fill="none"
                  stroke={p500}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                {[
                  { cx: 150, cy: 70, val: 'L: 0.82' },
                  { cx: 300, cy: 100, val: 'L: 0.58' },
                  { cx: 450, cy: 40, val: 'L: 0.94' },
                  { cx: 600, cy: 80, val: 'L: 0.72' },
                ].map((pt, i) => (
                  <g key={i} className="cursor-pointer group">
                    <circle cx={pt.cx} cy={pt.cy} r={4} fill={p500} stroke={isDark ? '#0D0D10' : '#FFFFFF'} strokeWidth={2} />
                    <circle cx={pt.cx} cy={pt.cy} r={8} fill={p500} opacity={0.2} />
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Interactive Controls & Tokens Palette Demo (1 col) */}
          <div
            className="p-5 rounded-xl border flex flex-col justify-between space-y-4"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
          >
            <div>
              <h3 className="text-sm font-semibold">Form Components & States</h3>
              <p className="text-[11px] font-mono mt-0.5" style={{ color: textMuted }}>
                Derived hover, focus-visible, and toggle switches.
              </p>
            </div>

            {/* Interactive Toggle Switch */}
            <div className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: subSurface, borderColor: cardBorder }}>
              <div className="space-y-0.5">
                <span className="text-xs font-medium block">Automatic Gamut Clamping</span>
                <span className="text-[10px] font-mono block" style={{ color: textMuted }}>
                  Preserves L and H under sRGB boundaries
                </span>
              </div>
              <button
                onClick={() => setToggleState(!toggleState)}
                className="w-10 h-6 rounded-full p-0.5 transition-colors focus:outline-none"
                style={{ backgroundColor: toggleState ? p500 : (isDark ? '#2D2D38' : '#D1D5DB') }}
              >
                <div
                  className="w-5 h-5 rounded-full bg-white transition-transform shadow-xs"
                  style={{ transform: toggleState ? 'translateX(16px)' : 'translateX(0px)' }}
                />
              </button>
            </div>

            {/* Input with Token Focus Ring */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono" style={{ color: textMuted }}>
                Tailwind v4 Variable Name
              </label>
              <input
                type="text"
                readOnly
                value={`--color-${primaryRamp.name.toLowerCase().replace(/\s+/g, '-')}-500`}
                className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border focus:outline-none"
                style={{
                  backgroundColor: subSurface,
                  borderColor: cardBorder,
                  color: textColor,
                }}
              />
            </div>

            {/* Button Hierarchy Demo */}
            <div className="space-y-2 pt-2 border-t" style={{ borderColor: cardBorder }}>
              <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: textMuted }}>
                Button Variants
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="w-full py-1.5 text-xs font-mono font-medium rounded-lg shadow-xs transition-colors"
                  style={{
                    backgroundColor: p500,
                    color: primaryRamp.shades[5].clampedOklch.l > 0.65 ? '#09090B' : '#FFFFFF',
                  }}
                >
                  Solid Button
                </button>
                <button
                  className="w-full py-1.5 text-xs font-mono font-medium rounded-lg border transition-colors"
                  style={{
                    borderColor: isDark ? `${p500}60` : `${p500}40`,
                    color: isDark ? p200 : p700,
                    backgroundColor: isDark ? `${p900}30` : `${p100}80`,
                  }}
                >
                  Tinted Button
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Production Infrastructure Data Table with Status Chips */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: cardBorder }}>
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              Provisioned Edge Deployments
            </span>
            <span className="text-[11px] font-mono" style={{ color: textMuted }}>
              4 active pipelines
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: cardBorder, backgroundColor: subSurface }}>
                  <th className="py-2.5 px-4 font-medium" style={{ color: textMuted }}>Cluster Instance</th>
                  <th className="py-2.5 px-4 font-medium" style={{ color: textMuted }}>Architecture</th>
                  <th className="py-2.5 px-4 font-medium" style={{ color: textMuted }}>Status</th>
                  <th className="py-2.5 px-4 font-medium" style={{ color: textMuted }}>Latency</th>
                  <th className="py-2.5 px-4 font-medium text-right" style={{ color: textMuted }}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: cardBorder }}>
                {tableRows.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.statusColor }} />
                        <span>{row.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4" style={{ color: textMuted }}>
                      {row.type}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border"
                        style={{
                          backgroundColor: row.statusBg,
                          color: row.statusColor,
                          borderColor: `${row.statusColor}30`,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.statusColor }} />
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <svg viewBox="0 0 80 20" className="w-14 h-4">
                          <path
                            d={row.sparkline}
                            fill="none"
                            stroke={row.statusColor}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="font-semibold">{row.latency}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors"
                        title="View Metrics"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
