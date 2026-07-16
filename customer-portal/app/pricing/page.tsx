import Link from 'next/link'
import { Card, PageShell } from '@/components/ui'

export default function PricingPage() {
  return (
    <PageShell title="Pricing" description="Only verified, currently available offers are shown.">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <div className="grid gap-8 md:grid-cols-2">
          <Card variant="bordered">
            <p className="mb-3 text-sm font-medium text-fg-muted">Temporarily paused</p>
            <h2 className="text-2xl font-semibold text-fg">Automated audit</h2>
            <p className="mt-4 text-fg-muted">
              Audit scoring and email capture are unavailable while the evidence-backed engine is rebuilt and independently verified.
            </p>
            <Link href="/audit" className="mt-8 inline-flex rounded-xl border border-border px-5 py-3 font-semibold text-fg hover:border-accent">
              View audit status
            </Link>
          </Card>

          <Card variant="bordered">
            <p className="mb-3 text-sm font-medium text-fg-muted">One-time payment</p>
            <h2 className="text-2xl font-semibold text-fg">Conversion Fix Pack</h2>
            <p className="mt-2 text-4xl font-bold text-fg">$147</p>
            <p className="mt-4 text-fg-muted">Payment is completed on Stripe&apos;s hosted checkout.</p>
            <Link href="/checkout" className="mt-8 inline-flex rounded-xl bg-accent px-5 py-3 font-semibold text-bg hover:bg-accent-light">
              Review checkout
            </Link>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
