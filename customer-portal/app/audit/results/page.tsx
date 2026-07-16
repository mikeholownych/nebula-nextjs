'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Card } from '@/components/ui'
import EmailGate from '@/components/EmailGate'

interface AuditResult {
  auditId: string
  url: string
  timestamp: string
  overallScore: number
  grade: string
  dimensions: {
    headline: { score: number; max: number; status: string; issue: string; fix: string }
    cta: { score: number; max: number; status: string; issue: string; fix: string }
    trust: { score: number; max: number; status: string; issue: string; fix: string }
    speed: { score: number; max: number; status: string; issue: string; fix: string }
    mobile: { score: number; max: number; status: string; issue: string; fix: string }
  }
  topLeaks: Array<{ rank: number; name: string; impact: string; monthlyCost: string }>
  monthlyWaste: string
  fixPackPrice: number
}

function AuditResultsContent() {
  const searchParams = useSearchParams()
  const auditId = searchParams.get('id')
  const [audit, setAudit] = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [emailCaptured, setEmailCaptured] = useState(false)

  useEffect(() => {
    if (!auditId) {
      setError('No audit ID provided')
      setLoading(false)
      return
    }

    fetch(`/api/audit?id=${auditId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setAudit(data)
        }
      })
      .catch(() => setError('Failed to load audit'))
      .finally(() => setLoading(false))
  }, [auditId])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4" />
          <p className="text-fg-muted">Analyzing your landing page...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Card variant="bordered" className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-danger mb-4">Error</h1>
          <p className="text-fg-muted mb-6">{error}</p>
          <Link href="/">
            <Button>Try Again</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (!audit) return null

  // Show email gate if not unlocked
  if (!emailCaptured && auditId) {
    return (
      <>
        <EmailGate auditId={auditId} onUnlock={() => setEmailCaptured(true)} />
        <div className="min-h-screen bg-bg" />
      </>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-accent'
      case 'needs-work': return 'text-warning'
      case 'critical': return 'text-danger'
      default: return 'text-fg-muted'
    }
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-fg-muted text-sm mb-2">Audit for: {audit.url}</p>
          <h1 className="text-4xl font-bold text-fg mb-4">Your Landing Page Has Leaks</h1>

          {/* Score */}
          <Card variant="elevated" className="inline-block px-12 py-8">
            <div className="text-6xl font-bold text-fg">{audit.overallScore}/10</div>
            <div className="text-xl text-fg-muted mt-2">Grade: {audit.grade}</div>
          </Card>
        </div>

        {/* Monthly Waste Banner */}
        <Card className="mb-8 bg-danger/10 border-danger/30">
          <div className="text-center">
            <p className="text-fg-muted text-sm mb-1">Estimated Monthly Waste</p>
            <p className="text-3xl font-bold text-danger">{audit.monthlyWaste}</p>
            <p className="text-fg-muted text-sm mt-2">Based on $5k ad spend at your current conversion rate</p>
          </div>
        </Card>

        {/* Top 3 Leaks */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-fg mb-6">Top 3 Conversion Leaks</h2>
          <div className="space-y-4">
            {audit.topLeaks.map((leak) => (
              <Card key={leak.rank} variant="bordered">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center">
                    <span className="text-danger font-bold">#{leak.rank}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-fg">{leak.name}</h3>
                    <p className="text-fg-muted text-sm mt-1">{leak.impact}</p>
                    <p className="text-danger font-medium text-sm mt-2">Costing you {leak.monthlyCost}/mo</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Dimension Scores */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-fg mb-6">Detailed Scores</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(audit.dimensions).map(([key, dim]) => (
              <Card key={key} variant="bordered">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-fg capitalize">{key}</h3>
                  <span className={`text-2xl font-bold ${getStatusColor(dim.status)}`}>
                    {dim.score}/{dim.max}
                  </span>
                </div>
                <p className="text-fg-muted text-sm">{dim.issue}</p>
                {dim.score < 7 && (
                  <p className="text-accent text-sm mt-2">
                    <strong>Fix:</strong> {dim.fix}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card variant="elevated" className="text-center border-accent">
          <h2 className="text-2xl font-bold text-fg mb-2">
            Fix All 3 Leaks for ${audit.fixPackPrice}
          </h2>
          <p className="text-fg-muted mb-6">
            We&apos;ll rewrite your headline, optimize your CTA, and add trust signals.
            Delivered in 24 hours. 30-day money-back guarantee.
          </p>
          <Link href={`/checkout?audit=${audit.auditId}`}>
            <Button size="lg" className="w-full md:w-auto">
              Get Fix Pack — ${audit.fixPackPrice}
            </Button>
          </Link>
          <p className="text-fg-dim text-sm mt-4">
            Or fix it yourself using the recommendations above — free.
          </p>
        </Card>

        {/* OTO: Monthly Retainer */}
        <Card className="mt-8 bg-accent/5 border-accent/30">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-accent text-bg text-xs font-bold rounded-full mb-4">
              LIMITED OFFER
            </span>
            <h3 className="text-xl font-bold text-fg mb-2">
              Ongoing Optimization — 20% Off Yearly
            </h3>
            <p className="text-fg-muted mb-4">
              Monthly audits + priority fixes. Lock in <strong>$79/mo</strong> (normally $99) when you bundle with Fix Pack.
            </p>
            <Link href="/checkout?audit=${audit.auditId}&add=retainer">
              <Button variant="outline" size="lg">
                Add Monthly Retainer — $79/mo
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function AuditResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center"><div className="text-fg-muted">Loading...</div></div>}>
      <AuditResultsContent />
    </Suspense>
  )
}
