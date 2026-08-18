import Link from 'next/link'

/**
 * SiteFooter — Compact, organized footer for SEO without link walls.
 *
 * Structure:
 * - 3 columns: Product, Resources, Company (desktop)
 * - Single CTA row: Free audit button
 * - Copyright bar
 */

export default function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-bg-muted/5">
      {/* Main footer content */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3 md:gap-12">
          {/* Product */}
          <div>
            <h3 className="mb-4 text-xs font-semibold text-fg-muted uppercase tracking-wide">Product</h3>
            <ul className="space-y-3 text-sm text-fg-muted">
              <li>
                <Link href="/audit" className="hover:text-accent transition-colors">
                  Free Landing Page Audit
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-accent transition-colors">
                  $97 Repair Sprint
                </Link>
              </li>
              <li>
                <Link href="/benchmarks" className="hover:text-accent transition-colors">
                  Live Benchmarks
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-xs font-semibold text-fg-muted uppercase tracking-wide">Resources</h3>
            <ul className="space-y-3 text-sm text-fg-muted">
              <li>
                <Link href="/teardowns" className="hover:text-accent transition-colors">
                  Public Teardowns
                </Link>
              </li>
              <li>
                <Link href="/what-is-landing-page-audit" className="hover:text-accent transition-colors">
                  What Is an Audit?
                </Link>
              </li>
              <li>
                <Link href="/why-is-my-landing-page-not-converting" className="hover:text-accent transition-colors">
                  Why No Conversions?
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-xs font-semibold text-fg-muted uppercase tracking-wide">Nebula</h3>
            <ul className="space-y-3 text-sm text-fg-muted">
              <li>
                <Link href="/brand" className="hover:text-accent transition-colors">
                  Brand & Assets
                </Link>
              </li>
              <li>
                <a
                  href="mailto:nebulashop@agentmail.to"
                  className="hover:text-accent transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-accent transition-colors">
                  Privacy
                </Link>
              </li>
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
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-fg-muted transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-fg-muted transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
