'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui'

interface Finding {
  key: string
  label: string
  impact: number
  effort: number
  quadrant: string
  issue: string
  fix: string
}

interface AuditResult {
  audit_id: string | null
  url: string
  status: string
  score: number
  grade: string
  findings: Finding[]
  error?: string
}

const QUADRANT_LABELS: Record<string, { label: string; color: string }> = {
  quick_win: { label: 'Quick Win', color: 'bg-green-500' },
  major_project: { label: 'Major Project', color: 'bg-blue-500' },
  strategic: { label: 'Strategic', color: 'bg-purple-500' },
  fill_in: { label: 'Fill-In', color: 'bg-gray-400' },
}

export default function ResultsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const auditId = params.id as string
  const unlocked = searchParams.get('unlocked') === 'true'
  
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<AuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // If auditId is a real ID, fetch from API
        // For now, we'll use the direct API endpoint
        const response = await fetch(`/api/audit/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: decodeURIComponent(auditId),
            email: 'results@example.com'
          })
        })

        if (!response.ok) {
          throw new Error('Failed to fetch results')
        }

        const data = await response.json()
        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [auditId])

  if (loading) {
    return (
      <main className="min-h-screen bg-bg px-6 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="animate-pulse text-2xl text-fg-muted">Loading results...</div>
        </div>
      </main>
    )
  }

  if (error || !results) {
    return (
      <main className="min-h-screen bg-bg px-6 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <Card variant="elevated">
            <h1 className="mb-4 text-2xl font-bold text-fg">Error Loading Results</h1>
            <p className="text-fg-muted">{error || 'Unknown error'}</p>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-fg">
            Landing Page Audit Results
          </h1>
          <p className="text-fg-muted">
            {new URL(results.url).hostname}
          </p>
        </div>

        {/* Score Card */}
        <Card variant="elevated" className="mb-8 text-center">
          <div className="mb-4">
            <span className="text-6xl font-bold text-accent">
              {results.score.toFixed(1)}
            </span>
            <span className="text-3xl text-fg-muted">/10</span>
          </div>
          <div className="mb-4">
            <span className={`inline-block rounded-full px-4 py-1 text-lg font-semibold ${
              results.grade === 'A' ? 'bg-green-500 text-white' :
              results.grade === 'B' ? 'bg-blue-500 text-white' :
              results.grade === 'C' ? 'bg-yellow-500 text-black' :
              'bg-red-500 text-white'
            }`}>
              Grade: {results.grade}
            </span>
          </div>
          <p className="text-sm text-fg-muted">
            Evidence-backed assessment of conversion potential
          </p>
        </Card>

        {/* Findings */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-fg">Key Findings</h2>
          
          {results.findings.map((finding, index) => (
            <Card key={finding.key} variant="bordered" className="relative overflow-hidden">
              {/* Quadrant indicator */}
              <div className={`absolute left-0 top-0 h-full w-1 ${QUADRANT_LABELS[finding.quadrant]?.color || 'bg-gray-400'}`} />
              
              <div className="pl-4">
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-fg">{finding.label}</h3>
                    <span className="text-xs text-fg-muted">
                      {QUADRANT_LABELS[finding.quadrant]?.label || finding.quadrant}
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="rounded bg-accent/10 px-2 py-1 text-accent">
                      Impact: {finding.impact}/10
                    </span>
                    <span className="rounded bg-fg-muted/10 px-2 py-1 text-fg-muted">
                      Effort: {finding.effort}/10
                    </span>
                  </div>
                </div>

                {unlocked || index < 2 ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-fg-muted">
                      <strong>Issue:</strong> {finding.issue}
                    </p>
                    <p className="text-fg">
                      <strong>Fix:</strong> {finding.fix}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-fg-muted blur-sm select-none">
                      {finding.issue}
                    </p>
                    <span className="text-xs text-accent">Share email to unlock</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        {!unlocked && (
          <Card variant="elevated" className="mt-8 text-center">
            <h3 className="mb-2 text-lg font-bold text-fg">
              Want the Full Report?
            </h3>
            <p className="mb-4 text-fg-muted">
              Share your email for detailed fixes and implementation guidance
            </p>
            <button
              onClick={() => window.location.href = `/audit/${params.id}/processing`}
              className="rounded-xl bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-light"
            >
              Get Full Report
            </button>
          </Card>
        )}

        {/* Priority Matrix Legend */}
        <div className="mt-8 text-center">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Priority Matrix
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {Object.entries(QUADRANT_LABELS).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded ${value.color}`} />
                <span className="text-sm text-fg-muted">{value.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
