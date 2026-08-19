import { Metadata } from 'next'
import { GetFixLibraryResponse, FixEffectiveness } from '@/app/fix-library/types'

export const metadata: Metadata = {
  title: 'Fix Implementation Library - Nebula Components',
  description: 'See which fixes work best for landing pages based on real implementation data from thousands of audits.',
}

export default async function FixLibraryPage() {
  // Auth gate removed, page shows public content only
  let fixes: FixEffectiveness[] = []
  let error: string | null = null

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PLATFORM_API_URL ?? 'http://127.0.0.1:8001'}/audit/fix-library?limit=20`,
      {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          // Include cookies for authentication
          credentials: 'include'
        },
        // Add timeout
        // Note: In Next.js App Router, we'd use AbortController or similar for timeout
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: GetFixLibraryResponse = await response.json()
    fixes = data.fixes || []
  } catch (err) {
    error = err instanceof Error ? err.message : 'An unknown error occurred'
    console.error('Fix library error:', err)
  }

  // If there was an error, show error state
  if (error) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center px-6 py-12">
        <h1 className="mb-4 text-2xl font-bold">
          Fix Implementation Library
        </h1>
        <p className="mb-6 text-destructive">
          Failed to load fix library: {error}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  // If no data yet, show empty state
  if (fixes.length === 0) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center px-6 py-12">
        <h1 className="mb-4 text-2xl font-bold">
          Fix Implementation Library
        </h1>
        <p className="mb-6 text-muted-foreground">
          No fix implementation data available yet. As more users verify their
          One-Leak Repair Sprint implementations, this library will grow to show
          which fixes work best for different types of landing page issues.
        </p>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            The fix implementation library shows real-world effectiveness data
            from verified implementations, helping you understand which fixes
            are most likely to improve your conversion rate.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="px-6 py-8">
        <h1 className="mb-4 text-3xl font-bold">
          Fix Implementation Library
        </h1>
        <p className="text-muted-foreground">
          See which fixes work best for landing pages based on real implementation
          data from thousands of verified One-Leak Repair Sprint projects.
        </p>
        <div className="mt-6 flex items-center space-x-4">
          <a 
            href="/workspace" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm hover:bg-indigo-50"
          >
            Back to Workspace
          </a>
          <a 
            href="/api/fix-library/history?email=${encodeURIComponent(email)}" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm hover:bg-indigo-50"
          >
            View Your Fix History
          </a>
        </div>
      </div>
      
      <div className="px-6">
        <h2 className="mb-6 text-2xl font-bold">
          Most Effective Fixes
        </h2>
        <div className="space-y-4">
          {fixes.map((fix, index) => (
            <FixLibraryCard key={fix.finding_key} fix={fix} index={index + 1} />
          ))}
        </div>
      </div>
      
      <div className="px-6 py-8 bg-muted/50">
        <h2 className="mb-4 text-xl font-bold">
          How This Works
        </h2>
        <p className="mb-4">
          The Fix Implementation Library shows real-world effectiveness data from
          verified One-Leak Repair Sprint implementations. When users verify that
          a fix has been implemented correctly, we record the outcome to build
          social proof and help others understand which fixes work best.
        </p>
        <div className="space-y-3 text-sm">
          <p>
            <strong>Success Rate:</strong> Percentage of verified implementations
            that resulted in a positive score improvement.
          </p>
          <p>
            <strong>Avg Score Improvement:</strong> Average increase in audit
            score (0-10 scale) after implementing the fix.
          </p>
          <p>
            <strong>Data Source:</strong> Verified implementations from the
            One-Leak Repair Sprint service.
          </p>
        </div>
      </div>
    </div>
  )
}

interface FixLibraryCardProps {
  fix: FixEffectiveness
  index: number
}

function FixLibraryCard({ fix, index }: FixLibraryCardProps) {
  // Determine success rate color
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-50 text-green-900'
    if (rate >= 60) return 'bg-yellow-50 text-yellow-900'
    return 'bg-red-50 text-red-900'
  }

  // Determine improvement color
  const getImprovementColor = (improvement: number) => {
    if (improvement >= 2.0) return 'bg-green-50 text-green-900'
    if (improvement >= 1.0) return 'bg-yellow-50 text-yellow-900'
    return 'bg-red-50 text-red-900'
  }

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="flex items-center space-x-2 text-xl font-bold">
            <span className="text-muted-foreground">{index}.</span>
            <span>{fix.label}</span>
          </h3>
          <p className="mt-1 text-muted-foreground">
            Fix verification data
          </p>
        </div>
        <div className="text-right space-x-3">
          <div className={`${getSuccessRateColor(fix.success_rate_percentage)} px-3 py-1 rounded text-xs font-semibold`}>
            {fix.success_rate_percentage}% Success
          </div>
          <div className={`${getImprovementColor(parseFloat(fix.avg_score_improvement.toString()))} px-3 py-1 rounded text-xs font-semibold`}>
            +{fix.avg_score_improvement} pts
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="mb-2 font-medium text-foreground/70">
            Total Attempts
          </p>
          <p className="font-mono">{fix.total_attempts}</p>
        </div>
        <div>
          <p className="mb-2 font-medium text-foreground/70">
            Successful Implementations
          </p>
          <p className="font-mono">{fix.successful_implementations}</p>
        </div>
        <div>
          <p className="mb-2 font-medium text-foreground/70">
            Positive Outcomes
          </p>
          <p className="font-mono">{fix.positive_outcomes}</p>
        </div>
        <div>
          <p className="mb-2 font-medium text-foreground/70">
            Last Updated
          </p>
          <p className="font-mono">Recently</p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          Based on {fix.total_attempts} verified implementations. Higher success
          rates and score improvements indicate more reliable fixes.
        </p>
      </div>
    </div>
  )
}