import { type ReactNode } from 'react'
import Link from 'next/link'

interface PageShellProps {
  children: ReactNode
  title?: string
  description?: string
}

export function PageShell({ children, title, description }: PageShellProps) {
  return (
    <div className="min-h-screen bg-bg">
      {/* Skip to main content - WCAG accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-bg focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-bg/80 backdrop-blur-xl border-b border-border">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-fg hover:text-accent transition-colors">
            Nebula
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-fg-muted hover:text-fg transition-colors">
              Pricing
            </Link>
            <Link href="/learning-centre" className="text-sm text-fg-muted hover:text-fg transition-colors">
              Learning
            </Link>
            <Link
              href="/audit"
              className="px-4 py-2 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent-light transition-colors"
            >
              Audit Status
            </Link>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main id="main-content" className="pt-20">
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

      {/* Footer */}
      <footer className="border-t border-border bg-bg-elevated mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <p className="text-fg font-semibold">Nebula Components</p>
              <p className="mt-2 text-sm text-fg-muted">
                Evidence-backed landing-page audits. Automated scoring is temporarily paused.
              </p>
            </div>
            <div>
              <p className="text-fg-muted text-sm font-medium mb-4">Product</p>
              <ul className="space-y-2">
                <li><Link href="/audit" className="text-sm text-fg-muted hover:text-fg">Audit Status</Link></li>
                <li><Link href="/pricing" className="text-sm text-fg-muted hover:text-fg">Pricing</Link></li>
                <li><Link href="/learning-centre" className="text-sm text-fg-muted hover:text-fg">Learning Centre</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-fg-muted text-sm font-medium mb-4">Legal</p>
              <ul className="space-y-2">
                <li><Link href="/privacy-policy" className="text-sm text-fg-muted hover:text-fg">Privacy</Link></li>
                <li><Link href="/terms" className="text-sm text-fg-muted hover:text-fg">Terms</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-fg-muted text-sm font-medium mb-4">Connect</p>
              <ul className="space-y-2">
                <li><a href="https://twitter.com/nebulacomponents" className="text-sm text-fg-muted hover:text-fg">Twitter</a></li>
                <li><a href="https://linkedin.com/company/nebulacomponents" className="text-sm text-fg-muted hover:text-fg">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center">
            <p className="text-sm text-fg-dim">
              © {new Date().getFullYear()} Nebula Components. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PageShell
