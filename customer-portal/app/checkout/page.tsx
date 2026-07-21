import type { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Checkout — Nebula Conversion Fix Pack | Nebula Components',
  description:
    'Purchase the Nebula Conversion Fix Pack for $97. One-time payment via Stripe. Landing page audit and implementation delivered in 24–48 hours.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/checkout',
  },
}

const STRIPE_FIX_PACK_LINK = 'https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b'

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="text-xl font-semibold text-fg">
            Nebula
          </Link>
          <h1 className="mt-6 mb-2 text-3xl font-bold text-fg">Secure Checkout</h1>
          <p className="text-fg-muted">Payment is completed on Stripe&apos;s hosted checkout. Your card details are never seen or stored by Nebula.</p>
        </div>

        <Card variant="bordered" className="mb-6">
          <h2 className="mb-4 font-semibold text-fg">Nebula Conversion Fix Pack</h2>
          <ul className="mb-4 space-y-2 text-sm text-fg-muted">
            {[
              'Full 7-point landing page audit',
              'Written diagnosis with prioritised fix list',
              'Implementation of all identified conversion fixes',
              'Before/after comparison delivered via email',
              '30-day re-audit if conversion does not improve',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border pt-4 font-bold">
            <span className="text-fg">One-time total</span>
            <span className="text-accent">$97</span>
          </div>
        </Card>

        <a
          href={STRIPE_FIX_PACK_LINK}
          className="block w-full rounded-2xl bg-accent px-8 py-4 text-center text-lg font-semibold text-bg transition-colors hover:bg-accent-light"
        >
          Continue to Secure Stripe Checkout
        </a>

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

        <section className="mt-12 border-t border-border pt-8 text-sm text-fg-muted">
          <h2 className="mb-3 text-base font-semibold text-fg">What happens after you pay</h2>
          <p className="mb-3">
            After completing checkout you will receive a confirmation email with next steps. The audit
            and implementation process takes 24–48 hours from the moment you submit your landing page
            URL. You will receive a written diagnosis, a prioritised fix list, and a before/after
            comparison showing every change made.
          </p>
          <p className="mb-3">
            The Fix Pack includes implementation — not just a report. Every identified conversion leak
            is fixed directly on your page. If your conversion rate does not improve within 30 days,
            we run a second audit at no additional cost.
          </p>
          <h2 className="mb-3 mt-6 text-base font-semibold text-fg">Payment and security</h2>
          <p>
            Payment is processed by Stripe. Nebula Components does not handle, store, or transmit card
            details. The checkout is PCI-compliant by design. You can pay by card or any payment method
            Stripe supports in your region. After payment, access to the fix pack is immediate — no
            account creation required.
          </p>
        </section>
      </div>
    </main>
  )
}
