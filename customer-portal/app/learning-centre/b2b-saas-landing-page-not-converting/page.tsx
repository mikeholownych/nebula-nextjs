'use client';

import Link from 'next/link';

export default function B2BSaaSLandingPageNotConverting() {
  
  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(circle at top left, #152033, #080a0f 42%)', color: '#f5f7fb' }}>
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm" style={{ color: '#94a3b8' }}>
          <Link href="/learning-centre" className="hover:text-emerald-400 transition-colors">
            Learning Centre
          </Link>
          <span className="mx-2">/</span>
          <span style={{ color: '#10b981' }}>Industry Specific</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            Industry Specific
          </div>
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#f5f7fb' }}>
            B2B SaaS Landing Page Not Converting? The Demo Ask Is Too Soon
          </h1>
          <p className="text-lg" style={{ color: '#94a3b8' }}>
            B2B SaaS pages ask for demos before proving value. Learn how adding value-first content before the ask can transform your conversion rates.
          </p>
        </header>

        {/* Problem & Solution Box */}
        <div className="mb-12 p-6 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#ef4444' }}>The Problem</h3>
              <p style={{ color: '#cbd5e1' }}>B2B SaaS pages ask for demos before proving value, leading to high bounce rates and missed opportunities.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#10b981' }}>The Solution</h3>
              <p style={{ color: '#cbd5e1' }}>Add value-first content before the ask—give enterprise buyers the proof they need to raise their hand.</p>
            </div>
          </div>
        </div>

        {/* Section 1 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#f5f7fb' }}>
            1. The Demo-First Mistake: Why Asking Too Early Kills Conversions
          </h2>
          <p className="mb-4" style={{ color: '#cbd5e1' }}>
            B2B SaaS landing pages often load with a prominent "Request a Demo" button before visitors even understand what the product does. This pattern emerged from sales-led growth strategies, but it's increasingly ineffective for modern buyers who conduct independent research before engaging with sales.
          </p>
          <p className="mb-4" style={{ color: '#cbd5e1' }}>
            When enterprise buyers encounter a demo ask before seeing value, they bounce. Why? Because they're not ready to commit 30 minutes to a conversation with a salesperson. They're still in discovery mode, evaluating whether your solution is even worth investigating further.
          </p>
          <div className="p-4 rounded-lg my-4" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
            <p className="text-sm italic" style={{ color: '#94a3b8' }}>
              "The median B2B buyer is 57% through the purchase process before they engage with sales. Lead with the demo ask, and you'll never get that meeting."
            </p>
          </div>
          <p style={{ color: '#cbd5e1' }}>
            The result: high bounce rates, wasted traffic spend, and a pipeline full of unqualified leads who booked demos before understanding your value proposition—or never booked at all.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#f5f7fb' }}>
            2. What Enterprise Buyers Need First
          </h2>
          <p className="mb-4" style={{ color: '#cbd5e1' }}>
            Enterprise buyers need proof before they'll engage. They're evaluating multiple vendors simultaneously and need to quickly determine if your solution fits their requirements. Here's what they're looking for:
          </p>
          <ul className="space-y-4 mb-6">
            <li className="flex items-start gap-3">
              <span style={{ color: '#10b981' }}>•</span>
              <div>
                <strong style={{ color: '#f5f7fb' }}>Case Studies:</strong>
                <span style={{ color: '#cbd5e1' }}> Real results from similar companies in their industry. They want to see evidence you've solved problems like theirs, with measurable outcomes.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span style={{ color: '#10b981' }}>•</span>
              <div>
                <strong style={{ color: '#f5f7fb' }}>ROI Calculators:</strong>
                <span style={{ color: '#cbd5e1' }}> Interactive tools that help them build the internal business case. Enterprise buyers need to justify spend—give them the numbers.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span style={{ color: '#10b981' }}>•</span>
              <div>
                <strong style={{ color: '#f5f7fb' }}>Technical Specs:</strong>
                <span style={{ color: '#cbd5e1' }}> Architecture details, security certifications, integration capabilities. Technical evaluators need this information to shortlist vendors.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span style={{ color: '#10b981' }}>•</span>
              <div>
                <strong style={{ color: '#f5f7fb' }}>Competitive Comparisons:</strong>
                <span style={{ color: '#cbd5e1' }}> Honest differentiation that helps them understand where you fit in the landscape—not marketing fluff, but substantive differences.</span>
              </div>
            </li>
          </ul>
          <p style={{ color: '#cbd5e1' }}>
            When you provide these assets upfront, you enable buyers to self-qualify. The ones who book the demo after consuming this content are significantly more qualified and further along in their decision process.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#f5f7fb' }}>
            3. Restructuring the Page: Value Hierarchy Before CTA
          </h2>
          <p className="mb-4" style={{ color: '#cbd5e1' }}>
            The solution isn't to remove the demo CTA—it's to restructure the page so value comes first. Think of your landing page as a value progression that earns the right to ask for commitment.
          </p>
          <div className="p-4 rounded-lg my-4" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
            <h4 className="font-semibold mb-3" style={{ color: '#f5f7fb' }}>Value-First Page Structure:</h4>
            <ol className="space-y-2" style={{ color: '#cbd5e1' }}>
              <li>1. <strong>Hero:</strong> Clear value proposition + proof point (customer logo, stat, or trust signal)</li>
              <li>2. <strong>Problem Agitation:</strong> Show you understand their specific pain points</li>
              <li>3. <strong>Solution Overview:</strong> How you solve it differently</li>
              <li>4. <strong>Social Proof:</strong> Case studies, testimonials, results</li>
              <li>5. <strong>Interactive Value:</strong> ROI calculator, self-assessment, or similar tool</li>
              <li>6. <strong>Demo CTA:</strong> Now you've earned the ask</li>
            </ol>
          </div>
          <p style={{ color: '#cbd5e1' }}>
            This structure respects the buyer's journey. Those ready to book can still find the CTA, but those who need more information get what they need to move forward. You capture both ends of the intent spectrum.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#f5f7fb' }}>
            4. Quick Wins: Add Proof Elements Above the Fold
          </h2>
          <p className="mb-4" style={{ color: '#cbd5e1' }}>
            Before rebuilding the entire page, deploy these quick wins that can improve conversion within days:
          </p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <span style={{ color: '#10b981' }}>✓</span>
              <span style={{ color: '#cbd5e1' }}>Add a proof banner above the fold: "Trusted by [relevant logos]" or "#1 rated on G2 for [category]"</span>
            </li>
            <li className="flex items-start gap-3">
              <span style={{ color: '#10b981' }}>✓</span>
              <span style={{ color: '#cbd5e1' }}>Create a secondary CTA for content: "See How It Works" that leads to a product tour or explainer video</span>
            </li>
            <li className="flex items-start gap-3">
              <span style={{ color: '#10b981' }}>✓</span>
              <span style={{ color: '#cbd5e1' }}>Add one case study link below the hero—ideally with a headline highlighting results</span>
            </li>
            <li className="flex items-start gap-3">
              <span style={{ color: '#10b981' }}>✓</span>
              <span style={{ color: '#cbd5e1' }}>Include a single quantified outcome in your headline: "[Product] helped [Company] achieve [result] in [timeframe]"</span>
            </li>
          </ul>
          <p style={{ color: '#cbd5e1' }}>
            These changes dont require a complete redesign—they layer proof onto your existing structure. Test, measure, and iterate based on what your buyers respond to.
          </p>
        </section>

        {/* CTA Section */}
        <div className="mb-12 p-8 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <h3 className="text-xl font-bold mb-3" style={{ color: '#f5f7fb' }}>
            Is Your SaaS Landing Page Asking for Too Much Too Soon?
          </h3>
          <p className="mb-6" style={{ color: '#cbd5e1' }}>
            Get a full audit of your landing page's conversion flow with specific recommendations for value-first restructuring.
          </p>
          <Link 
            href="/audit" 
            className="inline-block px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105"
            style={{ background: '#10b981', color: '#080a0f' }}
          >
            Get Your Free Audit
          </Link>
        </div>

        {/* Related Articles */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#f5f7fb' }}>Related Articles</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link 
              href="/learning-centre/landing-page-not-converting"
              className="p-4 rounded-lg transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              <h4 className="font-semibold mb-1" style={{ color: '#f5f7fb' }}>Landing Page Not Converting</h4>
              <p className="text-sm" style={{ color: '#94a3b8' }}>Diagnose and fix the root causes of low conversion rates.</p>
            </Link>
            <Link 
              href="/learning-centre/proof-before-cta"
              className="p-4 rounded-lg transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              <h4 className="font-semibold mb-1" style={{ color: '#f5f7fb' }}>Proof Before CTA</h4>
              <p className="text-sm" style={{ color: '#94a3b8' }}>Build credibility before asking for commitment.</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
