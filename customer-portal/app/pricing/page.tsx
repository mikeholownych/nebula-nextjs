import { PageShell, Button, Card } from '@/components/ui'
import { pricingFAQSchema } from '@/app/lib/faq-schemas'

export default function PricingPage() {
  return (
    <PageShell title="Pricing" description="Simple, outcome-focused pricing. Start free. Pay only when you want action.">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFAQSchema) }}
      />

      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {/* Free Tier */}
          <Card variant="bordered" className="relative">
            <div className="text-sm text-fg-muted font-medium mb-4">Free forever</div>
            <div className="mb-6">
              <span className="text-5xl font-bold text-fg">$0</span>
            </div>
            <h3 className="text-xl font-semibold text-fg mb-2">Audit Report</h3>
            <p className="text-fg-muted mb-6">Full 5-dimension teardown. No login required.</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm text-fg-muted">
                <span className="text-accent">✓</span> Clarity, CTA, Trust, Offer, Difficulty scores
              </li>
              <li className="flex items-start gap-2 text-sm text-fg-muted">
                <span className="text-accent">✓</span> Priority-ranked fixes
              </li>
              <li className="flex items-start gap-2 text-sm text-fg-muted">
                <span className="text-accent">✓</span> Specific code suggestions
              </li>
              <li className="flex items-start gap-2 text-sm text-fg-muted">
                <span className="text-accent">✓</span> Private link in 60 seconds
              </li>
            </ul>
            <a href="/audit">
              <Button variant="outline" className="w-full">Get free audit →</Button>
            </a>
          </Card>

          {/* Pro Tier */}
          <Card variant="elevated" className="relative border-accent">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-bg text-xs font-bold rounded-full">
              Most popular
            </div>
            <div className="text-sm text-accent font-medium mb-4">One-time</div>
            <div className="mb-6">
              <span className="text-5xl font-bold text-fg">$147</span>
            </div>
            <h3 className="text-xl font-semibold text-fg mb-2">Fix Pack</h3>
            <p className="text-fg-muted mb-6">Full rewrite + implementation. Delivered in 24h.</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm text-fg-muted">
                <span className="text-accent">✓</span> Everything in Audit Report
              </li>
              <li className="flex items-start gap-2 text-sm text-fg-muted">
                <span className="text-accent">✓</span> Rewritten headline & copy
              </li>
              <li className="flex items-start gap-2 text-sm text-fg-muted">
                <span className="text-accent">✓</span> CTA placement optimization
              </li>
              <li className="flex items-start gap-2 text-sm text-fg-muted">
                <span className="text-accent">✓</span> Ready-to-publish HTML/CSS
              </li>
            </ul>
            <a href="https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b">
              <Button className="w-full">Buy Fix Pack →</Button>
            </a>
            <p className="mt-4 text-xs text-center text-fg-dim">
              30-min refund if it doesn&apos;t improve conversion
            </p>
          </Card>

          {/* Agency Tier */}
          <Card variant="bordered" className="relative">
            <div className="text-sm text-fg-muted font-medium mb-4">For teams</div>
            <div className="mb-6">
              <span className="text-5xl font-bold text-fg">$497</span>
              <span className="text-fg-muted">/mo</span>
            </div>
            <h3 className="text-xl font-semibold text-fg mb-2">Agency Partner</h3>
            <p className="text-fg-muted mb-6">White-label audits for your clients.</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm text-fg-muted">
                <span className="text-accent">✓</span> Unlimited audits
              </li>
              <li className="flex items-start gap-2 text-sm text-fg-muted">
                <span className="text-accent">✓</span> White-label reports
              </li>
              <li className="flex items-start gap-2 text-sm text-fg-muted">
                <span className="text-accent">✓</span> Bulk Fix Pack discounts
              </li>
              <li className="flex items-start gap-2 text-sm text-fg-muted">
                <span className="text-accent">✓</span> Priority support
              </li>
            </ul>
            <a href="/agency-partner">
              <Button variant="outline" className="w-full">Contact sales →</Button>
            </a>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-fg mb-8 text-center">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            <details className="p-4 bg-bg-panel rounded-xl border border-border">
              <summary className="font-medium text-fg cursor-pointer">What exactly do I get with the audit?</summary>
              <p className="mt-4 text-fg-muted">
                You get a detailed breakdown of 5 conversion factors: headline clarity, CTA visibility, 
                social proof placement, offer clarity, and mobile experience. Each gets a 0-10 score 
                with specific action items.
              </p>
            </details>
            <details className="p-4 bg-bg-panel rounded-xl border border-border">
              <summary className="font-medium text-fg cursor-pointer">How is this different from other audit tools?</summary>
              <p className="mt-4 text-fg-muted">
                We focus specifically on conversion blockers—things that cost you money. No vanity metrics. 
                Each issue comes with a fix, not just a diagnosis.
              </p>
            </details>
            <details className="p-4 bg-bg-panel rounded-xl border border-border">
              <summary className="font-medium text-fg cursor-pointer">What if the Fix Pack doesn&apos;t improve my conversion?</summary>
              <p className="mt-4 text-fg-muted">
                Email us within 30 minutes of receiving it for a full refund. We&apos;re confident in the work 
                because we&apos;ve seen it work hundreds of times.
              </p>
            </details>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
