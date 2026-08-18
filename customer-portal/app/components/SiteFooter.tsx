import Link from 'next/link'

/**
 * SiteFooter — Organized footer with full SEO coverage.
 * 
 * Structure:
 * - 4 columns (desktop): Product, Audit Types, Resources, Company
 * - Single CTA row
 * - Compact copyright bar
 * 
 * Organizes 30+ SEO pages without link wall clutter.
 */

export default function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-bg-muted/5">
      {/* Main footer content */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4 md:gap-8">
          {/* Product */}
          <div>
            <h3 className="mb-4 text-xs font-semibold text-fg-muted uppercase tracking-wide">Product</h3>
            <ul className="space-y-2.5 text-sm text-fg-muted">
              <li><Link href="/audit" className="hover:text-accent transition-colors">Free Audit</Link></li>
              <li><Link href="/pricing" className="hover:text-accent transition-colors">$97 Repair Sprint</Link></li>
              <li><Link href="/benchmarks" className="hover:text-accent transition-colors">Live Benchmarks</Link></li>
              <li><Link href="/teardowns" className="hover:text-accent transition-colors">Public Teardowns</Link></li>
              <li><Link href="/brand" className="hover:text-accent transition-colors">Brand Assets</Link></li>
            </ul>
          </div>

          {/* Audit Types */}
          <div>
            <h3 className="mb-4 text-xs font-semibold text-fg-muted uppercase tracking-wide">Audit Types</h3>
            <ul className="space-y-2.5 text-sm text-fg-muted">
              <li><Link href="/ecommerce-landing-page-audit" className="hover:text-accent transition-colors">Ecommerce</Link></li>
              <li><Link href="/saas-landing-page-audit" className="hover:text-accent transition-colors">SaaS</Link></li>
              <li><Link href="/mobile-landing-page-audit" className="hover:text-accent transition-colors">Mobile</Link></li>
              <li><Link href="/lead-generation-landing-page-audit" className="hover:text-accent transition-colors">Lead Gen</Link></li>
              <li><Link href="/landing-page-cta-audit" className="hover:text-accent transition-colors">CTA</Link></li>
              <li><Link href="/landing-page-message-match" className="hover:text-accent transition-colors">Message Match</Link></li>
              <li><Link href="/landing-page-trust-signals" className="hover:text-accent transition-colors">Trust Signals</Link></li>
              <li><Link href="/page-speed-conversion" className="hover:text-accent transition-colors">Page Speed</Link></li>
            </ul>
          </div>

          {/* Learning Centre */}
          <div>
            <h3 className="mb-4 text-xs font-semibold text-fg-muted uppercase tracking-wide">Learning</h3>
            <ul className="space-y-2.5 text-sm text-fg-muted">
              <li><Link href="/what-is-landing-page-audit" className="hover:text-accent transition-colors">What Is an Audit?</Link></li>
              <li><Link href="/why-is-my-landing-page-not-converting" className="hover:text-accent transition-colors">Why No Conversions?</Link></li>
              <li><Link href="/landing-page-mistakes" className="hover:text-accent transition-colors">Common Mistakes</Link></li>
              <li><Link href="/best-landing-page-audit-tools" className="hover:text-accent transition-colors">Audit Tools</Link></li>
              <li><Link href="/learning-centre" className="hover:text-accent transition-colors">All Articles →</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-xs font-semibold text-fg-muted uppercase tracking-wide">Nebula</h3>
            <ul className="space-y-2.5 text-sm text-fg-muted">
              <li>
                <a href="mailto:nebulashop@agentmail.to" className="hover:text-accent transition-colors">
                  Contact
                </a>
              </li>
              <li><Link href="/privacy" className="hover:text-accent transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-accent transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        {/* CTA row */}
        <div className="mt-12 pt-8 border-t border-border/40 text-center">
          <p className="text-sm text-fg-muted mb-4">
            Find your conversion leak in under 2 minutes.
          </p>
          <Link
            href="/audit?utm_source=footer&utm_medium=internal"
            className="inline-block rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
          >
            Get Your Free Audit →
          </Link>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-border/20 px-6 py-4">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-fg-dim">
          <p>© {new Date().getFullYear()} Nebula Components. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
