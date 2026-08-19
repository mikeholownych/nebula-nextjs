import React, { SVGProps } from 'react';

export type SignalNodeState = 'pass' | 'fail' | 'neutral' | 'review';

export interface NebulaMarkProps extends SVGProps<SVGSVGElement> {
  size?: number;
  /** 9 states in row-major order (3x3 grid) */
  states?: SignalNodeState[];
  passColor?: string;
  failColor?: string;
  reviewColor?: string;
  neutralColor?: string;
  className?: string;
}

const DEFAULT_DECORATIVE_STATES: SignalNodeState[] = [
  'pass', 'pass', 'neutral',
  'pass', 'neutral', 'neutral',
  'neutral', 'neutral', 'neutral',
];

/**
 * NebulaMark — The canonical 3x3 signal grid glyph of Nebula Components.
 * Represents governed diagnostic signal nodes.
 */
export const NebulaMark: React.FC<NebulaMarkProps> = ({
  size = 24,
  states = DEFAULT_DECORATIVE_STATES,
  passColor = '#c7ff2f',
  failColor = '#f59e0b',
  reviewColor = '#eab308',
  neutralColor = '#525750',
  className = '',
  style,
  ...props
}) => {
  const cellSize = 6;
  const gap = 2;
  const r = 2.2;

  const nodes = Array.from({ length: 9 }, (_, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = 1 + col * (cellSize + gap) + cellSize / 2;
    const cy = 1 + row * (cellSize + gap) + cellSize / 2;
    const state = states[i] ?? 'neutral';
    return { cx, cy, state };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
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
              fill={passColor}
            />
          );
        }
        if (state === 'fail') {
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r - 0.4}
              stroke={failColor}
              strokeWidth="1.2"
              fill="none"
            />
          );
        }
        if (state === 'review') {
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r - 0.4}
              stroke={reviewColor}
              strokeWidth="1.2"
              strokeDasharray="2 1.5"
              fill="none"
            />
          );
        }
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill={neutralColor}
            opacity="0.35"
          />
        );
      })}
    </svg>
  );
};

export interface NebulaLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  markStates?: SignalNodeState[];
}

/**
 * NebulaLogo — Brand mark + typography lockup matching canonical v2 identity.
 */
export const NebulaLogo: React.FC<NebulaLogoProps> = ({
  size = 24,
  showWordmark = true,
  className = '',
  markStates,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative flex items-center justify-center p-1 rounded-md bg-[#0d0f0e] border border-white/10 shadow-sm">
        <NebulaMark size={size} states={markStates} />
      </div>
      {showWordmark && (
        <span className="flex items-baseline gap-1 text-[15px] tracking-tight font-semibold text-[#e8ebe7]">
          <span>Nebula</span>
          <span className="text-[13px] font-normal text-[#7a8078]">Components</span>
        </span>
      )}
    </div>
  );
};

export default NebulaLogo;
