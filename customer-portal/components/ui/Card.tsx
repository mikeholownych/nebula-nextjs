import { type CSSProperties, type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'bordered'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  style?: CSSProperties
}

const variantStyles = {
  default: 'bg-bg-panel',
  elevated: 'bg-bg-panel shadow-glow',
  bordered: 'bg-bg-panel border border-border',
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  style,
}: CardProps) {
  return (
    <div
      className={`
        rounded-2xl
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `.trim()}
      style={style}
    >
      {children}
    </div>
  )
}

export default Card
