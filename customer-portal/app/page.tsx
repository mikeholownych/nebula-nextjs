'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'
import Footer from '@/components/Footer'
import { useCTATracking } from './hooks/useAnalytics'
import { trackAuditSubmission, trackAuditCompletion, trackFormError } from './lib/analytics'

export default function Home() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Initialize analytics (wrapped in Suspense boundary by parent)
  const trackCTA = useCTATracking()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate URL
    if (!url) {
      trackFormError('url', 'URL is required')
      setError('Please enter a URL')
      return
    }
    
    // Track submission
    trackAuditSubmission(url)
    trackCTA('find_money_leak', 'hero_form')
    
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        trackFormError('audit_form', data.error || 'Audit failed')
        throw new Error(data.error || 'Audit failed')
      }

      // Track completion
      trackAuditCompletion(url, data.overallScore, data.grade)
      
      // Navigate to results page with audit ID
      router.push(`/audit/results?id=${data.auditId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
    }
  }

  return (
    <main id="main-content" role="main" className="min-h-screen">
      {/* Ambient glow orbs */}
      <div className="glow-orb glow-orb-1" aria-hidden="true" />
      <div className="glow-orb glow-orb-2" aria-hidden="true" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-bg/80 backdrop-blur-xl border-b border-border">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-fg">
            Nebula
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-fg-muted hover:text-fg transition-colors">
              Pricing
            </Link>
            <Link href="/learning-centre" className="text-sm text-fg-muted hover:text-fg transition-colors">
              Learning
            </Link>
            <Link
              href="/audit"
              className="px-4 py-2 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent-light transition-colors"
            >
              Get Audit
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot" /> For Founders Burning Cash on Ads
          </div>
          <h1 className="hero-title">
            Your Ads Are Fine.<br />
            <span className="text-gradient">Your Landing Page Has a Leak.</span>
          </h1>
          <p className="hero-sub">
            You&apos;ve spent <strong>$10k+ on ads</strong> with little to show. The targeting? Fine. The creative? Solid.
            But they land on a page that <em>leaks conversions</em> — and you don&apos;t know where.
          </p>
          <p className="hero-promise">
            <strong>In 60 seconds,</strong> you&apos;ll know exactly where the money&apos;s leaking. Free. No signup.
          </p>

          <form onSubmit={handleSubmit} className="hero-form">
            <Input
              type="url"
              placeholder="your-landing-page.com"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-label="Your landing page URL"
              error={error}
            />
            <Button type="submit" isLoading={isLoading}>
              Find My Money Leak →
            </Button>
          </form>

          <p className="hero-trust">
            <span className="check">✓</span> No signup
            <span className="check">✓</span> No credit card
            <span className="check">✓</span> Results in 60s
          </p>
        </div>
      </section>

      {/* Social Proof Bar */}
      <div className="social-proof-bar">
        <div className="proof-item">
          <span className="proof-num">$47K+</span>
          <span className="proof-label">Wasted Ad Spend Identified</span>
        </div>
        <div className="proof-divider" />
        <div className="proof-item">
          <span className="proof-num">312</span>
          <span className="proof-label">Pages Audited</span>
        </div>
        <div className="proof-divider" />
        <div className="proof-item">
          <span className="proof-num">4.2×</span>
          <span className="proof-label">Avg Conversion Lift</span>
        </div>
      </div>

      {/* Proof Section */}
      <section className="proof-section" id="proof">
        <h2 className="section-title">Real Pages. Real Leaks Found.</h2>
        <p className="section-sub">Here&apos;s what we found on pages just like yours.</p>

        <div className="proof-grid">
          <div className="proof-card">
            <div className="proof-before">
              <span className="tag-before">BEFORE</span>
              <h3>SaaS Founder, Austin TX</h3>
              <p className="leak-found">
                <strong>Leak:</strong> CTA button same color as header.
                <span className="highlight-red"> 0.8% conversion.</span>
              </p>
            </div>
            <div className="proof-after">
              <span className="tag-after">AFTER FIX</span>
              <p className="leak-fixed">
                Contrasting CTA, clearer headline. <span className="highlight-green">3.4% conversion.</span>
              </p>
              <p className="result-math"><strong>+$12,600/month</strong></p>
            </div>
          </div>

          <div className="proof-card">
            <div className="proof-before">
              <span className="tag-before">BEFORE</span>
              <h3>E-commerce Brand, Portland OR</h3>
              <p className="leak-found">
                <strong>Leak:</strong> Trust signals buried below fold.
                <span className="highlight-red"> 1.2% conversion.</span>
              </p>
            </div>
            <div className="proof-after">
              <span className="tag-after">AFTER FIX</span>
              <p className="leak-fixed">
                Testimonials moved above CTA. <span className="highlight-green">2.9% conversion.</span>
              </p>
              <p className="result-math"><strong>+$8,400/month</strong></p>
            </div>
          </div>

          <div className="proof-card">
            <div className="proof-before">
              <span className="tag-before">BEFORE</span>
              <h3>B2B Agency, Toronto ON</h3>
              <p className="leak-found">
                <strong>Leak:</strong> Headline didn&apos;t match ad intent.
                <span className="highlight-red"> 0.5% conversion.</span>
              </p>
            </div>
            <div className="proof-after">
              <span className="tag-after">AFTER FIX</span>
              <p className="leak-fixed">
                Message-matched headline + pain-first copy. <span className="highlight-green">2.1% conversion.</span>
              </p>
              <p className="result-math"><strong>+$6,100/month</strong></p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section" id="how">
        <h2 className="section-title">How It Works</h2>
        <p className="section-sub">60 seconds. Zero guesswork.</p>

        <div className="steps-grid">
          <div className="step">
            <div className="step-num">1</div>
            <h3>Paste Your URL</h3>
            <p>Enter your landing page URL above.</p>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <h3>Get Your Score</h3>
            <p>Instant breakdown of 5 conversion factors.</p>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <h3>Fix the Leaks</h3>
            <p>Clear priorities. Fix yourself or hire us.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  )
}
