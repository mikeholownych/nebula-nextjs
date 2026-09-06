'use client'

import { useState } from 'react'
import posthog from '@/app/lib/posthog-browser'
import { auditAttemptIdFor } from '@/app/lib/client-analytics'
import { trackClientFunnelEvent } from '@/app/lib/client-funnel'

interface ResultsFeedbackProps {
  auditId: string
}

export default function ResultsFeedback({ auditId }: ResultsFeedbackProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submitFeedback = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!rating) return

    const auditAttemptId = auditAttemptIdFor(auditId)
    trackClientFunnelEvent('audit_feedback_submitted', {
      audit_id: auditId,
      rating,
      feedback_length: comment.trim().length,
    }, { auditId, auditAttemptId })
    posthog.capture('audit_feedback_submitted', {
      audit_id: auditId,
      rating,
      feedback_length: comment.trim().length,
      feedback_comment: comment.trim(),
    })
    setSubmitted(true)
  }

  return (
    <section className="mt-10 rounded-xl border border-border bg-bg-elevated/60 p-6 sm:p-8" aria-labelledby="results-feedback-title">
      {submitted ? (
        <div className="py-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-accent">Feedback received</p>
          <h2 className="mt-2 text-xl font-extrabold text-fg">Thanks for helping us make the report more useful.</h2>
        </div>
      ) : (
        <form onSubmit={submitFeedback}>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-fg-muted">Share your thoughts</p>
          <h2 id="results-feedback-title" className="mt-2 text-xl font-extrabold text-fg">How useful was this report?</h2>
          <div className="mt-4 flex items-center gap-2" role="radiogroup" aria-label="Report usefulness rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`Rate this report ${star} out of 5`}
                onClick={() => setRating(star)}
                className={`rounded p-1 text-3xl leading-none transition-colors ${rating && star <= rating ? 'text-accent' : 'text-fg-dim hover:text-fg-muted'}`}
              >
                ★
              </button>
            ))}
          </div>
          <label htmlFor="results-feedback-comment" className="sr-only">What did you find most valuable? Any suggestions?</label>
          <textarea
            id="results-feedback-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, 2000))}
            placeholder="What did you find most valuable? Any suggestions?"
            rows={4}
            className="mt-5 w-full resize-y rounded-lg border border-border bg-bg px-4 py-3 text-sm leading-6 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={!rating}
            className="mt-4 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send Feedback
          </button>
        </form>
      )}
    </section>
  )
}
