'use client'

import Link from 'next/link'
import { useState } from 'react'

type Article = {
  slug: string
  title: string
  category: string
  description: string
}

type Props = {
  categoryOrder: string[]
  categories: Record<string, Article[]>
}

export default function CategoryAccordion({ categoryOrder, categories }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({ 'Landing Page Leaks': true })

  const toggle = (cat: string) => setOpen(prev => ({ ...prev, [cat]: !prev[cat] }))

  return (
    <div className="mx-auto max-w-5xl space-y-2">
      {categoryOrder.map(cat => {
        const list = categories[cat]
        if (!list || list.length === 0) return null
        const isOpen = !!open[cat]
        const id = cat.toLowerCase().replace(/\s+/g, '-')

        return (
          <div key={cat} id={id} className="rounded-2xl border border-border overflow-hidden">
            <button
              onClick={() => toggle(cat)}
              aria-expanded={isOpen}
              aria-controls={`${id}-panel`}
              className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <span className="h-1 w-5 rounded-full bg-accent shrink-0" />
                <span className="font-bold text-fg">{cat}</span>
                <span className="text-xs text-fg-muted">{list.length} {list.length === 1 ? 'article' : 'articles'}</span>
              </div>
              <svg
                className={`h-4 w-4 shrink-0 text-fg-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {isOpen && (
              <div id={`${id}-panel`} className="border-t border-border px-6 pb-6 pt-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((a) => (
                    <Link
                      key={a.slug}
                      href={`/learning-centre/${a.slug}`}
                      className="flex flex-col gap-2 rounded-xl border border-border bg-bg-panel p-5 transition-colors hover:border-accent/40"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-accent">{cat}</p>
                      <h3 className="text-sm font-bold leading-snug text-fg">{a.title}</h3>
                      <p className="mt-auto text-xs leading-relaxed text-fg-muted">{a.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
