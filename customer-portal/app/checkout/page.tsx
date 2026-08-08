import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { REPAIR_SPRINT_OFFER } from '@/app/lib/self-implementation-kit-offer'
import { Card } from '@/components/ui'
import CheckoutPageTracker from './CheckoutPageTracker'
import CheckoutCTAButton from './CheckoutCTAButton'

export const metadata: Metadata = {
  title: 'Checkout — One-Leak Repair Sprint | Nebula Components',
  description:
    'Purchase the $97 One-Leak Repair Sprint for one audited landing-page finding.',
  alternates: {
    canonical: 'https://nebulacomponents.com/checkout',
  },
  robots: { index: false, follow: false },
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ audit_id?: string; from?: string }>
}) {
  const { audit_id: auditId, from } = await searchParams
  const eligibleAuditId = typeof auditId === 'string' && UUID_RE.test(auditId)
  const returnedFromStripe = from === 'stripe_cancel'
  return (
    <main id="main-content" className="min-h-screen bg-bg px-6 py-12">
      <Suspense fallback={null}><CheckoutPageTracker /></Suspense>
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="text-xl font-semibold text-fg">
            Nebula
          </Link>
          <h1 className="mb-2 mt-6 text-3xl font-bold text-fg">Secure Checkout</h1>
          {returnedFromStripe ? (
            <div className="mt-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-fg-muted">
              <p className="font-semibold text-fg">Your audit is still here.</p>
              <p className="mt-1">You left the payment page — that's fine. Your findings are saved and your checkout is ready when you are.</p>
            </div>
          ) : (
            <p className="text-fg-muted">
              Payment is completed on Stripe&apos;s hosted checkout. Your card details are never seen or stored by Nebula.
            </p>
          )}
        </div>

        <Card variant="bordered" className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            One page · one finding · self-implemented
          </p>
          <h2 className="mb-4 text-xl font-semibold text-fg">{REPAIR_SPRINT_OFFER.name}</h2>
          <ul className="mb-4 space-y-2 text-sm text-fg-muted">
            {REPAIR_SPRINT_OFFER.includes.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-accent font-bold mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border pt-4 font-bold">
            <span className="text-fg">One-time total</span>
            <span className="text-accent">{'$'}{REPAIR_SPRINT_OFFER.priceUsd}</span>
          </div>
        </Card>

        {eligibleAuditId ? (
          <CheckoutCTAButton
            auditId={auditId}
            endpoint="/api/checkout"
            offerKey={REPAIR_SPRINT_OFFER.key}
          />
        ) : (
          <div className="rounded-xl border border-border bg-bg-muted/30 p-5 text-center">
            <p className="text-sm text-fg-muted">
              The kit is generated from a completed audit. Run or reopen your audit before checkout.
            </p>
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="mt-4 inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg"
            >
              Run the free audit
            </Link>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-fg-muted">
          Card details are entered only on Stripe. Nebula does not collect or store payment information.
        </p>

        <p className="mt-3 text-center text-sm text-fg-muted">
          Questions? Email <span className="text-fg">hello{'\u0040'}nebulacomponents.com</span> before purchasing.
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
            <li>2. Your tailored kit is sent by email within minutes of purchase — exact copy, code, or configuration written for one selected finding.</li>
            <li>3. You implement it yourself, with your developer, or through your CMS. No site access is required from Nebula.</li>
            <li>4. Run the free audit again within 30 days to verify the fix held.</li>
          </ol>

          <h2 className="mb-3 mt-6 text-base font-semibold text-fg">Bounded scope</h2>
          <p>
            This purchase covers a repair sprint for one high-impact finding from your audit — exact copy, a code snippet, or a configuration change targeted to your specific page. It excludes full redesigns, multiple pages, backend application logic, analytics migrations, and paid third-party tools.
          </p>

          <h2 className="mb-3 mt-6 text-base font-semibold text-fg">Evidence, not a lift guarantee</h2>
          <p>
            We verify what page condition was observed, what was changed, and whether that condition
            changed on re-audit. Traffic quality, offer strength, campaign changes, and measurement
            windows remain outside this kit, so the service does not guarantee conversion lift.
          </p>
        </section>
      </div>
    </main>
  )
}
