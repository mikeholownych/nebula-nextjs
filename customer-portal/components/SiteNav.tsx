import Link from 'next/link'

export default function SiteNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-bg/80 backdrop-blur-xl border-b border-border">
      <nav aria-label="Primary" className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          aria-label="Nebula Components home"
        >
          <svg width="22" height="22" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="9"  y="9"  width="3" height="30" fill="#F5F5F5"/>
            <polygon points="12,9 15,9 36,39 33,39" fill="#F5F5F5"/>
            <rect x="36" y="9"  width="3" height="30" fill="#F5F5F5"/>
            <rect x="34" y="6" width="7" height="2.5" fill="#10B981"/>
          </svg>
          <span className="text-sm font-medium text-fg tracking-tight">
            Nebula <span className="font-light text-fg-muted">Components</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-sm text-fg-muted hover:text-fg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded">
            Pricing
          </Link>
          <Link href="/learning-centre" className="text-sm text-fg-muted hover:text-fg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded">
            Learning
          </Link>
          <Link
            href="/audit"
            className="px-4 py-2 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent-light transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Free Audit
          </Link>
        </div>
      </nav>
    </header>
  )
}
