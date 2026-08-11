import type { Metadata } from 'next'
import {
  CopyButton,
  MarkGallery,
  TelemetryCounter,
  ScanLine,
} from './BrandKitClient'

export const metadata: Metadata = {
  title: 'Brand Kit - Nebula Components',
  description:
    'Official brand assets, logo usage guidelines, color system, typography, and motion specifications for Nebula Components.',
  alternates: {
    canonical: 'https://nebulacomponents.com/brand',
  },
}

// ─── Data ────────────────────────────────────────────────────────────────────

const colors = [
  {
    name: 'Signal Teal',
    hex: '#00c2a0',
    rgb: '0, 194, 160',
    hsl: '169°, 100%, 38%',
    role: 'Primary brand accent, pass states, interactive elements',
    a11y: '4.56:1 on Near Black - AA Large',
    semantic: 'brand',
  },
  {
    name: 'Near Black',
    hex: '#050505',
    rgb: '5, 5, 5',
    hsl: '0°, 0%, 2%',
    role: 'Primary background, canvas',
    a11y: '20.9:1 against Off White - AAA',
    semantic: 'surface',
  },
  {
    name: 'Off White',
    hex: '#F5F5F5',
    rgb: '245, 245, 245',
    hsl: '0°, 0%, 96%',
    role: 'Primary foreground, headings, body text',
    a11y: '20.9:1 on Near Black - AAA',
    semantic: 'text',
  },
  {
    name: 'Muted Gray',
    hex: '#9e9e9e',
    rgb: '158, 158, 158',
    hsl: '0°, 0%, 62%',
    role: 'Secondary text, annotations, metadata',
    a11y: '7.05:1 on Near Black - AAA',
    semantic: 'muted',
  },
  {
    name: 'Signal Fail',
    hex: '#f59e0b',
    rgb: '245, 158, 11',
    hsl: '38°, 92%, 50%',
    role: 'Reserved - failed conversion signal threshold only',
    a11y: '3.2:1 on Near Black - use at 18px+ bold only',
    semantic: 'fail',
  },
]

const semanticColors = [
  { name: 'Success', hex: '#00c2a0', usage: 'Pass states, positive outcomes' },
  { name: 'Error', hex: '#f37979', usage: 'Validation errors, destructive actions' },
  { name: 'Information', hex: '#3b82f6', usage: 'Informational notices, links' },
  { name: 'Signal Fail', hex: '#f59e0b', usage: 'Failed threshold - audit-specific only' },
]

const contrastPairs = [
  { fg: '#F5F5F5', bg: '#050505', ratio: '20.9:1', level: 'AAA' },
  { fg: '#00c2a0', bg: '#050505', ratio: '4.56:1', level: 'AA Large' },
  { fg: '#9e9e9e', bg: '#050505', ratio: '7.05:1', level: 'AAA' },
  { fg: '#9e9e9e', bg: '#111111', ratio: '6.14:1', level: 'AAA' },
  { fg: '#050505', bg: '#00c2a0', ratio: '4.56:1', level: 'AA Large' },
  { fg: '#ffffff', bg: '#009980', ratio: '3.22:1', level: 'AA Large' },
]

const typographyScale = [
  { name: 'Display', size: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: '1.1', weight: '800', tracking: '-0.04em', case: 'None', example: 'Audit. Optimize. Ship.' },
  { name: 'Heading 1', size: '2.25rem', lineHeight: '2.5rem', weight: '700', tracking: '-0.02em', case: 'None', example: 'Performance Diagnostics' },
  { name: 'Heading 2', size: '1.5rem', lineHeight: '2rem', weight: '600', tracking: '0.02em', case: 'None', example: 'Signal Analysis' },
  { name: 'Heading 3', size: '1.25rem', lineHeight: '1.75rem', weight: '600', tracking: '0', case: 'None', example: 'Conversion Metrics' },
  { name: 'Heading 4', size: '1.125rem', lineHeight: '1.75rem', weight: '600', tracking: '0', case: 'None', example: 'Node States' },
  { name: 'Body', size: '1.0625rem', lineHeight: '1.65', weight: '400', tracking: '0', case: 'None', example: 'Evidence-backed conversion diagnostics that identify exactly where paid traffic leaks occur.' },
  { name: 'Caption', size: '0.75rem', lineHeight: '1rem', weight: '400', tracking: '0', case: 'None', example: 'Last scanned 2 minutes ago' },
  { name: 'Label', size: '0.8125rem', lineHeight: '1rem', weight: '600', tracking: '0.1em', case: 'Uppercase', example: 'CONVERSION SIGNALS' },
  { name: 'Score', size: '2rem', lineHeight: '1', weight: '700', tracking: '-0.02em', case: 'None', example: '87' },
  { name: 'Telemetry', size: '0.6875rem', lineHeight: '1rem', weight: '500', tracking: '0.05em', case: 'Uppercase', example: 'SIG:PASS 6/9' },
  { name: 'Code / Data', size: '0.8125rem', lineHeight: '1.5', weight: '400', tracking: '0', case: 'None', example: 'font-family: system-ui, sans-serif;' },
]

const iconExamples = [
  { name: 'Audit', path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { name: 'Performance', path: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { name: 'Accessibility', path: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { name: 'SEO', path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { name: 'Conversion', path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'Error', path: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Success', path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
]

const doRules = [
  { rule: 'Use the mark on dark backgrounds with adequate clearspace.' },
  { rule: 'Use Signal Teal (#00c2a0) as the only chromatic accent in brand contexts.' },
  { rule: "Refer to the product as 'Nebula' or 'Nebula Components'." },
  { rule: 'Maintain minimum 1× mark-width clearspace around the mark.' },
  { rule: 'Use the monospace stack for scores, data, and technical labels.' },
]

const dontRules = [
  { rule: 'Modify the grid pattern or change individual node colors.' },
  { rule: 'Use the mark on backgrounds that reduce contrast below WCAG AA.' },
  { rule: 'Animate the mark in ways that change node states without reflecting real audit data.' },
  { rule: "Refer to us as a 'CRO agency' or 'landing page optimization service'." },
  { rule: 'Apply excessive glow, drop shadows, or 3D transforms to the mark.' },
  { rule: 'Use the mark at sizes below 12px without the small-size variant.' },
]

const motionSpecs = [
  { name: 'Scan Line', duration: '8s', easing: 'ease-in-out', trigger: 'Viewport entry', description: 'Vertical sweep across diagnostic panels' },
  { name: 'Node Pulse', duration: '2s', easing: 'ease-in-out', trigger: 'Idle state', description: 'Subtle opacity oscillation on active nodes' },
  { name: 'Ring Rotation', duration: '20s', easing: 'linear', trigger: 'Always', description: 'Slow rotation on diagnostic ring elements' },
  { name: 'Counter Up', duration: '1.2s', easing: 'cubic-bezier(0.16, 1, 0.3, 1)', trigger: 'Viewport entry', description: 'Numeric value counts from 0 to target' },
  { name: 'Hover Activate', duration: '200ms', easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', trigger: 'Pointer enter', description: 'Border color and subtle scale shift' },
  { name: 'Section Reveal', duration: '400ms', easing: 'cubic-bezier(0.16, 1, 0.3, 1)', trigger: 'Scroll into view', description: 'Slide up with fade' },
]

// ─── Shared Components ───────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-accent mb-2">
      {children}
    </p>
  )
}

function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-fg tracking-tight mb-2">
      {children}
    </h2>
  )
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-fg-muted leading-relaxed max-w-2xl mb-8">
      {children}
    </p>
  )
}

function DiagnosticPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-bg-surface border border-border rounded-xl p-5 ${className}`}>
      {children}
    </div>
  )
}

function MetaTag({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[9px] font-mono uppercase tracking-widest text-fg-muted/60 shrink-0">{label}</span>
      <span className="text-xs font-mono text-fg-muted">{value}</span>
    </div>
  )
}

// ─── Hero Mark SVG (Large, with diagnostic rings) ────────────────────────────

function HeroMark() {
  const cellSize = 6
  const gap = 2
  const r = 2.2
  const states = ['pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'neutral', 'neutral', 'neutral']

  return (
    <svg
      width="240"
      height="240"
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Nebula Components diagnostic mark"
      role="img"
      className="w-48 h-48 sm:w-60 sm:h-60"
    >
      {/* Outer diagnostic ring */}
      <circle cx="120" cy="120" r="110" stroke="rgba(0, 194, 160, 0.08)" strokeWidth="0.5" />
      <circle cx="120" cy="120" r="100" stroke="rgba(0, 194, 160, 0.12)" strokeWidth="0.5" strokeDasharray="2 4" className="motion-safe:animate-[spin_20s_linear_infinite] origin-center" />
      <circle cx="120" cy="120" r="90" stroke="rgba(0, 194, 160, 0.06)" strokeWidth="0.5" />

      {/* Radial grid lines */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 * Math.PI) / 180
        const x1 = 120 + 85 * Math.cos(angle)
        const y1 = 120 + 85 * Math.sin(angle)
        const x2 = 120 + 115 * Math.cos(angle)
        const y2 = 120 + 115 * Math.sin(angle)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0, 194, 160, 0.06)" strokeWidth="0.5" />
      })}

      {/* Coordinate ticks */}
      {[0, 90, 180, 270].map((deg) => {
        const angle = (deg * Math.PI) / 180
        const x = 120 + 108 * Math.cos(angle)
        const y = 120 + 108 * Math.sin(angle)
        return (
          <text key={deg} x={x} y={y} fontSize="5" fill="rgba(0, 194, 160, 0.3)" textAnchor="middle" dominantBaseline="middle" fontFamily="monospace">
            {deg}°
          </text>
        )
      })}

      {/* Signal node mark (scaled up, centered) */}
      <g transform="translate(84, 84) scale(3)">
        {Array.from({ length: 9 }, (_, i) => {
          const col = i % 3
          const row = Math.floor(i / 3)
          const cx = 1 + col * (cellSize + gap) + cellSize / 2
          const cy = 1 + row * (cellSize + gap) + cellSize / 2
          const state = states[i]
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill={state === 'pass' ? '#00c2a0' : '#9e9e9e'}
              opacity={state === 'neutral' ? 0.35 : 1}
            />
          )
        })}
      </g>

      {/* Node state indicator labels */}
      <text x="120" y="225" fontSize="5" fill="rgba(0, 194, 160, 0.4)" textAnchor="middle" fontFamily="monospace">
        SIG:PASS 6/9 · GRADE:B
      </text>
      <text x="120" y="20" fontSize="4.5" fill="rgba(158, 158, 158, 0.4)" textAnchor="middle" fontFamily="monospace">
        DIAGNOSTIC MARK v2.0
      </text>
    </svg>
  )
}

// ─── Construction Diagram ────────────────────────────────────────────────────

function ConstructionDiagram() {
  const cellSize = 6
  const gap = 2
  const r = 2.2

  return (
    <svg
      width="100%"
      height="280"
      viewBox="0 0 360 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mark construction diagram showing grid measurements"
      role="img"
      className="max-w-full"
    >
      {/* Grid background */}
      {Array.from({ length: 37 }, (_, i) => (
        <line key={`v${i}`} x1={i * 10} y1={0} x2={i * 10} y2={280} stroke="rgba(0, 194, 160, 0.04)" strokeWidth="0.5" />
      ))}
      {Array.from({ length: 29 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 10} x2={360} y2={i * 10} stroke="rgba(0, 194, 160, 0.04)" strokeWidth="0.5" />
      ))}

      {/* Mark at center, scaled up */}
      <g transform="translate(120, 80) scale(5)">
        {Array.from({ length: 9 }, (_, i) => {
          const col = i % 3
          const row = Math.floor(i / 3)
          const cx = 1 + col * (cellSize + gap) + cellSize / 2
          const cy = 1 + row * (cellSize + gap) + cellSize / 2
          const state = i < 6 ? 'pass' : 'neutral'
          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={state === 'pass' ? '#00c2a0' : '#9e9e9e'}
                opacity={state === 'neutral' ? 0.35 : 1}
              />
              <circle
                cx={cx}
                cy={cy}
                r={r + 0.5}
                stroke="rgba(0, 194, 160, 0.15)"
                strokeWidth="0.3"
                strokeDasharray="1 1"
                fill="none"
              />
            </g>
          )
        })}
      </g>

      {/* Measurement lines */}
      <line x1="125" y1="68" x2="155" y2={68} stroke="#00c2a0" strokeWidth="0.5" markerEnd="url(#arrowhead)" markerStart="url(#arrowhead-start)" />
      <text x="140" y="64" fontSize="7" fill="#00c2a0" textAnchor="middle" fontFamily="monospace">6u</text>

      <line x1="155" y1="68" x2="165" y2={68} stroke="#9e9e9e" strokeWidth="0.5" />
      <text x="160" y="64" fontSize="6" fill="#9e9e9e" textAnchor="middle" fontFamily="monospace">2u</text>

      <text x="295" y="95" fontSize="7" fill="#9e9e9e" textAnchor="start" fontFamily="monospace">r = 2.2u</text>
      <line x1="260" y1="95" x2="292" y2="95" stroke="rgba(158, 158, 158, 0.3)" strokeWidth="0.5" strokeDasharray="2 2" />

      <line x1="120" y1="210" x2="240" y2={210} stroke="rgba(0, 194, 160, 0.4)" strokeWidth="0.5" />
      <text x="180" y="224" fontSize="7" fill="#00c2a0" textAnchor="middle" fontFamily="monospace">24u total (22u content + 2×1u margin)</text>

      <rect x="100" y="60" width="160" height="160" stroke="rgba(0, 194, 160, 0.15)" strokeWidth="0.5" strokeDasharray="4 2" fill="none" rx="2" />
      <text x="105" y="56" fontSize="6" fill="rgba(0, 194, 160, 0.5)" fontFamily="monospace">CLEARSPACE: 1× mark width</text>

      <text x="295" y="115" fontSize="6" fill="#9e9e9e" textAnchor="start" fontFamily="monospace">cell: 6×6u</text>
      <text x="295" y="130" fontSize="6" fill="#9e9e9e" textAnchor="start" fontFamily="monospace">gap: 2u</text>
      <text x="295" y="145" fontSize="6" fill="#9e9e9e" textAnchor="start" fontFamily="monospace">margin: 1u</text>
      <text x="295" y="160" fontSize="6" fill="#9e9e9e" textAnchor="start" fontFamily="monospace">ratio: 6:3 pass/neutral</text>
      <text x="295" y="175" fontSize="6" fill="#9e9e9e" textAnchor="start" fontFamily="monospace">pixel grid: 24×24</text>

      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <path d="M0,0 L6,2 L0,4" fill="none" stroke="#00c2a0" strokeWidth="0.5" />
        </marker>
        <marker id="arrowhead-start" markerWidth="6" markerHeight="4" refX="1" refY="2" orient="auto-start-reverse">
          <path d="M6,0 L0,2 L6,4" fill="none" stroke="#00c2a0" strokeWidth="0.5" />
        </marker>
      </defs>
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrandPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-border" aria-labelledby="hero-heading">
        <ScanLine />

        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden="true">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32 lg:py-40">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Mark with diagnostic rings */}
            <div className="relative flex-shrink-0">
              <HeroMark />
            </div>

            {/* Brand lockup + statements */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-fg-muted/50">BRAND IDENTITY SYSTEM</p>
                <h1 id="hero-heading" className="text-5xl sm:text-6xl font-extrabold tracking-display text-fg leading-none">
                  Nebula
                </h1>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-fg/80">
                  Components
                </p>
                <p className="text-xs font-mono text-accent/70 mt-2 tracking-wide">
                  The problem was never the ad. It was the page.
                </p>
              </div>

              {/* Brand statements */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4">
                {['EVIDENCE FIRST', 'PERFORMANCE AUDITS', 'ACTIONABLE INSIGHTS', 'MEASURABLE IMPACT'].map((statement) => (
                  <div key={statement} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/60" aria-hidden="true" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-fg-muted/70">{statement}</span>
                  </div>
                ))}
              </div>

              {/* Telemetry readouts */}
              <div className="flex gap-8 mt-6 pt-6 border-t border-border/50">
                <TelemetryCounter value={9} label="Signal Nodes" />
                <TelemetryCounter value={6} label="Pass States" />
                <TelemetryCounter value={3} label="Neutral States" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-20 space-y-24">

        {/* ══════════════════════════════════════════════════════════════════════
            THE MARK
        ═══════════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="mark-heading">
          <SectionLabel>01 - The Mark</SectionLabel>
          <SectionTitle id="mark-heading">Signal Node Grid</SectionTitle>
          <SectionDescription>
            9 signal nodes in a 3×3 grid. 6 pass (teal), 3 neutral (gray). Represents the B grade - honest about being good, not perfect. The mark encodes no specific audit taxonomy; it is a semantic-neutral brand glyph.
          </SectionDescription>

          {/* Interactive variant gallery */}
          <MarkGallery />

          {/* Construction diagram */}
          <div className="mt-12">
            <h3 className="text-sm font-mono uppercase tracking-widest text-fg-muted mb-4">Construction</h3>
            <DiagnosticPanel>
              <ConstructionDiagram />
            </DiagnosticPanel>
          </div>

          {/* Specifications */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <DiagnosticPanel>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">Grid Spec</h4>
              <div className="space-y-2">
                <MetaTag label="Cells" value="3 × 3" />
                <MetaTag label="Cell size" value="6 × 6 units" />
                <MetaTag label="Gap" value="2 units" />
                <MetaTag label="Radius" value="2.2 units" />
                <MetaTag label="Viewport" value="24 × 24" />
              </div>
            </DiagnosticPanel>
            <DiagnosticPanel>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">Clearspace</h4>
              <div className="space-y-2">
                <MetaTag label="Minimum" value="1× mark width" />
                <MetaTag label="Preferred" value="1.5× mark width" />
                <MetaTag label="Min size" value="12px (standard)" />
                <MetaTag label="Min size" value="16px (with labels)" />
              </div>
            </DiagnosticPanel>
            <DiagnosticPanel>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">Node Ratio</h4>
              <div className="space-y-2">
                <MetaTag label="Pass" value="6 nodes (teal)" />
                <MetaTag label="Neutral" value="3 nodes (gray)" />
                <MetaTag label="Fail" value="0 (brand mark only)" />
                <MetaTag label="Pattern" value="Top 2 rows + 1" />
              </div>
            </DiagnosticPanel>
          </div>

          {/* Downloads */}
          <div className="mt-8">
            <h3 className="text-sm font-mono uppercase tracking-widest text-fg-muted mb-4">Downloads</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['mark-dark', 'mark-light', 'mark-mono', 'mark-emerald'].map((slug) => (
                <div key={slug} className="bg-bg-surface border border-border rounded-lg p-3 space-y-2">
                  <p className="text-xs font-mono text-fg capitalize">{slug.replace('mark-', '')}</p>
                  <div className="flex flex-wrap gap-2">
                    <a href={`/brand/${slug}.svg`} download className="text-[10px] font-mono text-accent hover:text-accent-light transition-colors">SVG</a>
                    {[64, 128, 256].map((s) => (
                      <a key={s} href={`/brand/${slug}-${s}.png`} download className="text-[10px] font-mono text-fg-muted hover:text-fg transition-colors">{s}px</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            WORDMARK & LOCKUPS
        ═══════════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="wordmark-heading">
          <SectionLabel>02 - Wordmark &amp; Lockups</SectionLabel>
          <SectionTitle id="wordmark-heading">Brand Lockups</SectionTitle>
          <SectionDescription>
            The wordmark pairs with the signal-node mark in multiple configurations. Each lockup has defined spacing ratios and minimum legible sizes.
          </SectionDescription>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Horizontal lockup */}
            <DiagnosticPanel className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-widest text-fg-muted/60 mb-4">Horizontal Lockup</span>
              <div className="flex-1 flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <MarkInline size={28} />
                  <div>
                    <p className="text-lg font-bold tracking-tight text-fg leading-none">Nebula</p>
                    <p className="text-xs font-medium text-fg-muted tracking-wide">Components</p>
                  </div>
                </div>
              </div>
              <MetaTag label="Min width" value="120px" />
            </DiagnosticPanel>

            {/* Stacked lockup */}
            <DiagnosticPanel className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-widest text-fg-muted/60 mb-4">Stacked Lockup</span>
              <div className="flex-1 flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <MarkInline size={32} />
                  <div className="text-center">
                    <p className="text-lg font-bold tracking-tight text-fg leading-none">Nebula</p>
                    <p className="text-xs font-medium text-fg-muted tracking-wide">Components</p>
                  </div>
                </div>
              </div>
              <MetaTag label="Min height" value="80px" />
            </DiagnosticPanel>

            {/* Compact lockup */}
            <DiagnosticPanel className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-widest text-fg-muted/60 mb-4">Compact Lockup</span>
              <div className="flex-1 flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <MarkInline size={20} />
                  <p className="text-sm font-bold tracking-tight text-fg">Nebula</p>
                </div>
              </div>
              <MetaTag label="Min width" value="80px" />
            </DiagnosticPanel>

            {/* Icon-only */}
            <DiagnosticPanel className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-widest text-fg-muted/60 mb-4">Icon Forms</span>
              <div className="flex-1 flex items-center justify-center gap-6 py-8">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <MarkInline size={20} />
                  </div>
                  <span className="text-[9px] font-mono text-fg-muted">App Icon</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <MarkInline size={14} />
                  </div>
                  <span className="text-[9px] font-mono text-fg-muted">Favicon</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <MarkInline size={18} />
                  </div>
                  <span className="text-[9px] font-mono text-fg-muted">Avatar</span>
                </div>
              </div>
              <MetaTag label="Min size" value="16px (favicon) / 32px (avatar)" />
            </DiagnosticPanel>
          </div>

          {/* Dark/Light wordmark downloads */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-center h-24 bg-bg-surface">
                <div className="flex items-center gap-2">
                  <MarkInline size={20} />
                  <span className="text-base font-bold text-fg">Nebula Components</span>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <span className="text-xs font-mono text-fg-muted">Dark variant</span>
                <a href="/brand/wordmark-dark.svg" download className="text-xs font-mono text-accent hover:text-accent-light transition-colors">SVG ↓</a>
              </div>
            </div>
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-center h-24">
                <div className="flex items-center gap-2">
                  <MarkInlineDark size={20} />
                  <span className="text-base font-bold text-[#050505]">Nebula Components</span>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs font-mono text-gray-500">Light variant</span>
                <a href="/brand/wordmark-light.svg" download className="text-xs font-mono text-[#009980] hover:opacity-80 transition-opacity">SVG ↓</a>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            COLOR SYSTEM
        ═══════════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="colors-heading">
          <SectionLabel>03 - Color System</SectionLabel>
          <SectionTitle id="colors-heading">Diagnostic Palette</SectionTitle>
          <SectionDescription>
            A restrained palette optimized for dark interfaces and maximum contrast ratios. Signal Teal is the sole chromatic accent - everything else is grayscale.
          </SectionDescription>

          {/* Primary palette */}
          <div className="space-y-3">
            {colors.map((c) => (
              <DiagnosticPanel key={c.hex} className="grid grid-cols-1 sm:grid-cols-[80px_1fr] gap-4 items-start">
                <div
                  className="w-full sm:w-16 h-16 rounded-lg border border-border shrink-0"
                  style={{ backgroundColor: c.hex }}
                  aria-hidden="true"
                />
                <div className="space-y-2 min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-sm font-medium text-fg">{c.name}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${
                      c.semantic === 'brand' ? 'bg-accent/10 text-accent' :
                      c.semantic === 'fail' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' :
                      'bg-border text-fg-muted'
                    }`}>{c.semantic}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[9px] font-mono text-fg-muted/50 uppercase">HEX</span>
                      <CopyButton value={c.hex} label={`${c.name} hex`} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[9px] font-mono text-fg-muted/50 uppercase">RGB</span>
                      <CopyButton value={c.rgb} label={`${c.name} RGB`} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[9px] font-mono text-fg-muted/50 uppercase">HSL</span>
                      <CopyButton value={c.hsl} label={`${c.name} HSL`} />
                    </div>
                  </div>
                  <p className="text-xs text-fg-muted">{c.role}</p>
                  <p className="text-[10px] font-mono text-fg-muted/70">↳ {c.a11y}</p>
                </div>
              </DiagnosticPanel>
            ))}
          </div>

          {/* Semantic states */}
          <div className="mt-10">
            <h3 className="text-sm font-mono uppercase tracking-widest text-fg-muted mb-4">Semantic States</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {semanticColors.map((sc) => (
                <div key={sc.name} className="bg-bg-surface border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sc.hex }} aria-hidden="true" />
                    <span className="text-xs font-medium text-fg">{sc.name}</span>
                  </div>
                  <CopyButton value={sc.hex} label={sc.name} />
                  <p className="text-[10px] text-fg-muted mt-1">{sc.usage}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contrast pairs */}
          <div className="mt-10">
            <h3 className="text-sm font-mono uppercase tracking-widest text-fg-muted mb-4">Contrast Ratios</h3>
            <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-px bg-border text-xs font-mono">
                <div className="bg-bg-surface px-3 py-2 text-fg-muted/60 uppercase text-[9px] tracking-widest">Foreground</div>
                <div className="bg-bg-surface px-3 py-2 text-fg-muted/60 uppercase text-[9px] tracking-widest">Background</div>
                <div className="bg-bg-surface px-3 py-2 text-fg-muted/60 uppercase text-[9px] tracking-widest">Ratio</div>
                <div className="bg-bg-surface px-3 py-2 text-fg-muted/60 uppercase text-[9px] tracking-widest">Level</div>
                {contrastPairs.map((pair, i) => (
                  <div key={i} className="contents">
                    <div className="bg-bg-surface px-3 py-2 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm border border-border" style={{ backgroundColor: pair.fg }} />
                      <span className="text-fg-muted">{pair.fg}</span>
                    </div>
                    <div className="bg-bg-surface px-3 py-2 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm border border-border" style={{ backgroundColor: pair.bg }} />
                      <span className="text-fg-muted">{pair.bg}</span>
                    </div>
                    <div className="bg-bg-surface px-3 py-2 text-fg tabular-nums">{pair.ratio}</div>
                    <div className="bg-bg-surface px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                        pair.level === 'AAA' ? 'bg-accent/10 text-accent' : 'bg-border text-fg-muted'
                      }`}>{pair.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            TYPOGRAPHY
        ═══════════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="typography-heading">
          <SectionLabel>04 - Typography</SectionLabel>
          <SectionTitle id="typography-heading">Type Scale</SectionTitle>
          <SectionDescription>
            System sans-serif for interface and body. Monospace for evidence atoms, scores, diagnostics, and technical labels. No web fonts - zero FOUT, no external requests.
          </SectionDescription>

          {/* Font stacks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <DiagnosticPanel>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">Sans-serif Stack</h4>
              <p className="text-xs font-mono text-fg-muted break-all">-apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, system-ui, sans-serif</p>
              <p className="text-[10px] text-fg-muted/60 mt-2">UI, body copy, headings, navigation</p>
            </DiagnosticPanel>
            <DiagnosticPanel>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">Monospace Stack</h4>
              <p className="text-xs font-mono text-fg-muted break-all">JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace</p>
              <p className="text-[10px] text-fg-muted/60 mt-2">Scores, metrics, code, labels, telemetry</p>
            </DiagnosticPanel>
          </div>

          {/* Type scale table */}
          <div className="space-y-2">
            {typographyScale.map((t) => (
              <div key={t.name} className="bg-bg-surface border border-border rounded-xl p-4 grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4 items-start">
                {/* Specs */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-fg">{t.name}</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    <MetaTag label="Size" value={t.size} />
                    <MetaTag label="LH" value={t.lineHeight} />
                    <MetaTag label="Wt" value={t.weight} />
                    <MetaTag label="Track" value={t.tracking} />
                    {t.case !== 'None' && <MetaTag label="Case" value={t.case} />}
                  </div>
                </div>
                {/* Live example */}
                <div className="flex items-center min-h-[2rem]">
                  <p
                    className={`text-fg ${t.name === 'Code / Data' || t.name === 'Telemetry' || t.name === 'Score' ? 'font-mono' : ''} ${t.case === 'Uppercase' ? 'uppercase' : ''}`}
                    style={{
                      fontSize: t.size.includes('clamp') ? undefined : t.size,
                      lineHeight: t.lineHeight,
                      fontWeight: t.weight as unknown as number,
                      letterSpacing: t.tracking,
                      ...(t.size.includes('clamp') ? { fontSize: '2.5rem' } : {}),
                    }}
                  >
                    {t.example}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            ICONOGRAPHY & DATA VIZ
        ═══════════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="icons-heading">
          <SectionLabel>05 - Iconography &amp; Data Visualization</SectionLabel>
          <SectionTitle id="icons-heading">Visual Language</SectionTitle>
          <SectionDescription>
            Geometric, minimal icons with consistent 1.5px stroke weight on a 24×24 grid. Square or circular technical geometry - no decorative flourishes.
          </SectionDescription>

          {/* Icon examples */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-10">
            {iconExamples.map((icon) => (
              <div key={icon.name} className="bg-bg-surface border border-border rounded-lg p-4 flex flex-col items-center gap-2 group hover:border-accent/30 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-fg-muted group-hover:text-accent transition-colors" aria-hidden="true">
                  <path d={icon.path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[9px] font-mono text-fg-muted uppercase tracking-wider">{icon.name}</span>
              </div>
            ))}
          </div>

          {/* Icon specifications */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <DiagnosticPanel>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">Stroke</h4>
              <div className="space-y-2">
                <MetaTag label="Weight" value="1.5px" />
                <MetaTag label="Cap" value="Round" />
                <MetaTag label="Join" value="Round" />
                <MetaTag label="Grid" value="24 × 24" />
              </div>
            </DiagnosticPanel>
            <DiagnosticPanel>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">Geometry</h4>
              <div className="space-y-2">
                <MetaTag label="Style" value="Geometric minimal" />
                <MetaTag label="Shape" value="Square / Circular" />
                <MetaTag label="Detail" value="Functional only" />
                <MetaTag label="Fill" value="None (outline only)" />
              </div>
            </DiagnosticPanel>
            <DiagnosticPanel>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">Colors</h4>
              <div className="space-y-2">
                <MetaTag label="Default" value="fg-muted (#9e9e9e)" />
                <MetaTag label="Active" value="accent (#00c2a0)" />
                <MetaTag label="Error" value="danger (#f37979)" />
                <MetaTag label="Disabled" value="fg-dim (0.3 opacity)" />
              </div>
            </DiagnosticPanel>
          </div>

          {/* Data visualization guidance */}
          <h3 className="text-sm font-mono uppercase tracking-widest text-fg-muted mb-4">Chart Styling</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DiagnosticPanel>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">Line Charts &amp; Score Rings</h4>
              <div className="space-y-2">
                <MetaTag label="Primary line" value="Signal Teal, 2px" />
                <MetaTag label="Secondary" value="fg-muted, 1px dashed" />
                <MetaTag label="Grid" value="border (0.06 opacity)" />
                <MetaTag label="Score ring" value="Teal arc on dark track" />
                <MetaTag label="Label" value="Monospace, 10px, fg-muted" />
              </div>
            </DiagnosticPanel>
            <DiagnosticPanel>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">Heat Maps &amp; Node Maps</h4>
              <div className="space-y-2">
                <MetaTag label="Scale" value="Near Black → Teal (5 stops)" />
                <MetaTag label="Node active" value="Teal at full opacity" />
                <MetaTag label="Node idle" value="Gray at 0.3 opacity" />
                <MetaTag label="Background" value="bg-surface" />
                <MetaTag label="Annotation" value="Monospace, muted" />
              </div>
            </DiagnosticPanel>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            USAGE RULES
        ═══════════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="usage-heading">
          <SectionLabel>06 - Usage Rules</SectionLabel>
          <SectionTitle id="usage-heading">Approved &amp; Prohibited</SectionTitle>
          <SectionDescription>
            The mark is a precision instrument. Treat it with the same care as diagnostic equipment - no decorative embellishment, no arbitrary modification.
          </SectionDescription>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Do */}
            <DiagnosticPanel>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-accent" aria-hidden="true" />
                <h3 className="text-xs font-mono uppercase tracking-widest text-accent">Approved Usage</h3>
              </div>
              <ul className="space-y-3" role="list">
                {doRules.map((item) => (
                  <li key={item.rule} className="flex gap-3 text-sm text-fg-muted leading-relaxed">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5 text-accent" aria-hidden="true">
                      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item.rule}
                  </li>
                ))}
              </ul>
            </DiagnosticPanel>

            {/* Don't */}
            <DiagnosticPanel>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]" aria-hidden="true" />
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#f59e0b]">Prohibited</h3>
              </div>
              <ul className="space-y-3" role="list">
                {dontRules.map((item) => (
                  <li key={item.rule} className="flex gap-3 text-sm text-fg-muted leading-relaxed">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5 text-[#f59e0b]" aria-hidden="true">
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {item.rule}
                  </li>
                ))}
              </ul>
            </DiagnosticPanel>
          </div>

          {/* Visual examples */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Correct', ok: true, desc: 'Dark bg, clearspace' },
              { label: 'Distorted', ok: false, desc: 'Stretched / skewed' },
              { label: 'Low contrast', ok: false, desc: 'Insufficient ratio' },
              { label: 'Recolored', ok: false, desc: 'Off-brand colors' },
              { label: 'Excessive glow', ok: false, desc: 'Drop shadow / bloom' },
              { label: 'Too small', ok: false, desc: 'Below 12px' },
            ].map((ex) => (
              <div key={ex.label} className="bg-bg-surface border border-border rounded-lg p-3 text-center">
                <div className={`w-10 h-10 mx-auto mb-2 rounded flex items-center justify-center ${ex.ok ? 'bg-bg' : 'bg-bg opacity-60'}`}>
                  <MarkInline size={ex.label === 'Too small' ? 8 : 20} />
                </div>
                <p className={`text-[9px] font-mono uppercase tracking-wider ${ex.ok ? 'text-accent' : 'text-[#f59e0b]'}`}>
                  {ex.ok ? '✓' : '✗'} {ex.label}
                </p>
                <p className="text-[9px] text-fg-muted mt-0.5">{ex.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            MOTION
        ═══════════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="motion-heading">
          <SectionLabel>07 - Motion</SectionLabel>
          <SectionTitle id="motion-heading">Animation System</SectionTitle>
          <SectionDescription>
            Restrained technical motion that communicates system state. All animations respect prefers-reduced-motion. Nothing purely decorative - every movement carries information.
          </SectionDescription>

          <div className="space-y-2">
            {motionSpecs.map((m) => (
              <div key={m.name} className="bg-bg-surface border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-start">
                <div>
                  <p className="text-xs font-medium text-fg">{m.name}</p>
                  <p className="text-[10px] text-fg-muted mt-0.5">{m.description}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <MetaTag label="Duration" value={m.duration} />
                  <MetaTag label="Easing" value={m.easing} />
                  <MetaTag label="Trigger" value={m.trigger} />
                </div>
              </div>
            ))}
          </div>

          <DiagnosticPanel className="mt-6">
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">Reduced Motion</h4>
            <p className="text-xs text-fg-muted leading-relaxed">
              When <code className="font-mono text-accent/80 px-1 py-0.5 bg-accent/5 rounded">prefers-reduced-motion: reduce</code> is active, all animations collapse to instant transitions (≤0.01ms). Scan lines, ring rotation, and counter animations are disabled entirely. Hover state changes remain but without duration.
            </p>
          </DiagnosticPanel>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            CONTACT
        ═══════════════════════════════════════════════════════════════════════ */}
        <footer className="border-t border-border pt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-fg-muted/60 mb-2">Press &amp; Custom Usage</p>
              <p className="text-sm text-fg-muted">
                For press inquiries, partnership assets, or custom usage not covered above, contact{' '}
                <a
                  href="mailto:hello@nebulacomponents.com"
                  className="text-accent underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  hello@nebulacomponents.com
                </a>
              </p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-fg-muted/60 mb-2">Version</p>
              <div className="space-y-1">
                <MetaTag label="System" value="Brand Kit v2.0" />
                <MetaTag label="Updated" value="2026-08-06" />
                <MetaTag label="Format" value="Tailwind CSS + React" />
              </div>
            </div>
          </div>
        </footer>

      </div>
    </main>
  )
}

// ─── Inline Mark (server-rendered) ───────────────────────────────────────────

function MarkInline({ size = 24 }: { size?: number }) {
  const cellSize = 6
  const gap = 2
  const r = 2.2
  const states = ['pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'neutral', 'neutral', 'neutral']

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const cx = 1 + col * (cellSize + gap) + cellSize / 2
        const cy = 1 + row * (cellSize + gap) + cellSize / 2
        const state = states[i]
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill={state === 'pass' ? '#00c2a0' : '#9e9e9e'}
            opacity={state === 'neutral' ? 0.35 : 1}
          />
        )
      })}
    </svg>
  )
}

function MarkInlineDark({ size = 24 }: { size?: number }) {
  const cellSize = 6
  const gap = 2
  const r = 2.2
  const states = ['pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'neutral', 'neutral', 'neutral']

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const cx = 1 + col * (cellSize + gap) + cellSize / 2
        const cy = 1 + row * (cellSize + gap) + cellSize / 2
        const state = states[i]
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill={state === 'pass' ? '#009980' : '#666666'}
            opacity={state === 'neutral' ? 0.5 : 1}
          />
        )
      })}
    </svg>
  )
}
