import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helper, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-fg-muted mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            w-full px-4 py-3
            bg-bg-panel border rounded-xl
            text-fg placeholder:text-fg-dim
            outline-none transition-all duration-200
            focus:border-accent focus:ring-2 focus:ring-accent/20
            ${error ? 'border-danger' : 'border-border'}
            ${className}
          `.trim()}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="mt-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {helper && !error && (
          <p id={`${id}-helper`} className="mt-2 text-sm text-fg-dim">
            {helper}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
