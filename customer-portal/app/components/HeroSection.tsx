'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Globe,
  ArrowUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { ScaledDashboard } from './ScaledDashboard'
import { SignalHorizon } from './SignalHorizon'
import { NebulaMark } from '@/components/NebulaMark'

export const HeroSection: React.FC = () => {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanStep, setScanStep] = useState(0)

  const scanSteps = [
    'Fetching static DOM snapshot...',
    'Evaluating 9 governed signals...',
    'Calculating Priority Score heuristic...',
    'Preserving evidence atoms...',
  ]

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setIsScanning(true)
    setScanStep(0)

    const interval = setInterval(() => {
      setScanStep((prev) => {
        if (prev >= scanSteps.length - 1) {
          clearInterval(interval)
          setTimeout(() => {
            const formatted = url.startsWith('http') ? url : `https://${url}`
            router.push(`/audit?url=${encodeURIComponent(formatted)}&utm_source=hero-search`)
          }, 600)
          return prev
        }
        return prev + 1
      })
    }, 500)
  }

  return (
    <section
      className="relative overflow-hidden bg-bg text-fg flex flex-col justify-between pt-8 sm:pt-12 pb-0 selection:bg-accent selection:text-bg"
      aria-label="Nebula Conversion Diagnostics Hero"
    >
      {/* 1. Atmospheric Ambient Background Lighting & Calibration Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden"
      >
        {/* Heavy blurs stay off mobile. They overflow the viewport and tax the compositor. */}
        <div className="absolute top-[28%] left-1/2 hidden h-[450px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.06] blur-[120px] md:block" />
        <div className="absolute top-[15%] right-[20%] hidden h-[300px] w-[400px] rounded-full bg-[#3b82f6]/[0.03] blur-[100px] md:block" />

        {/* Diagnostic Hairline Calibration Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #e8ebe7 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Viewport Boundary Calibration Corners */}
        <div className="absolute top-4 left-4 w-3 h-3 border-t border-l border-fg-dim/40" />
        <div className="absolute top-4 right-4 w-3 h-3 border-t border-r border-fg-dim/40" />
      </div>

      {/* 2. Center Hero Content Block (Adapted from Questly template) */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Eyebrow / Governed Signal Status */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-panel border border-border text-xs text-fg-muted mb-4 sm:mb-6 shadow-inner">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-fg">9 Governed Signals</span>
          <span className="text-fg-dim">|</span>
          <span>Deterministic Priority Ranking</span>
        </div>

        {/* Large 2-Line Headline (Questly typography scale adapted for Nebula) */}
        <h1 className="font-sans font-normal leading-[1.04] tracking-tight text-[38px] min-[400px]:text-[44px] sm:text-6xl lg:text-7xl xl:text-[76px] text-fg">
          <span className="block">Find page-side leaks.</span>
          <span className="block text-fg-muted mt-1 sm:mt-2">
            Before blaming the traffic.
          </span>
        </h1>

        {/* Centered Pill Search / URL Audit Bar */}
        <div className="mt-6 sm:mt-8 max-w-xl mx-auto">
          <form
            onSubmit={handleAuditSubmit}
            className="relative overflow-hidden flex items-center rounded-full bg-bg-panel/90 backdrop-blur-xl border border-border p-1.5 pl-4 sm:pl-5 shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_30px_rgba(199,255,47,0.08)] focus-within:border-accent/60 focus-within:shadow-[0_0_35px_rgba(199,255,47,0.18)] transition-all"
          >
            {/* Animated Radar Scanning Line */}
            {isScanning && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-accent/20 to-transparent"
              />
            )}

            <Globe className={`h-4 w-4 shrink-0 mr-2.5 transition-colors ${isScanning ? 'text-accent animate-pulse' : 'text-fg-muted'}`} />
            <label htmlFor="hero-landing-url" className="sr-only">
              Landing Page URL
            </label>
            <input
              id="hero-landing-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourlandingpage.com/pricing"
              disabled={isScanning}
              className="w-full bg-transparent text-sm sm:text-base text-fg placeholder:text-fg-dim focus:outline-none disabled:opacity-75"
            />

            {/* Circular Chartreuse Submit Button */}
            <button
              type="submit"
              disabled={isScanning}
              aria-label="Run Diagnostic Audit"
              className="group relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-accent text-bg transition-transform hover:scale-105 active:scale-95 disabled:opacity-75"
            >
              {isScanning ? (
                <div className="h-4 w-4 rounded-full border-2 border-bg border-t-transparent animate-spin" />
              ) : (
                <ArrowUp className="h-5 w-5 rotate-45 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              )}
            </button>
          </form>

          {/* Real-time Scanning Step Feedback */}
          {isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center justify-center gap-2 text-xs font-mono text-accent"
            >
              <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
              <motion.span
                key={scanStep}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {scanSteps[scanStep]}
              </motion.span>
            </motion.div>
          )}
        </div>

        {/* 2-Line Description with Inline Diagnostic Mark */}
        <p className="mt-5 text-sm sm:text-base text-fg-muted max-w-xl mx-auto leading-relaxed flex items-center justify-center flex-wrap gap-1.5">
          <span>Inspect observable DOM conditions against 9 conversion signals</span>
          <span className="inline-flex items-center gap-1 text-fg font-medium">
            <NebulaMark size={14} />
            with inspectable evidence
          </span>
          <span>before spending more on ads.</span>
        </p>

        {/* Dual Action Group */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-xs sm:text-sm font-semibold text-bg shadow-sm hover:opacity-85 hover:shadow-[0_0_24px_rgba(199,255,47,0.3)] transition-all"
          >
            <span>Run Free Audit</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/teardowns"
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-medium text-fg ring-1 ring-border bg-bg-panel/50 hover:bg-bg-panel hover:ring-white/20 transition-all"
          >
            <span>Explore Teardowns</span>
          </Link>
        </div>

        {/* Diagnostic Trust Signals Strip */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-mono text-fg-dim">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-accent" />
            <span>Inspectable findings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-accent" />
            <span>Preserved DOM evidence</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-accent" />
            <span>$97 One-Leak Sprint option</span>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-10 sm:h-14 lg:h-18" />

      {/* Instrument preview is desktop-only. On mobile the scaled 896px mockup
          plus waveform overlay sits on the CTAs and trust strip. */}
      <div className="relative z-10 hidden w-full overflow-hidden md:-mb-20 md:block lg:-mb-32">
        <ScaledDashboard />
      </div>
      <SignalHorizon />
    </section>
  )
}

export default HeroSection
