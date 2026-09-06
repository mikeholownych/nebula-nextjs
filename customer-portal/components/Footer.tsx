import { NebulaLogo } from '@/components/NebulaMark'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-elevated mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* ── Primary nav columns ────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <a href="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity" aria-label="Nebula Components home">
              <NebulaLogo size={18} />
              <span className="text-sm font-medium text-fg tracking-tight">
                Nebula <span className="font-light text-fg-muted">Components</span>
              </span>
            </a>
            <p className="text-sm text-fg-muted max-w-xs">
              Evidence-backed landing page audits for founders spending on ads with zero conversions.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-medium text-fg-muted uppercase tracking-widest mb-4">Product</p>
            <ul className="space-y-3">
              <li><a href="/audit?utm_source=site-nav&utm_medium=internal" className="text-sm text-fg-muted hover:text-fg transition-colors">Free Audit</a></li>
              <li><a href="/score" className="text-sm text-fg-muted hover:text-fg transition-colors">Score My Page</a></li>
              <li><a href="/pricing" className="text-sm text-fg-muted hover:text-fg transition-colors">Pricing</a></li>
              <li><a href="https://app.nebulacomponents.com" className="text-sm text-fg-muted hover:text-fg transition-colors">Workspace</a></li>
              <li><a href="/teardowns" className="text-sm text-fg-muted hover:text-fg transition-colors">Teardowns</a></li>
              <li><a href="/case-studies" className="text-sm text-fg-muted hover:text-fg transition-colors">Case Studies</a></li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <p className="text-xs font-medium text-fg-muted uppercase tracking-widest mb-4">Learn</p>
            <ul className="space-y-3">
              <li><a href="/learning-centre" className="text-sm text-fg-muted hover:text-fg transition-colors">Learning Centre</a></li>
              <li><a href="/blog" className="text-sm text-fg-muted hover:text-fg transition-colors">Field Notes</a></li>
              <li><a href="/playbooks" className="text-sm text-fg-muted hover:text-fg transition-colors">Playbooks</a></li>
              <li><a href="/benchmarks" className="text-sm text-fg-muted hover:text-fg transition-colors">Leak Index</a></li>
              <li><a href="/resources/citable" className="text-sm text-fg-muted hover:text-fg transition-colors">Citable</a></li>
              <li><a href="/newsletter?utm_source=footer&utm_medium=link&utm_campaign=newsletter" className="text-sm text-fg-muted hover:text-fg transition-colors">Newsletter</a></li>
              <li><a href="/lab" className="text-sm text-fg-muted hover:text-fg transition-colors">Lab</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-medium text-fg-muted uppercase tracking-widest mb-4">Company</p>
            <ul className="space-y-3">
              <li><a href="/about" className="text-sm text-fg-muted hover:text-fg transition-colors">About</a></li>
              <li><a href="/press" className="text-sm text-fg-muted hover:text-fg transition-colors">Press</a></li>
              <li><a href="/brand" className="text-sm text-fg-muted hover:text-fg transition-colors">Brand Kit</a></li>
              <li><a href="/editorial-standards" className="text-sm text-fg-muted hover:text-fg transition-colors">Editorial Standards</a></li>
              <li><a href="/vs" className="text-sm text-fg-muted hover:text-fg transition-colors">Tool Comparisons</a></li>
              <li><a href="/about/team" className="text-sm text-fg-muted hover:text-fg transition-colors">Team</a></li>
            </ul>
          </div>
        </div>

        {/* ── Sitemap strip - crawlable, visually quiet ──────────── */}
        <div className="mt-10 pt-6 border-t border-border">
          <nav aria-label="Full site index" className="flex flex-wrap gap-x-3 gap-y-1.5">
            {[
              ['/why-is-my-landing-page-not-converting', 'Why Pages Don\'t Convert'],
              ['/what-is-landing-page-audit', 'What Is a Landing Page Audit'],
              ['/best-landing-page-audit-tools', 'Best Audit Tools'],
              ['/roas-cliff', 'ROAS Cliff'],
              ['/social-proof-landing-page', 'Social Proof Guide'],
              ['/cta-optimization', 'CTA Optimization'],
              ['/headline-optimization', 'Headline Optimization'],
              ['/mobile-landing-page-optimization', 'Mobile Optimization'],
              ['/page-speed-conversion', 'Page Speed & Conversion'],
              ['/ai-sdr-vs-audit', 'AI SDR vs Audit'],
              ['/7-systems', '7 Systems'],
              ['/concepts', 'Concepts'],
              ['/saas-landing-page-audit', 'SaaS Audit'],
              ['/ecommerce-landing-page-audit', 'Ecommerce Audit'],
              ['/mobile-landing-page-audit', 'Mobile Audit'],
              ['/lead-generation-landing-page-audit', 'Lead Gen Audit'],
              ['/landing-page-message-match', 'Message Match'],
              ['/landing-page-trust-signals', 'Trust Signals'],
              ['/landing-page-cta-audit', 'CTA Audit'],
              ['/compare', 'Compare Tools'],
              ['/compare/unbounce', 'vs Unbounce'],
              ['/compare/instapage', 'vs Instapage'],
              ['/compare/leadpages', 'vs Leadpages'],
              ['/compare/pagespeed-insights', 'vs PageSpeed'],
              ['/vs/hotjar', 'vs Hotjar'],
              ['/vs/screaming-frog', 'vs Screaming Frog'],
              ['/vs/crazy-egg', 'vs Crazy Egg'],
              ['/vs/semrush-site-audit', 'vs SEMrush'],
              ['/vs/pagespeed-insights', 'vs PageSpeed Insights'],
              ['/vs/unbounce', 'vs Unbounce'],
              ['/pricing-guides/semrush-pricing', 'SEMrush Pricing'],
              ['/pricing-guides/hotjar-pricing', 'Hotjar Pricing'],
              ['/pricing-guides/crazy-egg-pricing', 'Crazy Egg Pricing'],
              ['/pricing-guides/unbounce-pricing', 'Unbounce Pricing'],
              ['/landing-page-audit-tools-pricing', 'Audit Tool Pricing'],
              ['/resources/citable/quick-start', 'Citable Quick Start'],
              ['/resources/citable/releases', 'Citable Releases'],
              ['/resources/citable/compare', 'Citable Compare'],
              ['/research/landing-page-performance-q3-2026', 'Q3 2026 Research'],
              ['/paid-traffic-leak-scorecard', 'Leak Scorecard'],
              ['/ads-getting-clicks-but-no-sales', 'Ads Getting Clicks, No Sales'],
              ['/funnel-audit', 'Funnel Friction Miner'],
              ['/proof', 'Real Audit Data'],
              ['/roi-calculator', 'Ad Spend ROI Calculator'],
              ['/for/saas', 'Audit for SaaS'],
              ['/for/ecommerce', 'Audit for eCommerce'],
              ['/for/agencies', 'Audit for Agencies'],
              ['/for/coaching', 'Audit for Coaching'],
              ['/for/fintech', 'Audit for Fintech'],
              ['/for/b2b-software', 'Audit for B2B Software'],
            ].map(([href, label], i, arr) => (
              <span key={href} className="flex items-center gap-3">
                <a
                  href={href}
                  className="text-xs text-fg-muted/60 hover:text-fg-muted transition-colors whitespace-nowrap"
                >
                  {label}
                </a>
                {i < arr.length - 1 && (
                  <span className="text-border select-none" aria-hidden="true">·</span>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* ── Legal row ──────────────────────────────────────────── */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

            {/* Legal links + badges */}
            <div className="flex flex-col gap-4">
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                <li><a href="/privacy-policy" className="text-xs text-fg-muted hover:text-fg transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="text-xs text-fg-muted hover:text-fg transition-colors">Terms of Service</a></li>
                <li><a href="/data-rights" className="text-xs text-fg-muted hover:text-fg transition-colors">Data Rights</a></li>
              </ul>
              <a href="https://indieascent.com/p/nebula-components?ia_badge=1" target="_blank" rel="noopener noreferrer">
                <img
                  src="https://indieascent.com/badge/standard-dark.svg"
                  alt="Marked on IndieAscent"
                  width={200}
                  height={54}
                />
              </a>
            </div>

            {/* Copyright + social */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <a href="https://nicklaunches.com/products/nebula-components/?utm_source=nebulacomponents.com&utm_medium=badge&utm_campaign=featured-premium" target="_blank" rel="noopener" aria-label="Nebula Components on Nick Launches">
                <img src="https://nicklaunches.com/badges/featured-premium-dark.png" alt="Nebula Components on Nick Launches" width={244} height={56} style={{ height: '28px', width: 'auto' }} />
              </a>
              <p className="text-xs text-fg-muted">
                © {new Date().getFullYear()} Nebula Components. All rights reserved.
              </p>
              <div className="flex gap-5">
                <a href="https://x.com/NebulaCRO" target="_blank" rel="noopener noreferrer" className="text-fg-muted hover:text-fg transition-colors" aria-label="X (Twitter)">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://linkedin.com/company/nebulacomponents" target="_blank" rel="noopener noreferrer" className="text-fg-muted hover:text-fg transition-colors" aria-label="LinkedIn">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a href="https://www.facebook.com/nebulacomponents" target="_blank" rel="noopener noreferrer" className="text-fg-muted hover:text-fg transition-colors" aria-label="Facebook">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}
