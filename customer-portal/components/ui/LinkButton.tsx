import { forwardRef, type AnchorHTMLAttributes } from 'react'

type LinkButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type LinkButtonSize = 'sm' | 'md' | 'lg'

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  variant?: LinkButtonVariant
  size?: LinkButtonSize
}

const variantStyles: Record<LinkButtonVariant, string> = {
  primary: 'bg-accent text-bg font-semibold hover:opacity-85 hover:bg-accent transition-colors',
  secondary: 'bg-bg-panel text-fg border border-border hover:border-accent transition-colors',
  outline: 'border border-accent text-accent hover:bg-accent-dim transition-colors',
  ghost: 'text-fg-muted hover:text-fg transition-colors',
}

const sizeStyles: Record<LinkButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-base rounded',
  lg: 'px-8 py-4 text-lg rounded',
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => (
    <a
      ref={ref}
      className={`
        inline-flex items-center justify-center gap-2
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
        focus-visible:ring-offset-2 focus-visible:ring-offset-bg
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </a>
  ),
)

LinkButton.displayName = 'LinkButton'

export default LinkButton
