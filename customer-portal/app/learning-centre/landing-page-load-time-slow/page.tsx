import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Landing Page Load Time Slow: Every Second Costs Conversions | Nebula Components',
  description: 'Page load time directly impacts paid ad conversion rates. Here is how to diagnose and fix slow landing page load time.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/landing-page-load-time-slow' },
}

export default function LearningCentrePage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/learning-centre" className="text-sm font-semibold text-accent hover:text-accent-light transition-colors">
          ← Learning Centre
        </Link>

        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Landing Page Leaks · load time
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Landing Page Load Time Slow? Every Second Costs Conversions
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            One second of extra load time = 7% conversion drop. If your page makes $100/day, that&apos;s $7/day lost. Speed is revenue.
          </p>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Real Cost of Slow</h2>
          <p className="leading-relaxed text-fg-muted">
            Google&apos;s research is clear: every additional second of load time reduces conversions by approximately 7%. This isn&apos;t theoretical—it&apos;s money walking out the door.
          </p>
          <div className="mt-6 flex flex-wrap gap-8">
            <div>
              <p className="text-4xl font-extrabold text-accent">7%</p>
              <p className="text-sm text-fg-muted">conversion drop per second</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-accent">$7</p>
              <p className="text-sm text-fg-muted">lost per $100 revenue per day</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-accent">$2,555</p>
              <p className="text-sm text-fg-muted">lost per year per $100/day page</p>
            </div>
          </div>
          <p className="mt-5 leading-relaxed text-fg-muted">
            A page earning $500/day loses $35/day to a 1-second delay—that&apos;s over $12,000 annually. Speed isn&apos;t a technical concern. It&apos;s a profit concern.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Largest Contentful Paint (LCP)</h2>
          <p className="leading-relaxed text-fg-muted">
            LCP measures when the main content becomes visible. Google considers a &quot;good&quot; LCP to be under 2.5 seconds. Anything above 4 seconds is &quot;poor&quot; and directly hurts both conversions and search rankings.
          </p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">LCP &lt; 2.5s:</strong> Good—most visitors see your offer quickly</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">LCP 2.5s–4s:</strong> Needs improvement—you&apos;re losing impatient visitors</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">LCP &gt; 4s:</strong> Poor—you&apos;re bleeding conversions and SEO</span>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Check your LCP in Google PageSpeed Insights or Chrome DevTools. It&apos;s free and takes 30 seconds.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Quick Wins</h2>
          <h3 className="mb-2 mt-4 text-lg font-semibold text-fg">Compress Images</h3>
          <p className="leading-relaxed text-fg-muted">
            Uncompressed images are a leading cause of slow pages. Use WebP format, compress to 80% quality, and serve responsive images. A 2MB hero becomes 200KB with no visible difference.
          </p>
          <h3 className="mb-2 mt-4 text-lg font-semibold text-fg">Lazy Load Below the Fold</h3>
          <p className="leading-relaxed text-fg-muted">
            Images and videos below the initial viewport shouldn&apos;t block rendering. Add <code className="rounded bg-bg px-1.5 py-0.5 text-accent">loading=&quot;lazy&quot;</code> to images that aren&apos;t immediately visible.
          </p>
          <h3 className="mb-2 mt-4 text-lg font-semibold text-fg">Reduce Redirect Chains</h3>
          <p className="leading-relaxed text-fg-muted">
            Each redirect adds DNS lookup, TLS handshake, and round-trip time. Clean URLs load faster.
          </p>
          <h3 className="mb-2 mt-4 text-lg font-semibold text-fg">Use a CDN</h3>
          <p className="leading-relaxed text-fg-muted">
            Serve assets from edge locations close to your visitors. Cloudflare is free for most small sites.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Trade-off</h2>
          <p className="leading-relaxed text-fg-muted">
            Speed optimization has diminishing returns. Getting from 6s to 3s is usually straightforward: compress images, add lazy loading, use a CDN. Getting from 3s to 1.5s requires more effort—code splitting, critical CSS, font optimization.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Prioritize the high-impact, low-effort fixes first. A 50% speed improvement often comes from image compression alone. The last 20% might take weeks.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Also consider: a beautiful but slow page converts worse than a simple but fast one. Complexity costs speed. Speed costs conversions.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Find the leak on your page</h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            Run the free Nebula audit first. Buy the $97 Fix Pack only when the leak is obvious.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/audit" className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors">
              Run the free audit
            </Link>
            <Link href="/learning-centre/paid-traffic-leak-map" className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors">
              Open leak map
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
          <div className="space-y-1">
            <Link href="/learning-centre/mobile-landing-page-leaks" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Mobile Landing Page Leaks That Kill Paid Traffic
            </Link>
            <Link href="/learning-centre/landing-page-not-converting" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Landing Page Not Converting? Diagnose These 5 Leaks First
            </Link>
            <Link href="/learning-centre/before-you-raise-ad-budget" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Before You Raise Ad Budget: Check These 5 Landing Page Leaks
            </Link>
            <Link href="/learning-centre/traffic-but-no-form-fills" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Traffic But No Form Fills? Find the Leak
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
