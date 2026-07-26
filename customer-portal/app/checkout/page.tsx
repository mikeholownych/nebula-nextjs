import type { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui'
import CheckoutCTAButton from './CheckoutCTAButton'

export const metadata: Metadata = {
  title: 'Checkout — Nebula Conversion Fix Pack | Nebula Components',
  description:
    'Purchase the Nebula Conversion Fix Pack for $97. One-time payment via Stripe. Landing page audit and a full AI prompt pack delivered by email within minutes.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/checkout',
  },
  robots: { index: false, follow: false },
}

const STRIPE_FIX_PACK_LINK = 'https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h'

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
              'A tailored AI prompt for every finding, built from your actual page',
              '30-day free re-audit to see what changed',
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

        <CheckoutCTAButton href={STRIPE_FIX_PACK_LINK} />

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
            Within minutes of payment, you&apos;ll get an email with the full audit findings and a
            complete AI prompt pack — one prompt per issue found, pre-filled with the specifics of
            your actual page. Paste them into Claude, ChatGPT, or hand them to your own developer.
          </p>
          <p className="mb-3">
            We never ask for access to your site, CMS, or hosting — you stay in control of what
            gets changed and when. You can request one free re-audit within 30 days to see what
            changed and what&apos;s still open.
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
