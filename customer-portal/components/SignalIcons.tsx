import React from 'react'

type IconProps = {
  className?: string
}

const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '2',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/**
 * HeadlineIcon — Two horizontal lines of different widths (headline + subhead)
 * with a short vertical cursor bar on the right of the top line.
 */
export function HeadlineIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      {/* Headline (wide) */}
      <line x1="3" y1="8" x2="17" y2="8" />
      {/* Cursor bar — right of headline */}
      <line x1="19" y1="6" x2="19" y2="10" />
      {/* Subhead (narrower) */}
      <line x1="3" y1="13" x2="12" y2="13" />
    </svg>
  )
}

/**
 * CtaIcon — Rounded rectangle button shape with an arrow pointing right inside.
 */
export function CtaIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      {/* Button outline */}
      <rect x="2" y="8" width="20" height="8" rx="2" />
      {/* Arrow shaft */}
      <line x1="8" y1="12" x2="15" y2="12" />
      {/* Arrow head */}
      <polyline points="12,9.5 15,12 12,14.5" />
    </svg>
  )
}

/**
 * AboveFoldIcon — Viewport rectangle with a dashed fold line across the middle;
 * content marks appear only above it.
 */
export function AboveFoldIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      {/* Viewport frame */}
      <rect x="2" y="2" width="20" height="20" rx="1" />
      {/* Fold line (dashed) */}
      <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="3 2" />
      {/* Content mark — wide bar above fold */}
      <line x1="6" y1="7" x2="15" y2="7" />
      {/* Content mark — narrow bar above fold */}
      <line x1="6" y1="10" x2="11" y2="10" />
    </svg>
  )
}

/**
 * SocialProofIcon — Three small avatar circles in a row with quote marks below.
 */
export function SocialProofIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      {/* Avatar circles */}
      <circle cx="6" cy="8" r="2.5" />
      <circle cx="12" cy="8" r="2.5" />
      <circle cx="18" cy="8" r="2.5" />
      {/* Left quote mark */}
      <path d="M8,17 L8,15 C8,13.5 9.5,13.5 9.5,15" />
      {/* Right quote mark */}
      <path d="M12,17 L12,15 C12,13.5 13.5,13.5 13.5,15" />
    </svg>
  )
}

/**
 * LoadSpeedIcon — Three vertical bars of increasing height (LCP bars)
 * with a checkmark above the tallest.
 */
export function LoadSpeedIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      {/* Short bar */}
      <line x1="4.5" y1="21" x2="4.5" y2="17" />
      {/* Medium bar */}
      <line x1="11.5" y1="21" x2="11.5" y2="13" />
      {/* Tall bar */}
      <line x1="18.5" y1="21" x2="18.5" y2="9" />
      {/* Checkmark above tallest bar */}
      <polyline points="16,6 18,8.5 21.5,4" />
    </svg>
  )
}

/**
 * MobileIcon — Narrow phone outline (rounded rectangle) with a home indicator
 * bar at the bottom.
 */
export function MobileIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      {/* Phone body */}
      <rect x="7" y="2" width="10" height="20" rx="2" />
      {/* Home indicator */}
      <line x1="10" y1="19" x2="14" y2="19" />
    </svg>
  )
}

/**
 * AdSignalsIcon — A small pixel square with two diagonal tracking-signal lines
 * radiating from its corner.
 */
export function AdSignalsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      {/* Pixel square */}
      <rect x="2" y="9" width="7" height="7" />
      {/* Upper diagonal ray */}
      <line x1="9" y1="9" x2="19" y2="3" />
      {/* Lower diagonal ray */}
      <line x1="9" y1="16" x2="21" y2="20" />
    </svg>
  )
}

/**
 * SeoFoundationsIcon — A label/tag shape (rectangle with pointed left edge and
 * a hole circle) with a search magnifier overlapping the right side.
 */
export function SeoFoundationsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      {/* Tag/label outline — pointed on the left */}
      <path d="M5,4 L16,4 L16,12 L5,12 L2,8 Z" />
      {/* Tag hole */}
      <circle cx="6.5" cy="8" r="1.2" />
      {/* Magnifier lens */}
      <circle cx="17" cy="17" r="4" />
      {/* Magnifier handle */}
      <line x1="20" y1="20" x2="22" y2="22" />
    </svg>
  )
}

/**
 * AiReadinessIcon — Three nodes connected by lines in a triangle (structured
 * graph / schema topology).
 */
export function AiReadinessIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      {/* Edges (drawn first so nodes sit on top) */}
      <line x1="12" y1="4" x2="5" y2="18" />
      <line x1="12" y1="4" x2="19" y2="18" />
      <line x1="5" y1="18" x2="19" y2="18" />
      {/* Node circles */}
      <circle cx="12" cy="4" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Dispatch map — covers both the canonical signal keys (task spec) and the
// actual keys used in the SIGNALS array in page.tsx
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ComponentType<IconProps>> = {
  // Canonical keys (task spec)
  message_match: HeadlineIcon,
  cta: CtaIcon,
  above_fold: AboveFoldIcon,
  social_proof: SocialProofIcon,
  load_time: LoadSpeedIcon,
  mobile: MobileIcon,
  ad_signals: AdSignalsIcon,
  seo_foundations: SeoFoundationsIcon,
  ai_readiness: AiReadinessIcon,
  // Actual page.tsx SIGNALS array keys (aliased to matching icon)
  trust_signals: SocialProofIcon,
  mobile_cta: MobileIcon,
  cta_clarity: CtaIcon,
}

/**
 * Dispatch component — renders the matching icon for a given signal key.
 * Returns null silently for unknown keys so the grid degrades gracefully.
 */
export function SignalIcon({
  signalKey,
  className,
}: {
  signalKey: string
  className?: string
}) {
  const Icon = ICON_MAP[signalKey]
  if (!Icon) return null
  return <Icon className={className} />
}
