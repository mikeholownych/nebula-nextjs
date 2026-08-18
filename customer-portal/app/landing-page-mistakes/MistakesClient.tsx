'use client'
import RelatedContent from '@/components/RelatedContent'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export default function MistakesChecklistClient() {
  const handleDownload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.querySelector('#email') as HTMLInputElement)?.value
    const name = (form.querySelector('#name') as HTMLInputElement)?.value

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          utm_source: 'magnet',
          utm_medium: 'content',
          utm_campaign: 'mistakes_checklist',
          referrer: 'mistakes_checklist',
        }),
      })

      if (response.ok) {
        // Trigger download
        const pdfLink = document.createElement('a')
        pdfLink.href = '/assets/top-10-mistakes-checklist.pdf'
        pdfLink.download = 'Top-10-Landing-Page-Mistakes-Checklist.pdf'
        document.body.appendChild(pdfLink)
        pdfLink.click()
        document.body.removeChild(pdfLink)

        // Show confirmation
        alert('✓ Check your email to confirm. Your checklist will arrive after confirmation.')
        form.reset()
      } else {
        alert('Error. Try again.')
      }
    } catch (err) {
      console.error(err)
      alert('Error downloading. Try again.')
    }
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Hero */}
        <section className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">
            Free Resource
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-fg mb-4">
            Top 10 Landing Page Mistakes
          </h1>
          <p className="text-lg text-fg-muted max-w-[65ch] mx-auto mb-2 leading-relaxed">
            The exact mistakes that are costing founders thousands in wasted ad spend.
          </p>
          <p className="text-base text-fg-muted max-w-[65ch] mx-auto leading-relaxed">
            One-page checklist. Specific fixes for each. No fluff.
          </p>
        </section>

        {/* What You Get */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-fg mb-8">What's Inside The Checklist</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { num: 1, mistake: 'H1 Doesn\'t Match Ad Copy', why: 'Forces visitors to re-qualify. +12% bounce.' },
              { num: 2, mistake: 'CTA Says "Submit"', why: 'Too generic. Visitors unsure what happens next.' },
              { num: 3, mistake: 'Meta Description Missing', why: 'Google shows random text. -5% CTR.' },
              { num: 4, mistake: 'Form Asks Too Much Upfront', why: 'Friction spike. Abandonment +20%.' },
              { num: 5, mistake: 'No Social Proof Above Fold', why: 'Trust gap. Skeptics bounce immediately.' },
              { num: 6, mistake: 'Weak Reason to Believe', why: 'Claims without proof. Founder doubt.' },
              { num: 7, mistake: 'Mobile CTA Below Fold', why: 'Mobile users can\'t find action. +30% mobile bounce.' },
              { num: 8, mistake: 'Copy Uses "We" Not "You"', why: 'Visitor-agnostic. Low engagement.' },
              { num: 9, mistake: 'No Urgency Signaling', why: 'Visitor says "maybe later" = never.' },
              { num: 10, mistake: 'Trust Signals Absent', why: 'No testimonials, logos, guarantees. Low conviction.' },
            ].map((item) => (
              <Card key={item.num} variant="bordered" className="p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm">
                    {item.num}
                  </div>
                  <div>
                    <p className="font-semibold text-fg text-sm">{item.mistake}</p>
                    <p className="text-xs text-fg-muted mt-1">{item.why}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Download Form */}
        <section className="mb-16 bg-bg-muted rounded-xl border border-accent/20 p-8">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-extrabold text-fg mb-2">Get The Checklist</h2>
            <p className="text-fg-muted mb-6">
              One-page PDF. Download instantly. Check your site in 5 minutes.
            </p>

            <form className="space-y-4" onSubmit={handleDownload}>
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-fg mb-2">
                  Your name (optional)
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="You"
                  className="w-full rounded-lg border border-fg-muted/30 bg-bg px-4 py-3 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
                />
              </div>

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

              <button
                type="submit"
                className="w-full rounded-lg bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:opacity-85 hover:bg-accent"
              >
                Download Checklist (Free)
              </button>

              <p className="text-xs text-fg-muted text-center">
                No spam. We'll send you next week's finding (optional). Unsubscribe anytime.
              </p>
            </form>
          </div>
        </section>

        {/* Next Step CTA */}
        <section className="text-center py-8 border-t border-border">
          <h2 className="text-2xl font-extrabold text-fg mb-2">Want a Full Diagnosis?</h2>
          <p className="text-fg-muted mb-6 max-w-[65ch] mx-auto leading-relaxed">
            Run a free audit to see exactly which of these 10 mistakes your landing page has. Get your specific score and exact fixes.
          </p>
          <Link
            href="/audit?utm_source=magnet&utm_medium=content&utm_campaign=mistakes_to_audit"
            className="inline-block rounded-lg bg-danger px-6 py-3 font-semibold text-white transition-colors hover:bg-danger-light"
          >
            Start Free Audit
          </Link>
        </section>
      </div>
      <RelatedContent
        heading="Related resources"
        items={[
          { href: '/why-is-my-landing-page-not-converting', label: "Why pages don't convert", type: 'guide' },
        { href: '/landing-page-cta-audit', label: 'CTA audit', type: 'audit-type' },
        { href: '/landing-page-message-match', label: 'Message match audit', type: 'audit-type' },
        { href: '/landing-page-trust-signals', label: 'Trust signals that convert', type: 'guide' },
              { href: '/audit', label: 'Get your free audit', type: 'cta' }
        ]}
      />

    </main>
  )
}
