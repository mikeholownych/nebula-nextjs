import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Brand Kit — Nebula Components',
  description:
    'Official brand assets, logo usage guidelines, and color tokens for Nebula Components.',
  alternates: {
    canonical: 'https://nebulacomponents.com/brand',
  },
}

// ─── Data ────────────────────────────────────────────────────────────────────

const markVariants = [
  {
    name: 'Dark',
    slug: 'mark-dark',
    src: '/brand/mark-dark.svg',
    bg: 'bg-bg-surface',
    label: 'Dark background',
    lightCard: false,
  },
  {
    name: 'Light',
    slug: 'mark-light',
    src: '/brand/mark-light.svg',
    bg: 'bg-white',
    label: 'Light background',
    lightCard: true,
  },
  {
    name: 'Mono',
    slug: 'mark-mono',
    src: '/brand/mark-mono.svg',
    bg: 'bg-bg-surface',
    label: 'Monochrome',
    lightCard: false,
  },
  {
    name: 'Emerald',
    slug: 'mark-emerald',
    src: '/brand/mark-emerald.svg',
    bg: 'bg-bg-surface',
    label: 'All-pass',
    lightCard: false,
  },
]

const pngSizes = [64, 128, 256]

const wordmarkVariants = [
  {
    name: 'Wordmark — Dark',
    slug: 'wordmark-dark',
    src: '/brand/wordmark-dark.svg',
    lightCard: false,
  },
  {
    name: 'Wordmark — Light',
    slug: 'wordmark-light',
    src: '/brand/wordmark-light.svg',
    lightCard: true,
  },
]

const colors = [
  {
    name: 'Signal Teal',
    hex: '#00c2a0',
    usage: 'Primary accent, pass states, CTAs',
  },
  {
    name: 'Near Black',
    hex: '#050505',
    usage: 'Primary background',
  },
  {
    name: 'Off White',
    hex: '#F5F5F5',
    usage: 'Primary foreground',
  },
  {
    name: 'Muted Gray',
    hex: '#9e9e9e',
    usage: 'Secondary text',
  },
  {
    name: 'Signal Fail',
    hex: '#f59e0b',
    usage: 'Fail/warning states only',
  },
]

const doRules = [
  'Use the mark on dark backgrounds with adequate clearspace.',
  'Use Signal Teal (#00c2a0) as the only chromatic accent in brand contexts.',
  "Refer to the product as 'Nebula' or 'Nebula Components'.",
]

const dontRules = [
  'Modify the grid pattern or change individual node colors.',
  'Use the mark on backgrounds that reduce contrast below WCAG AA.',
  'Animate the mark in ways that change node states without reflecting real audit data.',
  "Refer to us as a 'CRO agency' or 'landing page optimization service'.",
]

// ─── Components ──────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-fg tracking-tight border-b border-border pb-3 mb-6">
      {children}
    </h2>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrandPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="max-w-4xl mx-auto px-6 py-20 space-y-20">

        {/* ── Header ── */}
        <header className="space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-accent">
            Brand Kit
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-fg leading-tight">
            Official assets and usage guidelines.
          </h1>
          <p className="text-fg-muted max-w-2xl leading-relaxed">
            Use these assets when writing about or referencing Nebula
            Components. If you need something not listed here, email{' '}
            <a
              href="mailto:hello@nebulacomponents.com"
              className="text-accent underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              hello@nebulacomponents.com
            </a>
            .
          </p>
        </header>

        {/* ── The Mark ── */}
        <section>
          <SectionHeader>The Mark</SectionHeader>
          <p className="text-fg-muted mb-8 leading-relaxed">
            9 signal nodes. 6 pass (teal), 3 neutral (dark). The B grade —
            honest about being good, not perfect.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {markVariants.map((v) => (
              <div
                key={v.slug}
                className="rounded-xl border border-border overflow-hidden"
              >
                {/* Preview */}
                <div
                  className={`flex items-center justify-center h-48 ${
                    v.lightCard ? 'bg-white' : 'bg-bg-surface'
                  }`}
                >
                  <img
                    src={v.src}
                    alt={`Nebula mark — ${v.name} variant`}
                    className="h-20 w-20 object-contain"
                  />
                </div>

                {/* Meta + downloads */}
                <div className="bg-bg-surface px-4 py-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-fg">{v.name}</p>
                    <p className="text-xs text-fg-muted">{v.label}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={v.src}
                      download={`nebula-${v.slug}.svg`}
                      className="text-xs font-mono text-accent hover:opacity-80 transition-opacity"
                    >
                      SVG ↓
                    </a>
                    {pngSizes.map((size) => (
                      <a
                        key={size}
                        href={`/brand/${v.slug}-${size}.png`}
                        download={`nebula-${v.slug}-${size}.png`}
                        className="text-xs font-mono text-fg-muted hover:text-fg transition-colors"
                      >
                        PNG {size}px ↓
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Wordmark ── */}
        <section>
          <SectionHeader>Wordmark</SectionHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wordmarkVariants.map((v) => (
              <div
                key={v.slug}
                className="rounded-xl border border-border overflow-hidden"
              >
                {/* Preview */}
                <div
                  className={`flex items-center justify-center h-32 ${
                    v.lightCard ? 'bg-white' : 'bg-bg-surface'
                  }`}
                >
                  <img
                    src={v.src}
                    alt={v.name}
                    className="h-8 object-contain"
                  />
                </div>

                {/* Downloads */}
                <div className="bg-bg-surface px-4 py-4 space-y-3">
                  <p className="text-sm font-medium text-fg">{v.name}</p>
                  <div className="flex gap-3">
                    <a
                      href={v.src}
                      download={`nebula-${v.slug}.svg`}
                      className="text-xs font-mono text-accent hover:opacity-80 transition-opacity"
                    >
                      SVG ↓
                    </a>
                    <a
                      href={`/brand/${v.slug}-2x.png`}
                      download={`nebula-${v.slug}-2x.png`}
                      className="text-xs font-mono text-fg-muted hover:text-fg transition-colors"
                    >
                      PNG 2× ↓
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Brand Colors ── */}
        <section>
          <SectionHeader>Brand Colors</SectionHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {colors.map((c) => (
              <div
                key={c.hex}
                className="rounded-xl border border-border overflow-hidden bg-bg-surface"
              >
                {/* Swatch */}
                <div
                  className="h-20 w-full"
                  style={{ backgroundColor: c.hex }}
                  aria-hidden="true"
                />
                {/* Info */}
                <div className="px-4 py-4 space-y-1">
                  <p className="text-sm font-medium text-fg">{c.name}</p>
                  <p className="text-xs font-mono text-accent">{c.hex}</p>
                  <p className="text-xs text-fg-muted">{c.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Typography ── */}
        <section>
          <SectionHeader>Typography</SectionHeader>

          <div className="space-y-6">
            <div className="bg-bg-surface border border-border rounded-xl px-6 py-5 space-y-2">
              <p className="text-xs text-fg-muted uppercase tracking-widest font-mono">
                Sans-serif — UI &amp; body
              </p>
              <p className="text-sm font-medium text-fg">System font stack</p>
              <p className="text-xs font-mono text-accent break-all">
                -apple-system, BlinkMacSystemFont, Segoe UI, system-ui,
                sans-serif
              </p>
            </div>

            <div className="bg-bg-surface border border-border rounded-xl px-6 py-5 space-y-2">
              <p className="text-xs text-fg-muted uppercase tracking-widest font-mono">
                Monospace — evidence atoms &amp; scores
              </p>
              <p className="text-sm font-medium text-fg">Monospace stack</p>
              <p className="text-xs font-mono text-accent break-all">
                ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
              </p>
            </div>

            <p className="text-xs text-fg-muted">
              No web fonts. System fonts only — faster, no FOUT, no external
              requests.
            </p>
          </div>
        </section>

        {/* ── Usage Rules ── */}
        <section>
          <SectionHeader>Usage Rules</SectionHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Do */}
            <div className="bg-bg-surface border border-border rounded-xl px-6 py-5 space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-accent">
                Do
              </p>
              <ul className="space-y-2">
                {doRules.map((rule) => (
                  <li
                    key={rule}
                    className="flex gap-2 text-sm text-fg-muted leading-relaxed"
                  >
                    <span className="text-accent mt-0.5 shrink-0">✓</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Don't */}
            <div className="bg-bg-surface border border-border rounded-xl px-6 py-5 space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-[#f59e0b]">
                Don't
              </p>
              <ul className="space-y-2">
                {dontRules.map((rule) => (
                  <li
                    key={rule}
                    className="flex gap-2 text-sm text-fg-muted leading-relaxed"
                  >
                    <span className="text-[#f59e0b] mt-0.5 shrink-0">✗</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Contact ── */}
        <footer className="border-t border-border pt-10">
          <p className="text-sm text-fg-muted">
            For press inquiries or custom usage, email{' '}
            <a
              href="mailto:hello@nebulacomponents.com"
              className="text-accent underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              hello@nebulacomponents.com
            </a>
            .
          </p>
        </footer>

      </div>
    </main>
  )
}
