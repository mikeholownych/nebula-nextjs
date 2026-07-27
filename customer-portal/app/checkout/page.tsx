import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { formatUsd, getActiveFixPack } from '@/app/lib/public-facts'
import { readAuditUnlock } from '@/app/lib/audit-unlock-token'
import { Card } from '@/components/ui'
import CheckoutCTAButton from './CheckoutCTAButton'

export const dynamic = 'force-dynamic'

export function generateMetadata(): Metadata {
  const fixPack = getActiveFixPack()
  return {
    title: 'Checkout - Nebula Conversion Fix Pack | Nebula Components',
    description: fixPack
      ? `Purchase the Nebula Conversion Fix Pack for ${formatUsd(fixPack.priceCents)}. One-time payment via Stripe. Landing page audit and a full AI prompt pack delivered by email within minutes.`
      : 'Nebula Conversion Fix Pack checkout. No paid offer is currently available.',
    alternates: {
      canonical: 'https://nebulacomponents.shop/checkout',
    },
    robots: { index: false, follow: false },
  }
}

interface Props {
  searchParams: Promise<{ audit_id?: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function CheckoutPage({ searchParams }: Props) {
  const fixPack = getActiveFixPack()
  const fixPackPrice = fixPack ? formatUsd(fixPack.priceCents) : undefined
  const auditId = (await searchParams).audit_id
  const cookieStore = await cookies()
  const auditIdentity = auditId && UUID_RE.test(auditId)
    ? readAuditUnlock(
      auditId,
      cookieStore.get(`audit_unlock_${auditId}`)?.value,
    )
    : null

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

        {fixPack ? <Card variant="bordered" className="mb-6">
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
          <div className="flex justify-between border-t border-border pt-24 font-bold">
            <span className="text-fg">One-time total</span>
            <span className="text-accent">{fixPackPrice}</span>
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

        {fixPack && auditIdentity && auditId ? (
          <CheckoutCTAButton
            auditId={auditId}
            endpoint={fixPack.checkout.sessionEndpoint}
            offerKey={fixPack.checkout.offerKey}
          />
        ) : fixPack ? (
          <Card variant="bordered" className="mb-6">
            <h2 className="mb-3 font-semibold text-fg">Select an audited page before payment</h2>
            <p className="mb-4 text-sm text-fg-muted">
              The Fix Pack is tailored to one completed, unlocked audit. Run or open that audit
              first so checkout can bind delivery to the correct page before Stripe charges you.
            </p>
            <Link
              href="/audit"
              className="inline-flex rounded-xl bg-accent px-5 py-3 font-semibold text-bg hover:bg-accent-light"
            >
              Run the free audit
            </Link>
          </Card>
        ) : null}

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

        {fixPack && <section className="mt-12 border-t border-border pt-8 text-sm text-fg-muted">
          <h2 className="mb-3 text-base font-semibold text-fg">What happens after you pay</h2>
          <p className="mb-3">
            Within minutes of payment, you&apos;ll get an email with the full audit findings and a
            complete AI prompt pack - one prompt per issue found, pre-filled with the specifics of
            your actual page. Paste them into Claude, ChatGPT, or hand them to your own developer.
          </p>
          <p className="mb-3">
            We never ask for access to your site, CMS, or hosting - you stay in control of what
            gets changed and when. You can request one free re-audit within 30 days to see what
            changed and what&apos;s still open.
          </p>
          <h2 className="mb-3 mt-6 text-base font-semibold text-fg">Payment and security</h2>
          <p>
            Payment is processed by Stripe. Nebula Components does not handle, store, or transmit card
            details. This checkout accepts card payments through Stripe.
            After payment, the fix pack is delivered within minutes - no account creation
            required.
          </p>
        </section>}
      </div>
    </main>
  )
}
