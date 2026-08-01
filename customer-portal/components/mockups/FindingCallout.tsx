/**
 * FindingCallout
 * SVG annotation overlays for teardown findings — circle, crossOut, highlight, underline.
 * Adapted from opensourceui.in — MIT licensed.
 * Stripped to the 4 variants useful for audit annotations.
 */

import { forwardRef, type ReactNode } from 'react'

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}

// ── SVG noise filter (shared, rendered once per page) ──────────────────────
export function RoughFilters() {
  return (
    <svg className="absolute h-0 w-0" aria-hidden="true">
      <defs>
        <filter id="nc-rough" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency={0.045} numOctaves={2} seed={4} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={2.6} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="nc-rough-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency={0.035} numOctaves={2} seed={11} result="n2" />
          <feDisplacementMap in="SourceGraphic" in2="n2" scale={1.5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}

// ── Decoration shapes ──────────────────────────────────────────────────────

function CircleSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 220 64" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M40,40 C20,23 53,7 102,5 C153,3 207,11 211,29 C215,47 167,60 109,60 C59,60 15,53 19,35 C21,27 27,22 37,20"
        stroke="currentColor" strokeWidth={3} strokeLinecap="round" fill="none" filter="url(#nc-rough)"
      />
      <path
        d="M43,37 C28,25 58,9 105,7 C151,6 199,14 206,29 C212,45 167,57 110,58"
        stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.55} filter="url(#nc-rough-soft)"
      />
    </svg>
  )
}

function CrossOutSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 40" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path d="M4,32 C40,10 96,30 136,8" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" fill="none" filter="url(#nc-rough)" />
      <path d="M6,10 C44,30 92,12 134,30" stroke="currentColor" strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.7} filter="url(#nc-rough-soft)" />
    </svg>
  )
}

function HighlightSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 170 26" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M4,17 C2,11 5,7 12,6 C45,2 95,2 138,4 C152,5 164,7 166,13 C167,18 163,21 155,22 C112,24 60,24 16,22 C8,21.5 4,20 4,17 Z"
        fill="currentColor" filter="url(#nc-rough-soft)"
      />
    </svg>
  )
}

function WavySvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 14" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M2,6 Q5.5,3 9,6 T17,6 T25,6 T33,6 T41,6 T49,6 T57,6 T65,6 T73,6 T81,6 T89,6 T97,6 T105,6 T113,6 T121,6 T129,6 T137,6"
        stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" fill="none" filter="url(#nc-rough-soft)"
      />
    </svg>
  )
}

// ── Variant map ────────────────────────────────────────────────────────────

const variants = {
  circle: {
    wrapper: 'relative inline-block px-[0.35em] whitespace-nowrap',
    Svg: CircleSvg,
    svgClass: 'pointer-events-none absolute inset-y-[-0.25em] left-[-0.15em] h-[calc(100%+0.5em)] w-[calc(100%+0.3em)]',
    defaultColor: 'text-red-400',
    behind: false,
  },
  crossOut: {
    wrapper: 'relative inline-block whitespace-nowrap',
    Svg: CrossOutSvg,
    svgClass: 'pointer-events-none absolute top-1/2 left-[-2%] h-[1.4em] w-[104%] -translate-y-1/2',
    defaultColor: 'text-red-400',
    behind: false,
  },
  highlight: {
    wrapper: 'relative inline-block whitespace-nowrap',
    Svg: HighlightSvg,
    svgClass: 'pointer-events-none absolute inset-y-[-0.1em] left-[-1%] h-[calc(100%+0.2em)] w-[102%] z-0',
    defaultColor: 'text-amber-400/40',
    behind: true,
  },
  wavy: {
    wrapper: 'relative inline-block whitespace-nowrap',
    Svg: WavySvg,
    svgClass: 'pointer-events-none absolute bottom-[-0.32em] left-[-1%] h-[0.5em] w-[102%]',
    defaultColor: 'text-accent',
    behind: false,
  },
} as const

export type FindingCalloutVariant = keyof typeof variants

type FindingCalloutProps = {
  children: ReactNode
  variant?: FindingCalloutVariant
  color?: string
  className?: string
}

export const FindingCallout = forwardRef<HTMLSpanElement, FindingCalloutProps>(
  ({ children, variant = 'wavy', color, className }, ref) => {
    const v = variants[variant]
    const Svg = v.Svg
    const svgClass = cn(v.svgClass, color ?? v.defaultColor)

    if (v.behind) {
      return (
        <>
          <RoughFilters />
          <span ref={ref} className={cn(v.wrapper, className)}>
            <span className="relative z-10">{children}</span>
            <Svg className={svgClass} />
          </span>
        </>
      )
    }

    return (
      <>
        <RoughFilters />
        <span ref={ref} className={cn(v.wrapper, className)}>
          {children}
          <Svg className={svgClass} />
        </span>
      </>
    )
  },
)

FindingCallout.displayName = 'FindingCallout'
