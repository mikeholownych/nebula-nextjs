'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Card } from '@/components/ui'

function ThankYouContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const showOTO = searchParams.get('oto') !== 'retainer'
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes
  const [otoAccepted, setOTOAccepted] = useState(false)
  const [otoDeclined, setOTODeclined] = useState(false)

  // Countdown timer for OTO
  useEffect(() => {
    if (!showOTO || otoAccepted || otoDeclined) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [showOTO, otoAccepted, otoDeclined])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleOTOAccept = () => {
    // In production, this would add the subscription
    setOTOAccepted(true)
  }

  if (otoAccepted) {
    return (
      <div className="min-h-screen bg-bg py-12 px-6 flex items-center justify-center">
        <Card variant="elevated" className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-fg mb-2">You&apos;re All Set!</h1>
          <p className="text-fg-muted mb-6">
            Monthly optimization added to your order. We&apos;ll reach out within 24 hours.
          </p>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-accent">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-fg mb-2">Purchase Complete!</h1>
          <p className="text-fg-muted mb-4">
            Your Fix Pack will be delivered within 24 hours. Check your email for confirmation.
          </p>
          <p className="text-fg-dim text-sm">
            Order ID: {sessionId || 'pending'}
          </p>
        </div>

        {/* What Happens Next */}
        <Card variant="bordered" className="mb-8">
          <h2 className="font-semibold text-fg mb-4">What Happens Next</h2>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">1</span>
              <span>We review your audit results and landing page</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">2</span>
              <span>Our team rewrites your headline, CTA, and adds trust signals</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">3</span>
              <span>You receive the complete Fix Pack within 24 hours</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">4</span>
              <span>Implement and watch conversions improve — or we refund</span>
            </li>
          </ol>
        </Card>

        {/* OTO: Monthly Retainer (20% off) */}
        {showOTO && !otoDeclined && (
          <Card className="bg-accent/5 border-accent">
            <div className="text-center">
              {/* Urgency */}
              <div className="inline-flex items-center gap-2 bg-danger/20 text-danger px-3 py-1 rounded-full text-sm font-medium mb-4">
                <span className="animate-pulse">⏱</span>
                One-Time Offer expires in: <strong>{formatTime(timeLeft)}</strong>
              </div>

              <h2 className="text-2xl font-bold text-fg mb-2">
                Keep Your Page Optimized — 20% Off
              </h2>
              <p className="text-fg-muted mb-6 max-w-md mx-auto">
                Join our monthly optimization program. Each month we audited your page, 
                identify new leaks, and provide priority fixes. Lock in <strong className="text-accent">$79/mo</strong> (normally $99).
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-bg-elevated rounded-lg p-4">
                  <div className="text-2xl mb-2">🔍</div>
                  <h3 className="font-medium text-fg">Monthly Audit</h3>
                  <p className="text-fg-dim text-sm">Fresh analysis every month</p>
                </div>
                <div className="bg-bg-elevated rounded-lg p-4">
                  <div className="text-2xl mb-2">⚡</div>
                  <h3 className="font-medium text-fg">Priority Fixes</h3>
                  <p className="text-fg-dim text-sm">Skip the queue on all requests</p>
                </div>
                <div className="bg-bg-elevated rounded-lg p-4">
                  <div className="text-2xl mb-2">📉</div>
                  <h3 className="font-medium text-fg">Trend Tracking</h3>
                  <p className="text-fg-dim text-sm">Watch your scores improve</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Button size="lg" onClick={handleOTOAccept}>
                  Add Monthly Retainer — $79/mo
                </Button>
                <Button variant="ghost" size="lg" onClick={() => setOTODeclined(true)}>
                  No thanks, just the Fix Pack
                </Button>
              </div>

              <p className="text-fg-dim text-xs mt-6">
                Cancel anytime. 30-day money-back guarantee still applies.
              </p>
            </div>
          </Card>
        )}

        {/* Bottom CTA */}
        {otoDeclined && (
          <div className="text-center">
            <p className="text-fg-muted text-sm mb-4">
              This offer won&apos;t appear again. Want weekly optimization insights instead?
            </p>
            <Link href="/learning-centre">
              <Button variant="outline">Join Learning Centre (Free)</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ThankYouPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="min-h-screen bg-bg flex items-center justify-center"><p className="text-fg-muted">Loading...</p></div>
  return <ThankYouContent />
}
