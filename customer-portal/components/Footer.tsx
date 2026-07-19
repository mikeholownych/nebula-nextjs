import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-elevated mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity" aria-label="Nebula Components home">
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="9"  y="9"  width="3" height="30" fill="#F5F5F5"/>
                <polygon points="12,9 15,9 36,39 33,39" fill="#F5F5F5"/>
                <rect x="36" y="9"  width="3" height="30" fill="#F5F5F5"/>
                <rect x="34" y="6" width="7" height="2.5" fill="#10B981"/>
              </svg>
              <span className="text-sm font-medium text-fg tracking-tight">
                Nebula <span className="font-light text-fg-muted">Components</span>
              </span>
            </Link>
            <p className="text-sm text-fg-muted max-w-xs">
              Evidence-backed landing page audits for founders spending on ads with zero conversions.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-medium text-fg-muted uppercase tracking-widest mb-4">Product</p>
            <ul className="space-y-3">
              <li><Link href="/audit" className="text-sm text-fg-muted hover:text-fg transition-colors">Free Audit</Link></li>
              <li><Link href="/pricing" className="text-sm text-fg-muted hover:text-fg transition-colors">Pricing</Link></li>
              <li><Link href="/learning-centre" className="text-sm text-fg-muted hover:text-fg transition-colors">Learning Centre</Link></li>
              <li><Link href="/resources/citable" className="text-sm text-fg-muted hover:text-fg transition-colors">Citable</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-medium text-fg-muted uppercase tracking-widest mb-4">Legal</p>
            <ul className="space-y-3">
              <li><Link href="/privacy-policy" className="text-sm text-fg-muted hover:text-fg transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-fg-muted hover:text-fg transition-colors">Terms of Service</Link></li>
              <li><Link href="/data-rights" className="text-sm text-fg-muted hover:text-fg transition-colors">Data Rights</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-fg-dim">
            © {new Date().getFullYear()} Nebula Components. All rights reserved.
          </p>
          <div className="flex gap-5">
            <a href="https://twitter.com/nebulacomponents" target="_blank" rel="noopener noreferrer" className="text-fg-muted hover:text-fg transition-colors" aria-label="Twitter">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://linkedin.com/company/nebula-components" target="_blank" rel="noopener noreferrer" className="text-fg-muted hover:text-fg transition-colors" aria-label="LinkedIn">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
