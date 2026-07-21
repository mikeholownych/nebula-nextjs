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
                  text: "A landing page audit is a systematic evaluation of your page across 5 conversion dimensions: headline clarity, CTA effectiveness, social proof, page speed, and mobile experience. It scores each dimension on a 1–10 scale and produces a prioritized fix list.",
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
                  text: "If the audit shows low-difficulty issues, DIY is fine. For technical issues or multiple fixes, the $97 Conversion Fix Pack includes implementation-ready instructions.",
                },
              },
            ],
          }),
        }}
      />

      {/* Article Header */}
      <header className="bg-[#0d1117] py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            Landing Page Guide
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
            What Is a Landing Page Audit? The Complete Guide for Founders
          </h1>
          <p className="text-gray-400 text-lg">
            A systematic audit evaluates five dimensions and should show evidence for every recommended fix.
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
          <h2 className="text-xl font-bold text-white border-l-3 border-emerald-500 pl-4 mb-4">
            What Is a Landing Page Audit?
          </h2>
          <p className="text-gray-300 mb-4">
            A landing page audit is a <strong className="text-white">systematic evaluation</strong> of your page across 5 conversion dimensions: headline clarity, CTA effectiveness, social proof, page speed, and mobile experience.
          </p>
          <p className="text-gray-300 mb-4">
            It scores each dimension on a 1–10 scale and produces a prioritized fix list. It is not a subjective opinion — it's a scored diagnostic that reveals exactly where you're losing money.
          </p>
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 my-6">
            <p className="text-emerald-400 font-semibold mb-2">The 5 Dimensions:</p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">→</span>
                <span><strong className="text-white">Headline Clarity</strong> — Does it pass the "clarity test"?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">→</span>
                <span><strong className="text-white">CTA Effectiveness</strong> — Is the button visible? Compelling?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">→</span>
                <span><strong className="text-white">Social Proof</strong> — Reviews? Testimonials? Results?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">→</span>
                <span><strong className="text-white">Page Speed</strong> — Under 3 seconds? Mobile-first?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">→</span>
                <span><strong className="text-white">Mobile Experience</strong> — Thumb-friendly? Readable?</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white border-l-3 border-emerald-500 pl-4 mb-4">
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
          <h2 className="text-xl font-bold text-white border-l-3 border-emerald-500 pl-4 mb-4">
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
          <h2 className="text-xl font-bold text-white border-l-3 border-emerald-500 pl-4 mb-4">
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
                <li>• Page speed optimization</li>
                <li>• Mobile layout fixes</li>
                <li>• Multiple medium/high difficulty</li>
                <li>• Implementation-ready instructions</li>
              </ul>
              <Link href="/checkout" className="text-emerald-400 text-xs mt-4 inline-block hover:underline">
                Get Conversion Fix Pack →
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
            Automated, evidence-backed scoring is live — drop in a URL and see your results in seconds.
          </p>
          <Link
            href="/audit"
            className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 py-3 rounded-lg transition"
          >
            Get Free Audit →
          </Link>
        </section>
      </article>
    </>
  );
}
