import { CROSS_INDUSTRY_PAID_TRAFFIC_STUDY } from '@/app/lib/brand-evidence'
import { CopyPanel, PressReleaseTabs, ScanLine } from './PressKitClient'

// ─── Server Primitives ───────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">
      {children}
    </p>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl sm:text-3xl font-semibold text-fg tracking-tight mb-3">
      {children}
    </h2>
  )
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-fg-muted leading-relaxed max-w-2xl">{children}</p>
}

function DiagnosticPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative bg-bg-panel border border-border rounded-2xl p-6 sm:p-8 overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

function MetaTag({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px]">
      <span className="uppercase tracking-widest text-fg-muted/50">{label}</span>
      <span className="text-accent tabular-nums">{value}</span>
    </div>
  )
}

function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-bg-surface border border-border rounded-xl p-5 text-center">
      <p className="text-2xl sm:text-3xl font-semibold text-fg tabular-nums mb-1">{value}</p>
      <p className="text-xs font-mono uppercase tracking-wide text-fg-muted">{label}</p>
      {note && <p className="text-[10px] text-fg-muted/60 mt-1.5">{note}</p>}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PressPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <section className="relative py-24 sm:py-32 px-6 overflow-hidden" aria-labelledby="press-hero-title">
        <ScanLine />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
            <MetaTag label="System" value="Press // Newsroom" />
            <MetaTag label="Rev" value="2026.08" />
            <MetaTag label="Status" value="Active" />
          </div>
          <h1
            id="press-hero-title"
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5"
          >
            Press &amp; Media
          </h1>
          <p className="text-base sm:text-lg text-fg-muted max-w-2xl mx-auto mb-8">
            Everything journalists, analysts, and partners need to write about Nebula Components.
            All facts, assets, and copy are pre-cleared for editorial use.
          </p>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" aria-hidden="true" />
        </div>
      </section>

      {/* ─── Company Facts Panel ──────────────────────────────────── */}
      <section className="px-6 pb-20" aria-labelledby="company-facts-title">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>01 / Company Facts</SectionLabel>
          <SectionTitle><span id="company-facts-title">Diagnostic Overview</span></SectionTitle>
          <SectionDescription>
            Core metrics and positioning data for press reference.
          </SectionDescription>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            <StatCard label="Signals Checked" value="9" note="per audit" />
            <StatCard label="Audit Time" value="<90s" note="AI-powered" />
            <StatCard label="Pages Audited" value={`${CROSS_INDUSTRY_PAID_TRAFFIC_STUDY.sampleSize}+`} note="cross-industry study" />
            <StatCard label="Average Score" value={`${CROSS_INDUSTRY_PAID_TRAFFIC_STUDY.averageScore}`} note="out of 100" />
          </div>

          <DiagnosticPanel className="mt-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted/60">Company</p>
                <dl className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <dt className="text-fg-muted min-w-[80px]">Name</dt>
                    <dd className="text-fg font-medium">Nebula Components</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-fg-muted min-w-[80px]">Domain</dt>
                    <dd className="text-fg font-medium font-mono text-xs">nebulacomponents.shop</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-fg-muted min-w-[80px]">Founded</dt>
                    <dd className="text-fg font-medium">2026</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-fg-muted min-w-[80px]">Category</dt>
                    <dd className="text-fg font-medium">Conversion diagnostics</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-fg-muted min-w-[80px]">Model</dt>
                    <dd className="text-fg font-medium">One-Leak Repair Sprint ($97)</dd>
                  </div>
                </dl>
              </div>
              <div className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted/60">Positioning</p>
                <p className="text-sm text-fg-muted leading-relaxed">
                  Nebula Components diagnoses why landing pages leak conversions - then fixes them.
                  The platform checks 9 conversion signals in under 90 seconds and delivers a
                  scored report with specific remediation steps. No retainer, no A/B-test theater,
                  no month-long timelines.
                </p>
                <p className="text-xs text-fg-muted/60 italic">
                  &ldquo;The problem was never the ad. It was the page.&rdquo;
                </p>
              </div>
            </div>
          </DiagnosticPanel>
        </div>
      </section>

      {/* ─── Signal Failure Frequency ────────────────────────────── */}
      <section className="px-6 pb-20" aria-labelledby="signal-failure-title">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>02 / Research Data</SectionLabel>
          <SectionTitle><span id="signal-failure-title">Signal Failure Frequency</span></SectionTitle>
          <SectionDescription>
            From our {CROSS_INDUSTRY_PAID_TRAFFIC_STUDY.denominator}.
            These figures are cleared for editorial use with attribution.
          </SectionDescription>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left border-collapse" role="table">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-widest text-fg-muted/60">Signal</th>
                  <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-widest text-fg-muted/60 text-right">Fail Rate</th>
                  <th className="py-3 font-mono text-[10px] uppercase tracking-widest text-fg-muted/60 hidden sm:table-cell">Distribution</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { signal: 'Above-Fold Content', rate: '100%', bar: 100 },
                  { signal: 'Ad Signal Continuity', rate: '99%', bar: 99 },
                  { signal: 'Trust Signal Density', rate: '79%', bar: 79 },
                  { signal: 'CTA Hierarchy', rate: '72%', bar: 72 },
                  { signal: 'Social Proof Freshness', rate: '68%', bar: 68 },
                  { signal: 'Mobile CTA Accessibility', rate: '59%', bar: 59 },
                  { signal: 'Message Match', rate: '54%', bar: 54 },
                  { signal: 'Objection Handling', rate: '47%', bar: 47 },
                  { signal: 'Load Speed', rate: '29%', bar: 29 },
                ].map((row) => (
                  <tr key={row.signal} className="border-b border-border/50">
                    <td className="py-3 pr-4 text-fg font-medium">{row.signal}</td>
                    <td className="py-3 pr-4 text-right font-mono text-xs tabular-nums text-accent">{row.rate}</td>
                    <td className="py-3 hidden sm:table-cell">
                      <div className="w-full max-w-[200px] h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent/60 rounded-full"
                          style={{ width: `${row.bar}%` }}
                          role="img"
                          aria-label={`${row.rate} failure rate`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[10px] font-mono text-fg-muted/50">
            Source: {CROSS_INDUSTRY_PAID_TRAFFIC_STUDY.source}, {CROSS_INDUSTRY_PAID_TRAFFIC_STUDY.date}. n={CROSS_INDUSTRY_PAID_TRAFFIC_STUDY.sampleSize}. Score scale: {CROSS_INDUSTRY_PAID_TRAFFIC_STUDY.scoreScale}. Attribution required for reproduction.
          </p>
        </div>
      </section>

      {/* ─── Press Releases & Story Angles ────────────────────────── */}
      <section className="px-6 pb-20" aria-labelledby="press-releases-title">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>03 / Press Content</SectionLabel>
          <SectionTitle><span id="press-releases-title">Releases &amp; Angles</span></SectionTitle>
          <SectionDescription>
            Press releases, ready-to-use story angles, and key research data points.
          </SectionDescription>

          <div className="mt-8">
            <PressReleaseTabs>
              <div className="space-y-4">
                <DiagnosticPanel>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted/60 mb-3">Key figures for citation</p>
                  <ul className="space-y-2 text-sm text-fg-muted">
                    <li className="flex items-baseline gap-2">
                      <span className="text-accent font-mono text-xs">{CROSS_INDUSTRY_PAID_TRAFFIC_STUDY.averageScore}</span>
                      <span>Average audit score across {CROSS_INDUSTRY_PAID_TRAFFIC_STUDY.sampleSize} pages (Grade {CROSS_INDUSTRY_PAID_TRAFFIC_STUDY.grade})</span>
                    </li>
                    <li className="flex items-baseline gap-2">
                      <span className="text-accent font-mono text-xs">0</span>
                      <span>Pages that scored an A</span>
                    </li>
                    <li className="flex items-baseline gap-2">
                      <span className="text-accent font-mono text-xs">100%</span>
                      <span>Pages failing above-fold content signal</span>
                    </li>
                    <li className="flex items-baseline gap-2">
                      <span className="text-accent font-mono text-xs">99%</span>
                      <span>Pages failing ad signal continuity</span>
                    </li>
                    <li className="flex items-baseline gap-2">
                      <span className="text-accent font-mono text-xs">29%</span>
                      <span>Pages failing load speed (the least common failure)</span>
                    </li>
                    <li className="flex items-baseline gap-2">
                      <span className="text-accent font-mono text-xs">&lt;90s</span>
                      <span>Time to complete a full 9-signal audit</span>
                    </li>
                  </ul>
                </DiagnosticPanel>
              </div>
            </PressReleaseTabs>
          </div>
        </div>
      </section>

      {/* ─── Leadership ───────────────────────────────────────────── */}
      <section className="px-6 pb-20" aria-labelledby="leadership-title">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>04 / Leadership</SectionLabel>
          <SectionTitle><span id="leadership-title">Founder</span></SectionTitle>

          <DiagnosticPanel className="mt-8">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                  <span className="font-mono text-lg text-accent">MH</span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-fg">Mike Holownych</p>
                  <p className="text-xs font-mono uppercase tracking-wide text-fg-muted">Founder &amp; CEO</p>
                </div>
              </div>
              <p className="text-sm text-fg-muted leading-relaxed">
                Former growth engineer. Built and scaled paid acquisition systems before realizing
                the entire industry optimizes the wrong layer - ad spend and bidding - while the
                landing page (the thing that actually converts) is treated as a static artifact.
                Nebula exists to fix that structural failure.
              </p>
              <p className="text-xs text-fg-muted/60">
                Available for interviews on conversion diagnostics, landing page optimization
                methodology, and the failures of the CRO agency model.
              </p>
              <div className="flex flex-wrap gap-3 pt-2 border-t border-border/50">
                <a
                  href="https://linkedin.com/in/mikeholownych"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-accent hover:text-fg transition-colors"
                >
                  LinkedIn
                </a>
                <a
                  href="https://x.com/mikeholownych"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-accent hover:text-fg transition-colors"
                >
                  X / Twitter
                </a>
                <a
                  href="mailto:hello@nebulacomponents.com"
                  className="font-mono text-[10px] text-accent hover:text-fg transition-colors"
                >
                  hello@nebulacomponents.com
                </a>
              </div>
            </div>
          </DiagnosticPanel>
        </div>
      </section>

      {/* ─── Boilerplate Copy ─────────────────────────────────────── */}
      <section className="px-6 pb-20" aria-labelledby="boilerplate-title">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>05 / Boilerplate</SectionLabel>
          <SectionTitle><span id="boilerplate-title">Company Description</span></SectionTitle>
          <SectionDescription>
            Pre-approved copy in three lengths. Click to copy for immediate editorial use.
          </SectionDescription>

          <div className="mt-8 space-y-4">
            <CopyPanel
              label="Short boilerplate"
              filename="boilerplate-short.txt"
              value="Nebula Components is a conversion diagnostics platform that audits landing pages against 9 evidence-based signals and delivers scored reports with specific fixes. $97 One-Leak Repair Sprint - one tailored fix, customer-implemented, no retainer."
            />
            <CopyPanel
              label="Medium boilerplate"
              filename="boilerplate-medium.txt"
              value={`Nebula Components diagnoses why landing pages leak conversions. The platform's AI-powered audit checks 9 conversion signals - from message match and trust density to mobile CTA accessibility - in under 90 seconds. Each audit produces a scored report with specific remediation steps.\n\nThe $97 One-Leak Repair Sprint delivers a tailored implementation guide for the highest-confidence failing signal, designed for the customer or their developer to execute. No retainer, no A/B-test theater, no month-long timelines. A cross-industry study of 86 pages found an average score of 62.7/100, with zero pages earning an A.`}
            />
            <CopyPanel
              label="Long boilerplate"
              filename="boilerplate-long.txt"
              value={`Nebula Components is a conversion diagnostics platform for founders and operators burning ad spend on underperforming landing pages. The platform audits pages against 9 evidence-based conversion signals - message match, above-fold content, trust signal density, CTA hierarchy, social proof freshness, mobile CTA accessibility, ad signal continuity, objection handling, and load speed - delivering a scored report in under 90 seconds.\n\nThe company's research arm has published findings from automated audits of 86+ landing pages running paid traffic across ecommerce, B2B SaaS, and coaching/consulting verticals. Key finding: the average page scores 62.7/100 (Grade C), and zero pages earned an A. The two most common failures - above-fold content (100%) and ad signal continuity (99%) - are invisible to traditional speed-focused tools like PageSpeed Insights.\n\nNebula's commercial model is a one-time $97 One-Leak Repair Sprint: a tailored implementation guide for the highest-confidence failing signal, written for the customer or their developer to execute. The company positions against the retainer-first CRO agency model, arguing that agencies sell ongoing optimization before completing basic diagnosis - "A/B testing on pages without enough traffic for statistical significance, 90-day timelines for problems fixable in a week."`}
            />
          </div>
        </div>
      </section>

      {/* ─── Media Assets ─────────────────────────────────────────── */}
      <section className="px-6 pb-20" aria-labelledby="media-assets-title">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>06 / Media Assets</SectionLabel>
          <SectionTitle><span id="media-assets-title">Downloadable Assets</span></SectionTitle>
          <SectionDescription>
            Logos, screenshots, and research visuals cleared for editorial use.
            See the full brand system at <a href="/brand" className="text-accent hover:text-fg underline underline-offset-2">/brand</a>.
          </SectionDescription>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {[
              {
                name: 'Nebula Wordmark (SVG)',
                file: '/brand/wordmark-dark.svg',
                type: 'Logo',
              },
              {
                name: 'Nebula Mark (SVG)',
                file: '/brand/mark-dark.svg',
                type: 'Logo',
              },
              {
                name: 'Grade Distribution Chart',
                file: '/press/grade-distribution.png',
                type: 'Research',
              },
              {
                name: 'Scorecard Example',
                file: '/press/scorecard-example.png',
                type: 'Screenshot',
              },
              {
                name: 'Founder Photo',
                file: '/mike-holownych-founder.jpg',
                type: 'Photo',
              },
            ].map((asset) => (
              <a
                key={asset.file}
                href={asset.file}
                download
                className="group block bg-bg-surface border border-border rounded-xl p-5 hover:border-accent/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${
                    asset.type === 'Research' ? 'bg-accent/10 text-accent' :
                    asset.type === 'Logo' ? 'bg-border text-fg-muted' :
                    'bg-secondary/10 text-secondary'
                  }`}>{asset.type}</span>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-fg-muted group-hover:text-accent transition-colors" aria-hidden="true">
                    <path d="M8 2v9m0 0l-3-3m3 3l3-3M3 13h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-fg">{asset.name}</p>
                <p className="text-[10px] font-mono text-fg-muted/60 mt-1">{asset.file}</p>
              </a>
            ))}
          </div>
          <p className="mt-4 text-[10px] font-mono text-fg-muted/50">
            All assets licensed for editorial use. Credit: Nebula Components. Full brand guidelines at /brand
          </p>
        </div>
      </section>

      {/* ─── Brand Usage Quick Reference ──────────────────────────── */}
      <section className="px-6 pb-20" aria-labelledby="brand-usage-title">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>07 / Quick Reference</SectionLabel>
          <SectionTitle><span id="brand-usage-title">Brand Usage</span></SectionTitle>
          <SectionDescription>
            Abbreviated usage guidelines for press context. Full rules live at /brand.
          </SectionDescription>

          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            <DiagnosticPanel>
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-3">Do</p>
              <ul className="space-y-2 text-sm text-fg-muted">
                <li className="flex items-start gap-2">
                  <span className="text-accent shrink-0 mt-0.5">+</span>
                  Use &ldquo;Nebula Components&rdquo; (full name) on first mention
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent shrink-0 mt-0.5">+</span>
                  &ldquo;Nebula&rdquo; acceptable in subsequent references
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent shrink-0 mt-0.5">+</span>
                  Use provided SVG assets at original proportions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent shrink-0 mt-0.5">+</span>
                  Maintain minimum clear space equal to mark height
                </li>
              </ul>
            </DiagnosticPanel>
            <DiagnosticPanel>
              <p className="font-mono text-[10px] uppercase tracking-widest text-signal-fail mb-3">Don&apos;t</p>
              <ul className="space-y-2 text-sm text-fg-muted">
                <li className="flex items-start gap-2">
                  <span className="text-signal-fail shrink-0 mt-0.5">&times;</span>
                  Stretch, rotate, or apply effects to the mark
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-signal-fail shrink-0 mt-0.5">&times;</span>
                  Use the mark on busy or low-contrast backgrounds
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-signal-fail shrink-0 mt-0.5">&times;</span>
                  Alter colors or replace with brand palette
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-signal-fail shrink-0 mt-0.5">&times;</span>
                  Imply endorsement or partnership without written approval
                </li>
              </ul>
            </DiagnosticPanel>
          </div>
        </div>
      </section>

      {/* ─── Media Contact ────────────────────────────────────────── */}
      <section className="px-6 pb-24" aria-labelledby="contact-title">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>08 / Contact</SectionLabel>
          <SectionTitle><span id="contact-title">Media Inquiries</span></SectionTitle>
          <SectionDescription>
            For press inquiries, interview requests, and asset access.
          </SectionDescription>

          <DiagnosticPanel className="mt-8">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <dl className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <dt className="text-fg-muted min-w-[60px]">Email</dt>
                    <dd className="text-fg font-medium font-mono text-xs">press@nebulacomponents.shop</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-fg-muted min-w-[60px]">Web</dt>
                    <dd>
                      <a href="https://nebulacomponents.shop" className="text-accent hover:text-fg text-xs font-mono underline underline-offset-2">
                        nebulacomponents.shop
                      </a>
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-fg-muted min-w-[60px]">Brand</dt>
                    <dd>
                      <a href="/brand" className="text-accent hover:text-fg text-xs font-mono underline underline-offset-2">
                        /brand
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted/60">Response Time</p>
                <p className="text-sm text-fg-muted">
                  Press inquiries receive a response within 24 hours during business days.
                  For urgent requests, include &ldquo;URGENT&rdquo; in your subject line.
                </p>
              </div>
            </div>
          </DiagnosticPanel>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-center text-[10px] font-mono text-fg-muted/40 uppercase tracking-widest">
              End of press system transmission
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
