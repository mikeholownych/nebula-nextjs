"use client";

import Link from "next/link";

export default function AuditPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Hero Header */}
      <header className="bg-gray-900 border-b-4 border-blue-600 py-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-3">Free Landing Page Audit</h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Get your page scored on 5 conversion dimensions in 60 seconds. No account required.
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* What You Get Section */}
        <section className="bg-gray-900 rounded-xl p-8 mb-8 border border-gray-800">
          <h2 className="text-2xl font-bold mb-6">What You Get</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Dimension Scores</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  Headline Clarity — speaks to buyer problems
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  CTA Actionability — outcome-driven buttons
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  Trust Proof — credibility before the ask
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  Page Speed — Core Web Vitals
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  Mobile Responsiveness
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Actionable Output</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">→</span>
                  Overall conversion score (0-10)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">→</span>
                  Dollar-figured waste estimate
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">→</span>
                  Top 5 prioritized fixes ranked by impact
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">→</span>
                  Quick wins implementable in 24 hours
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">→</span>
                  Industry-calibrated benchmarks
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-gray-900 rounded-xl p-8 mb-8 border border-gray-800">
          <h2 className="text-2xl font-bold mb-6">Why Get an Audit?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-blue-600 rounded-lg p-3 mt-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Stop Leaking Ad Spend</h3>
                <p className="text-gray-400">
                  Most landing pages waste 20-40% of ad budget on fixable conversion issues. Find out where yours is bleeding.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-green-600 rounded-lg p-3 mt-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">60-Second Results</h3>
                <p className="text-gray-400">
                  Enter your URL, get your score. No signup, no credit card, no demo call. Instant actionable insights.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-purple-600 rounded-lg p-3 mt-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Zero Data Risk</h3>
                <p className="text-gray-400">
                  We analyze only public HTML content. Never access your analytics, ad accounts, CMS, or customer data.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sample Result Teaser */}
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">What the Audit Looks Like</h2>
          <div className="bg-gray-950 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Overall Score</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-yellow-500">6.8</span>
                <span className="text-gray-500">/10</span>
                <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded text-sm">Grade: C</span>
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              Sample page has 2 significant conversion leaks. At $5K/mo ad spend, the headline and CTA alone are costing an estimated <strong className="text-red-400">$850-$1,700/mo</strong>.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-800">
              <Link href="/audit/sample" className="text-blue-400 hover:text-blue-300 text-sm">
                View full sample audit →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-900 rounded-xl p-8 mb-8 border border-gray-800">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to Score Your Page?</h2>
            <p className="text-gray-400 mb-6">
              Enter your landing page URL and get your free audit in 60 seconds.
            </p>
            
            <form className="max-w-xl mx-auto">
              <div className="flex gap-3">
                <input
                  type="url"
                  placeholder="https://your-landing-page.com"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
                >
                  Run Free Audit
                </button>
              </div>
            </form>

            <p className="text-sm text-gray-500 mt-4">
              No signup required • Results in 60 seconds • 100% free
            </p>
          </div>
        </section>

        {/* Fix Pack Upsell */}
        <section className="bg-gray-900 rounded-xl p-8 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">$147 Fix Implementation</h2>
            <span className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-sm">Risk-Free</span>
          </div>
          <p className="text-gray-400 mb-4">
            After your free audit, upgrade to professional fix implementation.
          </p>
          <ul className="space-y-2 text-gray-300 mb-6">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Page duplicated for testing — zero risk to live campaigns
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Full refund if conversion rate doesn&apos;t improve in 14 days
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              No call required — everything ships via email
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Documented rollback — one-click revert
            </li>
          </ul>
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center mb-6">
            <p className="text-yellow-300 font-medium">
              🏷️ Full refund if your conversion rate doesn&apos;t improve. No questions asked.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="#audit-form"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Run Free Audit First
            </Link>
            <a
              href="https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Buy Fix Pack — $147
            </a>
          </div>
        </section>

        {/* Data Privacy Section */}
        <section className="mt-8 text-center text-sm text-gray-500">
          <p>
            <strong className="text-gray-400">Data Privacy:</strong> Your audit analyzes only public HTML content — 
            the same data any visitor sees. We never access analytics, ad accounts, CMS, or customer data.
          </p>
          <Link href="/privacy" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
            Full data policy →
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8 px-6 mt-12">
        <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm">
          <p>© 2024 Nebula Components. Landing page optimization for growth teams.</p>
        </div>
      </footer>
    </div>
  );
}
