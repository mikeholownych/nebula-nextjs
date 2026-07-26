import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { REPAIR_SPRINT_OFFER } from '@/app/lib/repair-sprint-offer'
import { Card } from '@/components/ui'
import CheckoutCTAButton from './CheckoutCTAButton'

export const metadata: Metadata = {
  title: 'Checkout — One-Leak Repair Sprint | Nebula Components',
  description:
    'Purchase the One-Leak Repair Sprint for $97. One landing page, one approved repair, implemented and verified by Nebula.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/checkout',
  },
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="text-xl font-semibold text-fg">
            Nebula
          </Link>
          <h1 className="mb-2 mt-6 text-3xl font-bold text-fg">Secure Checkout</h1>
          <p className="text-fg-muted">
            Payment is completed on Stripe&apos;s hosted checkout. Your card details are never seen or stored by Nebula.
          </p>
        </div>

        <Card variant="bordered" className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            One page · one repair · verified
          </p>
          <h2 className="mb-4 text-xl font-semibold text-fg">{REPAIR_SPRINT_OFFER.name}</h2>
          <ul className="mb-4 space-y-2 text-sm text-fg-muted">
            {REPAIR_SPRINT_OFFER.includes.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border pt-4 font-bold">
            <span className="text-fg">One-time total</span>
            <span className="text-accent">${REPAIR_SPRINT_OFFER.priceUsd}</span>
          </div>
        </Card> : (
          <Card variant="bordered" className="mb-6">
            <h2 className="mb-4 font-semibold text-fg">Fix Pack unavailable</h2>
            <p className="text-sm text-fg-muted">
              No verified Fix Pack price and checkout are currently available. No payment can be
              accepted from this page.
            </p>
          </Card>
        )}

        <CheckoutCTAButton href={REPAIR_SPRINT_OFFER.checkoutUrl} />

        <p className="mt-6 text-center text-sm text-fg-muted">
          Card details are entered only on Stripe. Nebula does not collect or store payment information.
        </p>

        <p className="mt-3 text-center text-sm text-fg-muted">
          Questions? Email <span className="text-fg">hello{'\u0040'}nebulacomponents.shop</span> before purchasing.
        </p>

        <div className="mt-8 text-center">
          <Link href="/pricing" className="text-sm text-fg-muted hover:text-fg">
            ← Back to pricing
          </Link>
        </div>

        <section className="mt-12 border-t border-border pt-8 text-sm leading-6 text-fg-muted">
          <h2 className="mb-3 text-base font-semibold text-fg">What happens after you pay</h2>
          <ol className="space-y-3">
            <li>1. Stripe confirms your purchase immediately.</li>
            <li>2. Within one business day, we confirm the audited URL and propose one bounded repair.</li>
            <li>3. You approve the scope and grant temporary collaborator access or approve a buyer-approved patch handoff.</li>
            <li>4. We implement the repair, verify production, and deliver the before/after evidence packet.</li>
          </ol>
          <p className="mt-4">
            Never send passwords by email. Use your platform&apos;s collaborator role or keep deployment under your control through the approved patch path.
          </p>

          <h2 className="mb-3 mt-6 text-base font-semibold text-fg">Bounded scope</h2>
          <p>
            This purchase covers one page-level repair. It excludes full redesigns, multiple pages,
            backend application logic, analytics migrations, and paid third-party tools. If we cannot
            safely implement a bounded repair on your page, you receive a full refund before work begins.
          </p>

          <h2 className="mb-3 mt-6 text-base font-semibold text-fg">Evidence, not a lift guarantee</h2>
          <p>
            We verify what page condition was observed, what was changed, and whether that condition
            changed on re-audit. Traffic quality, offer strength, campaign changes, and measurement
            windows remain outside this repair, so the service does not guarantee conversion lift.
          </p>
        </section>}
      </div>
    </main>
  )
}
