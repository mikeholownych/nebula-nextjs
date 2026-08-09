import { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Newsletter — Nebula Components',
  description: 'Weekly landing page diagnostics. Real findings from 847 audits. How founders are fixing conversion leaks.',
  openGraph: {
    title: 'Newsletter — Nebula Components',
    description: 'Weekly landing page diagnostics. Real findings from 847 audits. How founders are fixing conversion leaks.',
  },
}

export default function NewsletterPage() {
  const getUTMParams = () => {
    if (typeof window === 'undefined') return ''
    const params = new URLSearchParams(window.location.search)
    const utm_source = params.get('utm_source') || 'newsletter'
    const utm_medium = params.get('utm_medium') || 'organic'
    const utm_campaign = params.get('utm_campaign') || 'newsletter_signup'
    return `?utm_source=${utm_source}&utm_medium=${utm_medium}&utm_campaign=${utm_campaign}`
  }

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.querySelector('#email') as HTMLInputElement)?.value
    const role = (form.querySelector('#role') as HTMLSelectElement)?.value

    // Get UTM params from URL or use defaults
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const utm_source = params.get('utm_source') || 'newsletter'
    const utm_medium = params.get('utm_medium') || 'organic'
    const utm_campaign = params.get('utm_campaign') || 'newsletter_signup'

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role: role || undefined,
          referrer: utm_source,
          utm_source,
          utm_medium,
          utm_campaign,
        }),
      })

      if (response.ok) {
        alert('✓ Check your email to confirm subscription')
        form.reset()
      } else {
        alert('Error subscribing. Try again.')
      }
    } catch (err) {
      console.error(err)
      alert('Error subscribing.')
    }
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-3xl">
        
        {/* Hero */}
        <section className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">
            Weekly Insights
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-fg mb-4">
            Landing Page Diagnostics
          </h1>
          <p className="text-lg text-fg-muted max-w-[65ch] mx-auto mb-2 leading-relaxed">
            Real findings from 847 audits. Every week: one pattern, one fix, one before/after.
          </p>
          <p className="text-base text-fg-muted max-w-[65ch] mx-auto leading-relaxed">
            No hype. No fluff. Just what's actually costing you money.
          </p>
        </section>

        {/* Value Props (3-column) */}
        <section className="mb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="bordered" className="p-6">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">📊</span>
              <h3 className="font-semibold text-fg">Specific Findings</h3>
            </div>
            <p className="text-sm text-fg-muted leading-relaxed">
              Not "improve your CTA." We show: "This exact CTA phrasing beats your current one by 8%."
            </p>
          </Card>

          <Card variant="bordered" className="p-6">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">✅</span>
              <h3 className="font-semibold text-fg">Actionable Fixes</h3>
            </div>
            <p className="text-sm text-fg-muted leading-relaxed">
              Copy-paste ready. Implement in 30 minutes. No developers needed.
            </p>
          </Card>

          <Card variant="bordered" className="p-6">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">📈</span>
              <h3 className="font-semibold text-fg">Real Results</h3>
            </div>
            <p className="text-sm text-fg-muted leading-relaxed">
              Founders who implement these fixes average +2 points (out of 10) in 30 days.
            </p>
          </Card>
        </section>

        {/* Sample Issues (Pattern Library) */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-fg mb-6">
            Recent Findings From Our Audits
          </h2>
          
          <div className="space-y-4">
            {[
              {
                title: "H1 Doesn't Match Ad Copy",
                finding: "Visitor clicks ad for 'Fast checkout in 3 clicks' → lands on page saying 'Streamlined payment experience'",
                impact: "Forces re-qualification of page. Bounce rate +12%",
                fix: "Copy your ad headline directly into your H1. Test for 7 days.",
              },
              {
                title: "CTA Button Says 'Submit'",
                finding: "Generic CTA text. Visitor unsure what happens after click.",
                impact: "Click-through rate -8%. Abandonment rate +15%",
                fix: "Change to action-specific: 'Start my 7-day free trial' or 'Get my custom quote in 2 min'",
              },
              {
                title: "Meta Description Missing",
                finding: "No meta description. Google shows first 100 chars of page text (out of context).",
                impact: "CTR in search results -5%",
                fix: "Write 155-char meta description: Problem + promise. 'We cut your site abandonment in half. Here's how.'",
              },
            ].map((issue, idx) => (
              <Card key={idx} variant="elevated" className="p-6 border-accent/20">
                <div className="mb-3">
                  <h3 className="font-bold text-fg text-lg">{issue.title}</h3>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm">
                    <span className="font-semibold text-fg-muted">Finding:</span> {issue.finding}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold text-danger">Impact:</span> {issue.impact}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold text-accent">Fix:</span> {issue.fix}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Signup Form */}
        <section className="mb-16">
          <Card variant="elevated" className="p-8 bg-accent/5 border-accent/30">
            <h2 className="text-2xl font-extrabold text-fg mb-2">
              Get This Weekly
            </h2>
            <p className="text-fg-muted mb-6 max-w-[65ch]">
              Every Monday morning: One pattern, one fix, one real before/after from founders who audited their sites.
            </p>

            <form className="space-y-4" onSubmit={handleNewsletterSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-fg mb-2">
                  Your email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  className="w-full rounded-lg border border-fg-muted/30 bg-bg px-4 py-3 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-fg mb-2">
                  Your role (optional)
                </label>
                <select
                  id="role"
                  className="w-full rounded-lg border border-fg-muted/30 bg-bg px-4 py-3 text-fg focus:border-accent focus:outline-none"
                >
                  <option value="">Select one...</option>
                  <option value="founder">Founder</option>
                  <option value="marketer">Marketer</option>
                  <option value="product">Product Manager</option>
                  <option value="designer">Designer</option>
                  <option value="developer">Developer</option>
                  <option value="agency">Agency</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-light"
              >
                Subscribe (Free)
              </button>

              <p className="text-xs text-fg-muted text-center">
                No spam. One email per week. Unsubscribe anytime.
              </p>
            </form>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-fg mb-6">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {[
              {
                q: "How often do you send?",
                a: "Every Monday morning (8 AM ET). One email. One finding. One fix. ~3 min read.",
              },
              {
                q: "Is this just for selling your audit?",
                a: "No. The newsletter stands alone. We share real findings from audits we've run, whether or not the founder buys our fix pack. The goal is to build trust through expertise.",
              },
              {
                q: "Can I unsubscribe?",
                a: "Yes, anytime. Click the unsubscribe link at the bottom of any email. No questions asked.",
              },
              {
                q: "Who reads this?",
                a: "Founders, marketers, product managers, designers, and agencies who are obsessed with conversion. People who care about specifics, not generic advice.",
              },
              {
                q: "What if I have a specific question?",
                a: "Reply to any newsletter email. I read every message. If your question has broad applicability, it might become next week's finding.",
              },
            ].map((item, idx) => (
              <details key={idx} className="group border-b border-border pb-4">
                <summary className="cursor-pointer font-semibold text-fg group-open:text-accent">
                  {item.q}
                </summary>
                <p className="mt-3 text-fg-muted leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8 border-t border-border">
          <h2 className="text-2xl font-extrabold text-fg mb-2">
            Want a Free Audit First?
          </h2>
          <p className="text-fg-muted mb-6 max-w-[65ch] mx-auto leading-relaxed">
            Get a full diagnostic of your landing page. See your score, your 3 biggest leaks, and the exact fixes.
          </p>
          <Link
            href="/audit"
            className="inline-block rounded-lg bg-danger px-6 py-3 font-semibold text-white transition-colors hover:bg-danger-light"
          >
            Start Free Audit
          </Link>
        </section>

      </div>
    </main>
  )
}
