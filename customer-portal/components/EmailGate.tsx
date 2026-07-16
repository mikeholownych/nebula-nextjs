'use client'

import { useState } from 'react'
import { Button, Input, Card } from '@/components/ui'

interface EmailGateProps {
  auditId: string
  onUnlock: () => void
}

export default function EmailGate({ auditId, onUnlock }: EmailGateProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/audit/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId, email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save email')
      }

      setSubmitted(true)
      // Unlock results after brief delay
      setTimeout(() => onUnlock(), 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-bg/95 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <Card variant="elevated" className="max-w-md w-full">
        {!submitted ? (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
                <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-fg mb-2">
                Your Audit Is Ready
              </h2>
              <p className="text-fg-muted text-sm">
                Enter your email to unlock the full report. Zero spam. Just your audit results.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
                error={error}
              />

              <Button type="submit" isLoading={isLoading} className="w-full">
                Unlock My Audit →
              </Button>

              <p className="text-center text-xs text-fg-muted">
                ✓ No credit card required<br />
                ✓ Results delivered to inbox<br />
                ✓ Unsubscribe anytime
              </p>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
              <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-fg mb-2">Unlocking Your Audit...</h2>
            <p className="text-fg-muted text-sm">Results loading now</p>
          </div>
        )}
      </Card>
    </div>
  )
}
