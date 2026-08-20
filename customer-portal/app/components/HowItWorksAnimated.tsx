'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const STEPS = [
  {
    n: '01',
    heading: 'Paste your URL',
    body: 'Any public landing page. No account, no signup, no integration.',
    icon: '⌨',
    detail: 'Works across common web stacks. If the public page is retrievable, Nebula can inspect it.',
  },
  {
    n: '02',
    heading: '9 conversion signals checked',
    body: 'Headline, CTA, social proof, mobile, load speed, SEO, AI readiness - checked against your actual page.',
    icon: '⚙',
    detail: 'Evidence from the raw HTML. Not an opinion, not a template. Your page, measured.',
  },
  {
    n: '03',
    heading: 'Findings ranked. Evidence shown.',
    body: 'Every failing signal ranked by priority with specific evidence. Not generic advice.',
    icon: '✓',
    detail: 'Know which condition to investigate first. The $97 Repair Sprint delivers the exact fix within 48 hours.',
  },
]

export default function HowItWorksAnimated() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (paused) return
    intervalRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % STEPS.length)
    }, 3000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [paused])

  return (
    <section className="border-b border-border bg-bg-muted/10 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-10 text-2xl font-bold tracking-section text-fg md:text-3xl">
          From URL to prioritized findings. Under 2 minutes.
        </h2>

        <div className="grid gap-0 md:grid-cols-3">
          {STEPS.map((step, i) => {
            const isActive = active === i
            return (
              <button
                key={step.n}
                onClick={() => { setActive(i); setPaused(true) }}
                className={[
                  'group text-left border-border p-6 transition-all duration-500 focus:outline-none',
                  i < 2 ? 'md:border-r' : '',
                  isActive ? 'bg-accent/5' : 'hover:bg-bg-surface/50',
                ].join(' ')}
              >
                {/* Progress bar */}
                <div className="mb-4 h-0.5 w-full bg-border overflow-hidden rounded-full">
                  <div
                    className="h-full bg-accent rounded-full origin-left transition-transform ease-linear"
                    style={{
                      transform: isActive && !paused ? 'scaleX(1)' : isActive ? 'scaleX(1)' : 'scaleX(0)',
                      transitionDuration: isActive && !paused ? '3000ms' : '0ms',
                    }}
                  />
                </div>

                <p className="mb-2 font-mono text-xs text-fg-muted">{step.n}</p>

                <div className="mb-1 flex items-center gap-2">
                  <span className={`text-lg transition-colors duration-200 ${isActive ? 'text-accent' : 'text-fg-dim group-hover:text-fg-muted'}`}>
                    {step.icon}
                  </span>
                  <h3 className={`font-semibold transition-colors duration-200 ${isActive ? 'text-fg' : 'text-fg-muted group-hover:text-fg'}`}>
                    {step.heading}
                  </h3>
                </div>

                <p className="text-sm text-fg-muted leading-6">{step.body}</p>

                {/* Smooth grid disclosure for active detail */}
                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isActive ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <p className="text-xs text-accent/80 leading-5">{step.detail}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <Link
            href="/audit?utm_source=how-it-works&utm_medium=homepage"
            className="rounded-lg bg-accent px-7 py-3.5 font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors text-sm inline-block"
          >
            Get My Free Score
          </Link>
          <span className="text-xs text-fg-muted">Free · No signup · Under 2 minutes</span>
        </div>
      </div>
    </section>
  )
}
