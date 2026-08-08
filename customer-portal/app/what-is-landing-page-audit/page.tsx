"use client";

import Link from "next/link";
import Script from "next/script";

export default function WhatIsLandingPageAudit() {
  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What is a landing page audit?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "A landing page audit is a systematic evaluation of a page across 9 conversion signals: message match, trust signals, mobile CTA, load speed, CTA clarity, above-the-fold clarity, ad signals, SEO foundations, and AI citation readiness. It scores each signal on a 1–10 scale and produces a prioritized fix list.",
                },
              },
              {
                "@type": "Question",
                name: "How long does a landing page audit take?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Nebula's automated audit scores a page in seconds and returns evidence-backed findings with a prioritized fix list.",
                },
              },
              {
                "@type": "Question",
                name: "What's a good landing page audit score?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Scores range from 1 to 10. Below 5 means critical leaks are killing your conversions. 5–7 is average. 7–8 is solid. 9+ is rare. Most pages land between 4 and 7.",
                },
              },
              {
                "@type": "Question",
                name: "Should I fix my landing page myself or pay someone?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "If the audit shows a low-difficulty issue, DIY may be sufficient. The $97 One-Leak Repair Sprint is for one high-confidence page-level repair that Nebula scopes, implements, and verifies.",
                },
              },
            ],
          }),
        }}
      />

      <main id="main-content">
      <header className="bg-[#0d1117] pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-emerald-400 text-xs font-bold mb-4">
            Landing Page Guide
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
            What Is a Landing Page Audit? The Complete Guide for Founders
          </h1>
          <p className="text-gray-400 text-lg">
            A systematic audit evaluates nine conversion signals and should show evidence for every recommended fix.
          </p>
          <p className="text-gray-500 text-sm mt-4">
            Updated July 5, 2026 · 8 min read
          </p>
        </div>
      </header>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-6 py-12">
        {/* Section 1 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white pl-0 mb-4">
            What Is a Landing Page Audit?
          </h2>
          <p className="text-gray-300 mb-4">
            A landing page audit is a <strong className="text-white">systematic evaluation</strong> of a page across 9 conversion signals: message match, trust signals, mobile CTA, load speed, CTA clarity, above-the-fold clarity, ad signals, SEO foundations, and AI citation readiness.
          </p>
          <p className="text-gray-300 mb-4">
            It scores each signal on a 1–10 scale and produces a prioritized fix list. It is not a subjective opinion - it's a scored diagnostic that reveals exactly where you're losing money.
          </p>
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 my-6">
            <p className="text-emerald-400 font-semibold mb-2">The 9 Signals:</p>
            <ul className="space-y-2 text-gray-300">
              {[
                ["Message Match", "Does the page repeat the promise that earned the click?"],
                ["Trust Signals", "Is proof visible before the visitor must act?"],
                ["Mobile CTA", "Is the primary action visible on a 375px viewport?"],
                ["Load Speed", "Does the page meet the LCP, CLS, and INP thresholds?"],
                ["CTA Clarity", "Is there one clear primary action?"],
                ["Above-the-Fold Clarity", "Are the offer, audience, and action clear immediately?"],
                ["Ad Signals", "Are recognized ad-tracking artifacts present in source HTML?"],
                ["SEO Foundations", "Are the title, meta description, and H1 present?"],
                ["AI Citation Readiness", "Does the page expose structured, extractable signals?"],
              ].map(([name, description]) => (
                <li key={name} className="flex items-start gap-2">
                  <span className="text-emerald-500">→</span>
                  <span><strong className="text-white">{name}</strong> - {description}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white pl-0 mb-4">
            Why Audit Before Spending More on Ads?
          </h2>
          <p className="text-gray-300 mb-4">
            Ad platforms optimize for <strong className="text-white">clicks, not conversions</strong>. It's common to spend $2,000–$5,000 on ads and see zero sales because the landing page leaks the traffic.
          </p>
          <p className="text-gray-300 mb-4">
            A verified audit should identify those leaks before you spend another dollar on ad traffic.
          </p>
          <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-6 my-6">
            <p className="text-red-400 font-semibold mb-2">⚠️ Warning Sign</p>
            <p className="text-gray-300">
              If you've spent $1,000+ on ads with zero conversions, your landing page is the problem. Not the targeting. Not the creative. The page.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white pl-0 mb-4">
            How to Interpret Audit Scores
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-red-900/30 border border-red-700 flex items-center justify-center flex-shrink-0">
                <span className="text-red-400 font-bold text-lg">1-4</span>
              </div>
              <div>
                <p className="text-white font-semibold">Critical Leaks</p>
                <p className="text-gray-400 text-sm">Your page is bleeding money. Fix immediately.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-yellow-900/30 border border-yellow-700 flex items-center justify-center flex-shrink-0">
                <span className="text-yellow-400 font-bold text-lg">5-7</span>
              </div>
              <div>
                <p className="text-white font-semibold">Average Performance</p>
                <p className="text-gray-400 text-sm">Some things work, some don't. Room to optimize.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-emerald-900/30 border border-emerald-700 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-400 font-bold text-lg">8-10</span>
              </div>
              <div>
                <p className="text-white font-semibold">Solid Page</p>
                <p className="text-gray-400 text-sm">Minor tweaks only. Consider scaling traffic.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white pl-0 mb-4">
            DIY vs. Professional Implementation
          </h2>
          <div className="grid md:grid-cols-2 gap-4 my-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
              <p className="text-emerald-400 font-semibold mb-3">✓ DIY (Free)</p>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Headline rewrites</li>
                <li>• CTA copy changes</li>
                <li>• Simple social proof additions</li>
                <li>• Easy layout adjustments</li>
              </ul>
              <p className="text-gray-500 text-xs mt-4">Use the free Fix Kit →</p>
            </div>
            <div className="bg-[#161b22] border border-emerald-900/50 rounded-lg p-6">
              <p className="text-emerald-400 font-semibold mb-3">⚡ Professional ($97)</p>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• One high-confidence page-level repair</li>
                <li>• Buyer-approved bounded scope</li>
                <li>• Live implementation verification</li>
                <li>• Same-scope re-audit evidence</li>
              </ul>
              <Link href="/audit?utm_source=content&utm_medium=organic-content" className="text-emerald-400 text-xs mt-4 inline-block hover:underline">
                Run the audit before checkout →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 border border-emerald-700/50 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">
            Ready to Audit Your Landing Page?
          </h3>
          <p className="text-gray-300 mb-6">
            Automated, evidence-backed scoring is live - drop in a URL and see your results in seconds.
          </p>
          <Link
            href="/audit?utm_source=content&utm_medium=organic-content"
            className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 py-3 rounded-lg transition"
          >
            Get Free Audit →
          </Link>
        </section>
      </article>
      </main>
    </>
  );
}
