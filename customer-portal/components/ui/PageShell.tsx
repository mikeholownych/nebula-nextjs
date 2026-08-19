import { type ReactNode } from 'react'

interface PageShellProps {
  children: ReactNode
  title?: string
  description?: string
}

export function PageShell({ children, title, description }: PageShellProps) {
  return (
    <div className="min-h-screen bg-bg pt-24">
      <main id="main-content">
        {title && (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h1 className="heading-1 text-fg">{title}</h1>
            {description && (
              <p className="mt-4 max-w-reading text-lg text-fg-muted leading-relaxed">{description}</p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}

export default PageShell
