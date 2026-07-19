'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui'
import { pushWithViewTransition } from '../../_lib/view-transition'

const STATUS_MESSAGES = [
  { message: 'Scanning page structure...', duration: 2000 },
  { message: 'Analyzing conversion elements...', duration: 2000 },
  { message: 'Checking trust signals...', duration: 2000 },
  { message: 'Measuring load performance...', duration: 2000 },
  { message: 'Generating findings...', duration: 2000 },
]

export default function ProcessingPage() {
  const params = useParams()
  const router = useRouter()
  const auditId = params.id as string
  
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [status, setStatus] = useState<'processing' | 'ready' | 'error'>('processing')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    // Simulate progress animation
    const totalDuration = STATUS_MESSAGES.reduce((sum, m) => sum + m.duration, 0)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setStatus('ready')
          return 100
        }
        return prev + 2
      })
    }, totalDuration / 50)

    // Cycle through messages
    const messageTimeouts: NodeJS.Timeout[] = []
    
    STATUS_MESSAGES.forEach((_, index) => {
      if (index > 0) {
        const timeout = setTimeout(() => {
          setMessageIndex(index)
        }, STATUS_MESSAGES.slice(0, index).reduce((sum, m) => sum + m.duration, 0))
        messageTimeouts.push(timeout)
      }
    })

    return () => {
      clearInterval(progressInterval)
      messageTimeouts.forEach(clearTimeout)
    }
  }, [])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    // TODO: Call API to update audit with email and trigger full results email
    pushWithViewTransition(router, `/audit/${auditId}/results?unlocked=true`)
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-xl">
        {status === 'processing' && (
          <Card variant="elevated" className="text-center">
            <h1 className="mb-6 text-2xl font-bold text-fg">
              Analyzing Your Page
            </h1>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-3 w-full overflow-hidden rounded-full bg-border">
                <div 
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-fg-muted">{progress}% complete</p>
            </div>

            {/* Status Message */}
            <div className="min-h-[2rem]">
              <p className="text-lg text-fg animate-pulse">
                {STATUS_MESSAGES[messageIndex].message}
              </p>
            </div>
          </Card>
        )}

        {status === 'ready' && (
          <Card variant="elevated" className="vt-audit-card text-center">
            <div className="mb-4 text-5xl">✓</div>
            <h1 className="mb-2 text-2xl font-bold text-fg">
              Your Audit Is Ready
            </h1>
            <p className="mb-6 text-fg-muted">
              Enter your email to receive the full detailed report
            </p>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-left text-sm font-medium text-fg">
                  Name (optional)
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="mb-1 block text-left text-sm font-medium text-fg">
                  Email (required)
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <button
                type="submit"
                disabled={!email}
                className="w-full rounded-xl bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Full Results
              </button>
            </form>

            <button
              onClick={() => pushWithViewTransition(router, `/audit/${auditId}/results`)}
              className="mt-4 text-sm text-accent hover:underline"
            >
              View preview now →
            </button>
          </Card>
        )}

        {status === 'error' && (
          <Card variant="elevated" className="text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <h1 className="mb-2 text-2xl font-bold text-fg">
              Something Went Wrong
            </h1>
            <p className="mb-6 text-fg-muted">
              We couldn't complete your audit. Please try again.
            </p>
            <button
              onClick={() => router.push('/audit')}
              className="rounded-xl bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-light"
            >
              Try Again
            </button>
          </Card>
        )}
      </div>
    </main>
  )
}
