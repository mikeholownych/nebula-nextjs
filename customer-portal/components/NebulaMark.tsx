/**
 * NebulaMark — the Nebula Components brand glyph.
 *
 * A 3×3 grid of status indicators. Pass state = filled circle. Fail state = ring.
 * At 16×16px it reads as a dense grid. At 32px+ the structure is clear.
 *
 * The mark is intentionally semantic-neutral so the brand glyph does not
 * encode a particular audit taxonomy or score.
 *
 * Usage:
 *   <NebulaMark size={24} />                    — all neutral (intro/loading)
 *   <NebulaMark size={24} states={auditStates} />  — live pass/fail from audit
 *   <NebulaMark size={16} className="text-accent" /> — small favicon-scale
 */

import type { SVGProps } from 'react'

export type SignalState = 'pass' | 'fail' | 'neutral'

interface NebulaMarkProps extends SVGProps<SVGSVGElement> {
  size?: number
  /** Status states in row-major order. Defaults to all neutral. */
  states?: SignalState[]
  /** Color for pass nodes. Defaults to currentColor. */
  passColor?: string
  /** Color for fail nodes. Defaults to #f59e0b (signal-fail). */
  failColor?: string
  /** Color for neutral nodes. Defaults to currentColor at 30% opacity. */
  neutralColor?: string
}

const DEFAULT_STATES: SignalState[] = Array(9).fill('neutral')

export function NebulaMark({
  size = 24,
  states = DEFAULT_STATES,
  passColor,
  failColor = '#f59e0b',
  neutralColor,
  style,
  ...props
}: NebulaMarkProps) {
  // 3×3 grid with gap
  // viewBox: 24×24, each cell 6×6, gap 2px between cells
  // Grid starts at 1,1 (1px margin)
  const cellSize = 6
  const gap = 2
  const r = 2.2  // circle radius

  const nodes = Array.from({ length: 9 }, (_, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const cx = 1 + col * (cellSize + gap) + cellSize / 2
    const cy = 1 + row * (cellSize + gap) + cellSize / 2
    const state = states[i] ?? 'neutral'
    return { cx, cy, state }
  })

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={style}
      {...props}
    >
      {nodes.map(({ cx, cy, state }, i) => {
        if (state === 'pass') {
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill={passColor ?? 'currentColor'}
            />
          )
        }
        if (state === 'fail') {
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r - 0.5}
              stroke={failColor}
              strokeWidth="1.2"
              fill="none"
            />
          )
        }
        // neutral
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill={neutralColor ?? 'currentColor'}
            opacity="0.25"
          />
        )
      })}
    </svg>
  )
}

/**
 * Static logo variant — uses the Nebula accent with a subtle
 * pass/neutral pattern that reads as intentional at any size.
 * This is the primary brand mark used in SiteNav and Footer.
 */
export function NebulaLogo({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  // Fixed decorative state: top row pass, middle mixed, bottom neutral.
  // This is decorative branding, not a data or score representation.
  const decorativeStates: SignalState[] = [
    'pass', 'pass', 'pass',
    'pass', 'pass', 'neutral',
    'neutral', 'neutral', 'neutral',
  ]
  return (
    <NebulaMark
      size={size}
      states={decorativeStates}
      passColor="#00c2a0"
      neutralColor="#9e9e9e"
      {...props}
    />
  )
}
