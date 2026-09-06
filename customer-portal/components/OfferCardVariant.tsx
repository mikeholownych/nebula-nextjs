'use client'

import Link from 'next/link'
import { REPAIR_SPRINT_OFFER } from '@/app/lib/self-implementation-kit-offer'
import { trackClientFunnelEvent } from '@/app/lib/client-funnel'
import VisibilityBeacon from '@/components/VisibilityBeacon'

const VARIANT_ID = 'repair-sprint-outcome-v1'

type OfferCardVariantProps = {
  source: string
  placement: string
  auditId?: string
}

export default function OfferCardVariant({ source, placement, auditId }: OfferCardVariantProps) {
  const properties = {
    offer_key: REPAIR_SPRINT_OFFER.key,
    placement,
    variant_id: VARIANT_ID,
    source,
  }

  return (
    <VisibilityBeacon
      beaconId={`${VARIANT_ID}:${source}:${placement}`}
      eventName="repair_sprint_exposed"
      properties={properties}
    >
      <article
        data-testid="repair-sprint-offer-variant"
        data-variant-id={VARIANT_ID}
        data-source={source}
        data-placement={placement}
        className="rounded-md border border-accent/30 bg-bg-panel p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">One thing. One repair. One proof.</p>
        <h2 className="mt-3 text-2xl font-semibold text-fg">Know exactly which one thing to fix and how to fix it.</h2>
        <p className="mt-3 text-sm leading-6 text-fg-muted">
          The {REPAIR_SPRINT_OFFER.name} identifies the highest-priority page condition and gives you the exact artifact to implement.
        </p>
        <ul className="mt-5 space-y-2 text-sm text-fg-muted">
          <li>Exact artifact: replacement copy, code, or configuration for your page</li>
          <li>30-day same-scope re-audit to verify the condition changed</li>
          <li>One bounded condition for a one-time ${REPAIR_SPRINT_OFFER.priceUsd}</li>
        </ul>
        <p className="mt-5 text-xs leading-5 text-fg-muted">This does not promise conversion lift. It verifies a specific page condition.</p>
        <Link
          href="/checkout"
          className="mt-6 inline-flex rounded bg-accent px-5 py-3 font-semibold text-bg transition-opacity hover:opacity-85"
          onClick={() => {
            trackClientFunnelEvent('repair_sprint_clicked', properties, { auditId })
          }}
        >
          Get the exact repair →
        </Link>
      </article>
    </VisibilityBeacon>
  )
}

export { VARIANT_ID }
