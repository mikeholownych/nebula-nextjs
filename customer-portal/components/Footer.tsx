'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-elevated)] mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Top section with logo and description */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand column */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-[var(--text-primary)]">◆</span>
              <span className="text-xl font-semibold text-[var(--text-primary)]">Nebula</span>
            </Link>
            <p className="text-[var(--text-muted)] text-sm mb-4 max-w-md">
              Stop burning cash on broken landing pages. Free audit in 60 seconds.
            </p>
            <div className="flex gap-4">
              <a
                href="https://linkedin.com/company/nebula-components"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a
                href="https://twitter.com/nebulacomponents"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Services</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/audit" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                  Free Audit
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/agency-partner" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                  Agency Partner
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/learning-centre" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                  Learning Centre
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <a href="mailto:hello@nebulacomponents.shop" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[var(--text-muted)]">
            © {new Date().getFullYear()} Nebula Components. Stop burning cash on broken landing pages.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
