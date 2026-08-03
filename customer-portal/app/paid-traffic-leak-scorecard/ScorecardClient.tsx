'use client'

import { useMemo, useState } from 'react'
import { scorecardQuestions, scoreScorecard } from './scorecardData'

const AUDIT_HREF = '/audit?source=paid-traffic-leak-scorecard'

const BAND_COPY = {
  low: {
    label: 'Low immediate risk',
    title: 'The page may be structurally sound.',
    description: 'Validate the live page with measured evidence before changing your spend or page.',
  },
  inspect: {
    label: 'Inspect before spending more',
    title: 'There are conditions worth checking before you increase traffic.',
    description: 'Use the risk signals below as an inspection list, not as proof that the page alone caused weak conversion.',
  },
  audit: {
    label: 'Audit before buying more traffic',
    title: 'Several conversion conditions need inspection first.',
    description: 'Run the measured audit before putting more budget behind a page with multiple self-reported risks.',
  },
} as const

export default function ScorecardClient() {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [complete, setComplete] = useState(false)

  const result = useMemo(() => scoreScorecard(answers), [answers])
  const question = scorecardQuestions[stepIndex]
  const bandCopy = BAND_COPY[result.band]

  function answer(value: boolean) {
    const nextAnswers = { ...answers, [question.id]: value }
    setAnswers(nextAnswers)
    if (stepIndex === scorecardQuestions.length - 1) {
      setComplete(true)
      return
    }
    setStepIndex((current) => current + 1)
  }

  function restart() {
    setAnswers({})
    setStepIndex(0)
    setComplete(false)
  }

  if (complete) {
    return (
      <section aria-labelledby="scorecard-result-heading" className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Your result</p>
            <h2 id="scorecard-result-heading" className="mt-2 text-2xl font-bold tracking-tight text-fg md:text-3xl">
              Your scorecard result
            </h2>
          </div>
          <div className="rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
            {result.riskCount} risk signal{result.riskCount === 1 ? '' : 's'}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-bg-muted/30 p-6 md:p-8">
          <p className="text-sm font-semibold text-accent">{bandCopy.label}</p>
          <h3 className="mt-2 text-xl font-semibold text-fg">{bandCopy.title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">{bandCopy.description}</p>
        </div>

        <p className="rounded-xl border border-border bg-bg-muted/15 px-4 py-3 text-sm leading-6 text-fg-muted">
          This is a self-assessment, not a measured audit. A risk signal tells you what to inspect; it does not prove the page is the only cause of weak conversion.
        </p>

        {result.risks.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-fg-muted">Inspection list</h3>
            {result.risks.map((risk) => (
              <article key={risk.id} className="rounded-xl border border-border bg-bg-muted/20 p-5">
                <h4 className="font-semibold text-fg">{risk.prompt}</h4>
                <p className="mt-2 text-sm leading-6 text-fg-muted">{risk.riskExplanation}</p>
                <p className="mt-3 border-l-2 border-accent pl-3 text-sm leading-6 text-fg">
                  <span className="font-semibold">Next action:</span> {risk.nextAction}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-bg-muted/20 p-5 text-sm leading-6 text-fg-muted">
            No risk signals were reported. The next step is still validation against the live page and the conversion event you care about.
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={AUDIT_HREF}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-center font-semibold text-bg transition hover:bg-accent-light"
          >
            Run the free evidence-backed audit
          </a>
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-semibold text-fg transition hover:border-accent hover:text-accent"
          >
            Start again
          </button>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="scorecard-heading" className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Nebula / Scorecard</p>
        <h2 id="scorecard-heading" className="mt-2 text-2xl font-bold tracking-tight text-fg md:text-3xl">
          Paid-Traffic Leak Scorecard
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">
          Answer seven focused questions before you buy more paid traffic. This is a fast self-check, not a replacement for the measured audit.
        </p>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-fg-muted">
        <span>Question {stepIndex + 1} of {scorecardQuestions.length}</span>
        <span>{Math.round(((stepIndex + 1) / scorecardQuestions.length) * 100)}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-border" aria-hidden="true">
        <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${((stepIndex + 1) / scorecardQuestions.length) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-border bg-bg-muted/25 p-6 md:p-8">
        <h3 className="text-xl font-semibold leading-8 text-fg md:text-2xl">{question.prompt}</h3>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => answer(true)}
            className="rounded-xl border border-border bg-bg px-4 py-4 text-left text-sm font-semibold text-fg transition hover:border-accent hover:text-accent"
          >
            {question.yesLabel}
          </button>
          <button
            type="button"
            onClick={() => answer(false)}
            className="rounded-xl border border-border bg-bg px-4 py-4 text-left text-sm font-semibold text-fg transition hover:border-signal-fail hover:text-signal-fail"
          >
            {question.noLabel}
          </button>
        </div>
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={() => setStepIndex((current) => current - 1)}
            className="mt-5 text-sm font-semibold text-fg-muted underline-offset-4 hover:text-fg hover:underline"
          >
            Back
          </button>
        )}
      </div>
    </section>
  )
}
