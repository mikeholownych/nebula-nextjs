'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Globe,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { ScaledDashboard } from './ScaledDashboard'
import { SignalHorizon } from './SignalHorizon'
import { NebulaMark } from '@/components/NebulaMark'
import VisibilityBeacon from '@/components/VisibilityBeacon'
import { trackClientFunnelEvent } from '@/app/lib/client-funnel'

export const HeroSection: React.FC = () => {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) {
      inputRef.current?.focus()
      return
    }

    setIsSubmitting(true)
    const formatted = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`

    trackClientFunnelEvent('audit_cta_clicked', {
      cta_id: 'hero_run_free_audit',
      cta_location: 'homepage_hero',
      target_url: '/audit',
      has_url: true,
    })

    router.push(`/audit?url=${encodeURIComponent(formatted)}&utm_source=hero-search`)
  }

  return (
    <section
      className="relative overflow-hidden bg-bg text-fg flex flex-col justify-between pt-8 sm:pt-12 pb-0 selection:bg-accent selection:text-bg"
      aria-label="Nebula Conversion Diagnostics Hero"
    >
      {/* 1. Atmospheric Ambient Background Lighting & Calibration Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden [contain:paint_layout]"
      >
        {/* Heavy blurs stay off mobile */}
        <div className="absolute top-24 left-1/2 hidden h-[450px] w-[900px] -translate-x-1/2 rounded-full bg-accent/[0.06] blur-[120px] md:block" />
        <div className="absolute top-16 right-[20%] hidden h-[300px] w-[400px] rounded-full bg-[#3b82f6]/[0.03] blur-[100px] md:block" />

        {/* Diagnostic Hairline Calibration Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #e8ebe7 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Viewport Boundary Calibration Corners */}
        <div className="absolute top-4 left-4 w-3 h-3 border-t border-l border-fg-muted/40" />
        <div className="absolute top-4 right-4 w-3 h-3 border-t border-r border-fg-muted/40" />
      </div>

      {/* 2. Center Hero Content Block */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-panel border border-border text-xs text-fg-muted mb-4 sm:mb-6 shadow-inner">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-mono text-fg">9 Conversion Signals</span>
          <span className="text-fg-muted/60">|</span>
          <span>Evidence-Backed Diagnosis</span>
        </div>

        {/* 2-Line Headline */}
        <h1 className="font-sans font-normal leading-[1.04] tracking-tight text-[38px] min-[400px]:text-[44px] sm:text-6xl lg:text-7xl xl:text-[76px] text-fg">
          <span className="block">Find page-side leaks.</span>
          <span className="block text-fg-muted mt-1 sm:mt-2">
            Before blaming the traffic.
          </span>
        </h1>

        {/* Unified Pill Search / Primary CTA Bar */}
        <div className="mt-6 sm:mt-8 max-w-xl mx-auto">
          <VisibilityBeacon
            beaconId="homepage_hero_audit_cta"
            eventName="audit_cta_exposed"
            properties={{
              cta_id: 'hero_run_free_audit',
              cta_location: 'homepage_hero',
            }}
          >
          <form
            onSubmit={handleAuditSubmit}
            className="relative overflow-hidden flex items-center rounded-full bg-bg-panel/90 backdrop-blur-xl border border-border p-1.5 pl-4 sm:pl-5 shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_30px_rgba(199,255,47,0.08)] focus-within:border-accent/60 focus-within:shadow-[0_0_35px_rgba(199,255,47,0.18)] transition-all"
          >
            <Globe className="h-4 w-4 shrink-0 mr-2.5 text-fg-muted transition-colors" />
            <label htmlFor="hero-landing-url" className="sr-only">
              Landing Page URL
            </label>
            <input
              ref={inputRef}
              id="hero-landing-url"
              type="url"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourlandingpage.com/pricing"
              disabled={isSubmitting}
              className="w-full bg-transparent text-sm sm:text-base text-fg placeholder:text-fg-muted/70 focus:outline-none disabled:opacity-75"
            />

            {/* Unified Submit CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              aria-label="Run Free Audit"
              className="group relative flex h-10 sm:h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent px-4 sm:px-5 font-semibold text-xs sm:text-sm text-bg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 shadow-sm"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 rounded-full border-2 border-bg border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>Run Free Audit</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
          </VisibilityBeacon>

          {/* Secondary Discovery Link */}
          <div className="mt-3.5 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-fg-muted">
            <span>or</span>
            <Link
              href="/teardowns"
              className="inline-flex items-center gap-1 font-medium text-fg hover:text-accent transition-colors"
            >
              <span>explore verified public teardowns</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* 2-Line Description with Inline Diagnostic Mark */}
        <p className="mt-6 text-sm sm:text-base text-fg-muted max-w-xl mx-auto leading-relaxed flex items-center justify-center flex-wrap gap-1.5">
          <span>Inspect observable DOM conditions against 9 conversion signals</span>
          <span className="inline-flex items-center gap-1 text-fg font-medium">
            <NebulaMark size={14} />
            with inspectable evidence
          </span>
          <span>before spending more on ads.</span>
        </p>

        {/* Diagnostic Trust Signals Strip */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-fg-muted">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
            <span>Inspectable findings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            <span>Preserved DOM evidence</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>$97 One-Leak Sprint option</span>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-10 sm:h-14 lg:h-18" />

      {/* Instrument preview is desktop-only */}
      <div className="relative z-10 hidden w-full overflow-hidden md:-mb-20 md:block lg:-mb-32">
        <ScaledDashboard />
      </div>
      <SignalHorizon />
    </section>
  )
}

export default HeroSection
