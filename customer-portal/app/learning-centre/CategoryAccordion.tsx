type Article = {
  slug: string
  title: string
  category: string
}

type Props = {
  categoryOrder: string[]
  categories: Record<string, Article[]>
}

export default function CategoryAccordion({ categoryOrder, categories }: Props) {
  return (
    <div className="mx-auto max-w-5xl space-y-2">
      {categoryOrder.map(cat => {
        const list = categories[cat]
        if (!list || list.length === 0) return null
        const id = cat.toLowerCase().replace(/\s+/g, '-')

        return (
          <details
            key={cat}
            id={id}
            open={cat === 'Landing Page Leaks'}
            className="group overflow-hidden rounded-2xl border border-border"
          >
            <summary
              className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-bg-muted/30 [&::-webkit-details-marker]:hidden"
            >
              <div className="flex items-center gap-3">
                <span className="h-1 w-5 rounded-full bg-accent shrink-0" />
                <span className="font-bold text-fg">{cat}</span>
                <span className="text-xs text-fg-muted">{list.length} {list.length === 1 ? 'article' : 'articles'}</span>
              </div>
              <svg
                className="h-4 w-4 shrink-0 text-fg-muted transition-transform duration-200 group-open:rotate-180"
                viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>

            {/* Native details keeps every article anchor in raw server HTML while
                avoiding client hydration for this large directory. */}
            <div className="border-t border-border px-6 pb-6 pt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((a) => (
                  <a
                    key={a.slug}
                    href={`/learning-centre/${a.slug}`}
                    className="rounded-xl border border-border bg-bg-panel p-4 text-sm font-bold leading-snug text-fg transition-colors hover:border-accent/40"
                  >
                    {a.title}
                  </a>
                ))}
              </div>
            </div>
          </details>
        )
      })}
    </div>
  )
}
