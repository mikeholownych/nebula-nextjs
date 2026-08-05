import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Agency Partner Program — Embed Nebula Audits on Your Site | Nebula',
  description: 'Add a conversion audit widget to your agency site. Your visitors get instant scores, you get qualified leads with full attribution. One-time $497.',
  robots: { index: true, follow: true },
}

export default function AgencyPartnerPage() {
  return (
    <main className="min-h-screen bg-[#0a0f1a] text-slate-200 px-4 py-16 md:py-24">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Turn your agency site into a lead machine
        </h1>
        <p className="text-lg text-slate-400 mb-10 max-w-2xl">
          Embed the Nebula audit widget on your site. Visitors enter a URL,
          get an instant conversion score, and you capture the lead — fully
          attributed to your agency, zero extra ad spend.
        </p>

        {/* How it works */}
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-white mb-6">How it works</h2>
          <ol className="space-y-5 text-slate-300">
            <li className="flex gap-4">
              <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#00c2a0]/10 text-[#00c2a0] text-sm font-bold">1</span>
              <div>
                <span className="font-medium text-white">Purchase once</span> — $497, no recurring fees.
                We provision your partner account in minutes.
              </div>
            </li>
            <li className="flex gap-4">
              <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#00c2a0]/10 text-[#00c2a0] text-sm font-bold">2</span>
              <div>
                <span className="font-medium text-white">Paste two lines of code</span> — the widget renders inside a shadow DOM,
                styled to your dark or light preference, zero CSS conflicts.
              </div>
            </li>
            <li className="flex gap-4">
              <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#00c2a0]/10 text-[#00c2a0] text-sm font-bold">3</span>
              <div>
                <span className="font-medium text-white">Your visitors scan their page</span> — they get an instant score (0–10)
                and top 3 conversion leaks. No signup required for the visitor.
              </div>
            </li>
            <li className="flex gap-4">
              <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#00c2a0]/10 text-[#00c2a0] text-sm font-bold">4</span>
              <div>
                <span className="font-medium text-white">You get the lead</span> — every audit is attributed to your partner ID.
                Full report link carries your tracking. Upsell to your own services.
              </div>
            </li>
          </ol>
        </section>

        {/* What's included */}
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-white mb-4">What you get</h2>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-[#00c2a0] mt-1">✓</span>
              Embeddable widget (dark + light themes, works on any stack)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00c2a0] mt-1">✓</span>
              Full lead attribution — every scan shows in your dashboard
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00c2a0] mt-1">✓</span>
              10 audits/hour rate limit (enough for organic traffic; upgradeable)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00c2a0] mt-1">✓</span>
              &ldquo;Powered by Nebula&rdquo; link — gives you a dofollow backlink from our domain
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00c2a0] mt-1">✓</span>
              One-time purchase. No monthly fees. No per-scan charges.
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="mb-14">
          <a
            href="https://buy.stripe.com/aFa8wPc2o7YM9613Ro43S0d"
            className="inline-block px-8 py-4 bg-[#00c2a0] text-[#0a0f1a] font-semibold rounded-lg hover:bg-[#00e0ba] transition-colors text-lg"
          >
            Get the widget — $497
          </a>
          <p className="text-sm text-slate-500 mt-3">
            Stripe handles payment. You&rsquo;ll receive your embed code within minutes.
          </p>
        </section>

        {/* Demo preview */}
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-white mb-4">Live demo</h2>
          <p className="text-slate-400 mb-4 text-sm">
            This is the exact widget your visitors see. Try it — enter any URL.
          </p>
          <div id="nebula-audit-widget" data-partner="agency_demo" data-theme="dark"></div>
          <Script src="https://nebulacomponents.com/widget/audit.js" strategy="lazyOnload" />
        </section>

        {/* FAQ */}
        <section className="border-t border-slate-800 pt-10">
          <h2 className="text-xl font-semibold text-white mb-6">Questions</h2>
          <dl className="space-y-6 text-slate-300">
            <div>
              <dt className="font-medium text-white">Can I put it on multiple client sites?</dt>
              <dd className="mt-1 text-slate-400">
                Your widget is tied to one registered domain. Need multiple?
                Contact us for a multi-domain license.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-white">What if I hit the rate limit?</dt>
              <dd className="mt-1 text-slate-400">
                The default is 10 audits/hour. If your traffic outgrows that,
                we&rsquo;ll bump it — reach out and we&rsquo;ll adjust same-day.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-white">Do visitors see my brand or Nebula&rsquo;s?</dt>
              <dd className="mt-1 text-slate-400">
                The widget shows a small &ldquo;Powered by Nebula&rdquo; footer.
                Everything else is neutral (no Nebula logos in the card).
                Future: white-label option for Growth-tier subscribers.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-white">What data do I get access to?</dt>
              <dd className="mt-1 text-slate-400">
                Every audit: visitor&rsquo;s URL, score, grade, top findings, timestamp,
                and email if they provided one. All attributed to your partner ID.
              </dd>
            </div>
          </dl>
        </section>

        <footer className="mt-16 text-sm text-slate-600">
          <Link href="/" className="text-[#00c2a0] hover:underline">← Back to Nebula</Link>
        </footer>
      </div>
    </main>
  )
}
