import { type ReactNode } from 'react'

interface PageShellProps {
  children: ReactNode
  title?: string
  description?: string
}

export function PageShell({ children, title, description }: PageShellProps) {
  return (
    <div className="min-h-screen bg-bg pt-[72px]">
      <main id="main-content">
        {title && (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold text-fg">{title}</h1>
            {description && (
              <p className="mt-4 text-lg text-fg-muted">{description}</p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}

export default PageShell
