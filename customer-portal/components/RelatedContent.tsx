import Link from 'next/link'

/**
 * RelatedContent — Layer 5 contextual linking module.
 *
 * Usage:
 *   <RelatedContent
 *     items={[
 *       { href: '/learning-centre/google-ads-clicks-no-sales', label: 'Google Ads clicks but no sales', type: 'guide' },
 *       { href: '/audit', label: 'Get your free landing page audit', type: 'cta' },
 *     ]}
 *     heading="Related guides"
 *   />
 *
 * Renders as a clean horizontal card strip — not a link wall.
 * Max 4 items enforced visually. type='cta' gets accent treatment.
 */

export type RelatedItem = {
  href: string
  label: string
  desc?: string
  type: 'guide' | 'audit-type' | 'teardown' | 'cta' | 'tool'
}

const TYPE_BADGE: Record<RelatedItem['type'], string> = {
  guide: 'Guide',
  'audit-type': 'Audit Type',
  teardown: 'Teardown',
  cta: 'Free Audit',
  tool: 'Tool',
}

const TYPE_COLOR: Record<RelatedItem['type'], string> = {
  guide: 'text-fg-muted',
  'audit-type': 'text-accent',
  teardown: 'text-fg-muted',
  cta: 'text-accent font-semibold',
  tool: 'text-fg-muted',
}

export default function RelatedContent({
  items,
  heading = 'Related',
}: {
  items: RelatedItem[]
  heading?: string
}) {
  const capped = items.slice(0, 4) // hard cap — no link walls
  const ctas = capped.filter((i) => i.type === 'cta')
  const rest = capped.filter((i) => i.type !== 'cta')

  return (
    <aside className="mt-12 border-t border-border/40 pt-10" aria-label={heading}>
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-wide text-fg-muted">
        {heading}
      </h2>

      {/* Non-CTA items */}
      {rest.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          {rest.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-1 rounded-xl border border-border/40 bg-bg-muted/20 px-4 py-3.5 hover:border-accent/40 hover:bg-bg-muted/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${TYPE_COLOR[item.type]}`}>
                {TYPE_BADGE[item.type]}
              </span>
              <span className="text-sm font-medium text-fg leading-snug group-hover:text-accent transition-colors">
                {item.label}
              </span>
              {item.desc && (
                <span className="text-xs text-fg-dim leading-5 mt-0.5">{item.desc}</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* CTA items — accent treatment, separate row */}
      {ctas.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="inline-flex items-center gap-2 rounded bg-accent px-5 py-2.5 text-sm font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {item.label}
          <span aria-hidden="true">→</span>
        </Link>
      ))}
    </aside>
  )
}
