// AuditResultMockup, static, server-rendered replica of a real Nebula audit result.
// No 'use client', no hooks, no external deps. All colors from tailwind.config.ts.

const SIGNALS = [
  {
    key: 'seo_foundations',
    label: 'SEO Foundations',
    failRate: 83,
    passed: false,
    topLeak: true,
    detail: 'Missing canonical, thin meta descriptions, no structured data',
    impact: 'high',
  },
  {
    key: 'cta',
    label: 'CTA Copy',
    failRate: 49,
    passed: false,
    topLeak: false,
    detail: 'Primary CTA is generic ("Get Started"), no outcome specificity',
    impact: 'high',
  },
  {
    key: 'social_proof',
    label: 'Social Proof',
    failRate: 47,
    passed: false,
    topLeak: false,
    detail: 'No logos, testimonials, or review counts above the fold',
    impact: 'high',
  },
  {
    key: 'ai_readiness',
    label: 'AI Readiness',
    failRate: 40,
    passed: false,
    topLeak: false,
    detail: 'No FAQ schema, no entity disambiguation, no llms.txt',
    impact: 'medium',
  },
  {
    key: 'load_speed',
    label: 'Load Speed',
    failRate: 37,
    passed: false,
    topLeak: false,
    detail: 'LCP 4.1 s, above 2.5 s threshold (Core Web Vitals fail)',
    impact: 'medium',
  },
  {
    key: 'mobile_cta',
    label: 'Mobile CTA',
    failRate: 31,
    passed: true,
    topLeak: false,
    detail: 'Sticky CTA visible on all breakpoints ≥ 320 px',
    impact: 'low',
  },
  {
    key: 'headline',
    label: 'Headline Clarity',
    failRate: 19,
    passed: true,
    topLeak: false,
    detail: 'Value proposition present and scanned within 5 s',
    impact: 'low',
  },
] as const

// 62/100 is the real benchmark average across 139 audits.
const SCORE = 62
const GRADE = 'C+'
// conic-gradient arc: 62% of 360° = 223.2°
const ARC_DEG = Math.round((SCORE / 100) * 360)

// Failures = signals where passed === false
const FAIL_COUNT = SIGNALS.filter((s) => !s.passed).length
const PASS_COUNT = SIGNALS.filter((s) => s.passed).length

export default function AuditResultMockup() {
  return (
    <div
      className="relative w-full max-w-lg rounded-md border border-border bg-bg-surface shadow-lifted overflow-hidden"
      aria-label="Example audit result output"
    >
      {/* ── Top bar: domain + watermark ─────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Favicon dot */}
          <span
            className="flex-shrink-0 h-3 w-3 rounded-full"
            style={{ background: 'rgba(0,194,160,0.35)', border: '1px solid #c7ff2f' }}
          />
          <span className="font-mono text-sm text-fg truncate tracking-tight">
            example-saas.com
          </span>
          <span
            className="flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold"
            style={{
              background: 'rgba(0,194,160,0.08)',
              color: '#33d4b8',
              border: '1px solid rgba(0,194,160,0.18)',
            }}
          >
            HTTPS
          </span>
        </div>
        {/* Subtle watermark, requirement #4 */}
        <span className="flex-shrink-0 text-xs text-fg-dim tracking-section">
          Example output, illustrative
        </span>
      </div>

      {/* ── Score header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-5 px-5 pt-5 pb-4 border-b border-border">
        {/* Score ring, conic-gradient, requirement #10 */}
        <div
          className="relative flex-shrink-0 flex items-center justify-center"
          style={{ width: 80, height: 80 }}
          aria-label={`Score ${SCORE} out of 100`}
        >
          {/* Outer ring */}
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            className="absolute inset-0"
          >
            {/* Track */}
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="6"
              fill="none"
            />
            {/* Arc, drawn as stroke-dasharray on a rotated circle */}
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="#f59e0b"
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${(ARC_DEG / 360) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.5))' }}
            />
          </svg>
          {/* Inner score */}
          <div className="relative flex flex-col items-center leading-none">
            <span
              className="text-xl font-bold tracking-tight"
              style={{ color: '#f59e0b' }}
            >
              {SCORE}
            </span>
            <span className="text-xs text-fg-dim mt-0.5">/100</span>
          </div>
        </div>

        {/* Grade + summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            {/* Grade badge */}
            <span
              className="inline-flex items-center justify-center rounded-lg text-base font-bold px-2.5 py-1 leading-none"
              style={{
                background: 'rgba(243,121,121,0.12)',
                color: '#f37979',
                border: '1px solid rgba(243,121,121,0.25)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {GRADE}
            </span>
            <span className="text-sm text-fg font-semibold">Conversion Health</span>
          </div>
          <p className="text-xs text-fg-muted leading-relaxed">
            {FAIL_COUNT} of {SIGNALS.length} signals failed ·{' '}
            <span style={{ color: '#f37979' }}>Below industry median</span>
          </p>
          {/* Mini pass/fail bar */}
          <div className="mt-2 flex gap-1">
            {SIGNALS.map((s) => (
              <div
                key={s.key}
                className="h-1 flex-1 rounded-full"
                style={{
                  background: s.passed
                    ? 'rgba(0,194,160,0.55)'
                    : s.topLeak
                    ? '#f37979'
                    : '#f59e0b',
                }}
                title={s.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Top leak callout, SEO Foundations ──────────────────────── */}
      <div
        className="mx-4 mt-4 rounded-xl px-4 py-3 flex items-start gap-3"
        style={{
          background: 'rgba(243,121,121,0.07)',
          border: '1px solid rgba(243,121,121,0.20)',
        }}
      >
        <span
          className="mt-0.5 flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-md leading-snug"
          style={{
            background: 'rgba(243,121,121,0.15)',
            color: '#f37979',
            border: '1px solid rgba(243,121,121,0.3)',
          }}
        >
          TOP LEAK
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">
            SEO Foundations{' '}
            <span className="text-xs text-fg-dim font-normal">- #1 failure across benchmarks</span>
          </p>
          <p className="mt-0.5 text-xs text-fg-muted leading-relaxed">
            83% of audited pages fail this signal. No canonical tag, meta description{' '}
            &lt; 70 chars, zero structured data blocks detected.
          </p>
        </div>
        <span
          className="flex-shrink-0 text-sm font-bold self-center tabular-nums"
          style={{ color: '#f37979' }}
        >
          83%
        </span>
      </div>

      {/* ── Signal rows ──────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-1">
        <p className="text-xs text-fg-dim tracking-section uppercase mb-2">
          Signal breakdown
        </p>

        {SIGNALS.map((signal) => {
          const isTopLeak = signal.topLeak
          const isFail = !signal.passed
          const statusColor = isFail
            ? isTopLeak
              ? '#f37979'
              : '#f59e0b'
            : '#c7ff2f'

          return (
            <div
              key={signal.key}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{
                background: isTopLeak
                  ? 'rgba(243,121,121,0.04)'
                  : 'rgba(255,255,255,0.02)',
                border: isTopLeak
                  ? '1px solid rgba(243,121,121,0.12)'
                  : '1px solid transparent',
              }}
            >
              {/* Pass/Fail dot */}
              <span
                className="flex-shrink-0 h-2 w-2 rounded-full"
                style={{
                  background: statusColor,
                  boxShadow: `0 0 6px ${statusColor}80`,
                }}
              />

              {/* Signal name */}
              <span className="flex-1 text-sm text-fg font-medium truncate">
                {signal.label}
              </span>

              {/* Detail, only show on larger */}
              <span className="hidden sm:block text-xs text-fg-dim truncate max-w-[180px]">
                {signal.detail}
              </span>

              {/* Benchmark fail rate */}
              <span
                className="flex-shrink-0 text-xs font-bold tabular-nums ml-2"
                style={{ color: isFail ? statusColor : '#9e9e9e' }}
              >
                {signal.failRate}%
              </span>

              {/* PASS / FAIL badge */}
              <span
                className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-md"
                style={
                  isFail
                    ? {
                        background: isTopLeak
                          ? 'rgba(243,121,121,0.12)'
                          : 'rgba(245,158,11,0.1)',
                        color: statusColor,
                        border: `1px solid ${statusColor}33`,
                      }
                    : {
                        background: 'rgba(0,194,160,0.08)',
                        color: '#c7ff2f',
                        border: '1px solid rgba(0,194,160,0.18)',
                      }
                }
              >
                {isFail ? 'FAIL' : 'PASS'}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Footer: scan meta ────────────────────────────────────────── */}
      <div className="border-t border-border px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-fg-dim">
          <span>
            <span className="text-fg-muted font-medium">{FAIL_COUNT}</span> failed
          </span>
          <span className="text-border">·</span>
          <span>
            <span className="text-fg-muted font-medium">{PASS_COUNT}</span> passed
          </span>
          <span className="text-border">·</span>
          <span>9 signals</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-fg-dim">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: '#c7ff2f', boxShadow: '0 0 4px #c7ff2f80' }}
          />
          Nebula Audit Engine
        </div>
      </div>
    </div>
  )
}
