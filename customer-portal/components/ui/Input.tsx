import { forwardRef, useId, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helper, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-fg-muted mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-3
            bg-bg-panel border rounded
            text-fg placeholder:text-fg-dim
            outline-none transition-all duration-200
            focus:border-accent focus:ring-2 focus:ring-accent/20
            ${error ? 'border-danger' : 'border-border'}
            ${className}
          `.trim()}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : helper ? helperId : undefined}
          aria-errormessage={error ? errorId : undefined}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {helper && !error && (
          <p id={helperId} className="mt-2 text-sm text-fg-dim">
            {helper}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
