import Link from 'next/link'

/**
 * SiteFooter - Layer 7: curated navigation surface.
 *
 * 4 columns (desktop): Product | Audit Types | Learn | Company
 * Each column: max 6 items + optional "View all →" to hub page.
 * NOT a link dump. Footer is not an SEO URL landfill.
 * All major destinations reachable; long-tail discovered through hubs.
 */
export default function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-bg-muted/5">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">

          {/* Product */}
          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-fg-dim">
              Product
            </h3>
            <ul className="space-y-2.5 text-sm text-fg-muted">
              <li><Link href="/audit" className="hover:text-accent transition-colors">Free Landing Page Audit</Link></li>
              <li><Link href="/repair-sprint" className="hover:text-accent transition-colors">Repair Sprint</Link></li>
              <li><Link href="/pricing" className="hover:text-accent transition-colors">Pricing</Link></li>
              <li><Link href="/benchmarks" className="hover:text-accent transition-colors">Conversion Benchmarks</Link></li>
              <li><Link href="/teardowns" className="hover:text-accent transition-colors">Public Teardowns</Link></li>
              <li><Link href="/case-studies" className="hover:text-accent transition-colors">Case Studies</Link></li>
              <li><Link href="/compare" className="hover:text-accent transition-colors">Tool Comparisons</Link></li>
            </ul>
          </div>

          {/* Audit Types - expose the cluster, link to hub */}
          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-fg-dim">
              Audit Types
            </h3>
            <ul className="space-y-2.5 text-sm text-fg-muted">
              <li><Link href="/ecommerce-landing-page-audit" className="hover:text-accent transition-colors">Ecommerce</Link></li>
              <li><Link href="/saas-landing-page-audit" className="hover:text-accent transition-colors">SaaS</Link></li>
              <li><Link href="/mobile-landing-page-audit" className="hover:text-accent transition-colors">Mobile</Link></li>
              <li><Link href="/lead-generation-landing-page-audit" className="hover:text-accent transition-colors">Lead Generation</Link></li>
              <li><Link href="/landing-page-cta-audit" className="hover:text-accent transition-colors">CTA</Link></li>
              <li><Link href="/landing-page-message-match" className="hover:text-accent transition-colors">Message Match</Link></li>
            </ul>
          </div>

          {/* Learn - expose category not inventory; hub carries the rest */}
          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-fg-dim">
              Learn
            </h3>
            <ul className="space-y-2.5 text-sm text-fg-muted">
              <li><Link href="/why-is-my-landing-page-not-converting" className="hover:text-accent transition-colors">Why Pages Don't Convert</Link></li>
              <li><Link href="/ads-getting-clicks-but-no-sales" className="hover:text-accent transition-colors">Ads with No Sales</Link></li>
              <li><Link href="/what-is-landing-page-audit" className="hover:text-accent transition-colors">What Is an Audit?</Link></li>
              <li><Link href="/best-landing-page-audit-tools" className="hover:text-accent transition-colors">Audit Tools Compared</Link></li>
              <li><Link href="/playbooks" className="hover:text-accent transition-colors">Playbooks</Link></li>
              <li>
                <Link href="/learning-centre" className="hover:text-accent transition-colors font-medium">
                  All guides →
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-fg-dim">
              Nebula
            </h3>
            <ul className="space-y-2.5 text-sm text-fg-muted">
              <li><Link href="https://app.nebulacomponents.com" className="hover:text-accent transition-colors">Client Workspace</Link></li>
              <li><Link href="/about" className="hover:text-accent transition-colors">About</Link></li>
              <li><Link href="/press" className="hover:text-accent transition-colors">Press</Link></li>
              <li><Link href="/brand" className="hover:text-accent transition-colors">Brand Assets</Link></li>
              <li><Link href="/editorial-standards" className="hover:text-accent transition-colors">Editorial Standards</Link></li>
              <li>
                <a href="mailto:nebulashop@agentmail.to" className="hover:text-accent transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA strip */}
        <div className="mt-10 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-fg-muted">
            Check your page against 9 conversion signals in under 2 minutes.
          </p>
          <Link
            href="/audit?utm_source=footer&utm_medium=internal"
            className="btn-primary shrink-0 px-6 py-2.5 text-sm"
          >
            Get Your Free Audit →
          </Link>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-border/20 px-6 py-4">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-fg-dim">
          <p>© {new Date().getFullYear()} Nebula Components. All rights reserved.</p>
          {/* Google Preferred Sources button — dark theme to match site */}
          <div google-add-preferred-source-btn data-theme="dark" data-lang="en" />
          {/* VisibAI badge — AI visibility score for nebulacomponents.com */}
          <a
            href="https://getvisibai.com/score/e7dc341b-e44a-40e9-980c-4a8effcf8aae"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="AI Visibility Score by VisibAI"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://getvisibai.com/api/badge/e7dc341b-e44a-40e9-980c-4a8effcf8aae"
              alt="AI Visibility Score"
              width={120}
              height={28}
              style={{ display: 'block' }}
            />
          </a>
          <nav aria-label="Legal" className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-fg-muted transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-fg-muted transition-colors">Terms</Link>
            <Link href="/data-rights" className="hover:text-fg-muted transition-colors">Data Rights</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
