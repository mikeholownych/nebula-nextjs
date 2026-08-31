'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowRight, Globe } from 'lucide-react'
import { NebulaLogo } from '@/components/NebulaMark'
import VisibilityBeacon from '@/components/VisibilityBeacon'
import { trackClientFunnelEvent } from '@/app/lib/client-funnel'

const ScaledDashboard = dynamic(() => import('./ScaledDashboard'))

const PROOF_POINTS = [
  ['293', 'pages audited'],
  ['09', 'signals checked'],
  ['2.7', 'average leaks found'],
]

export const HeroSection: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAuditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget
    const input = form.elements.namedItem('url')

    if (input instanceof HTMLInputElement) {
      const trimmed = input.value.trim()
      if (trimmed && !/^https?:\/\//i.test(trimmed)) input.value = `https://${trimmed}`
    }

    setIsSubmitting(true)
    trackClientFunnelEvent('audit_cta_clicked', {
      cta_id: 'hero_run_free_audit',
      cta_location: 'homepage_hero',
      target_url: '/audit',
      has_url: true,
    })
  }

  return (
    <section
      aria-label="Landing page conversion diagnosis"
      className="relative overflow-hidden border-b border-border bg-bg text-fg selection:bg-accent selection:text-bg"
    >
      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between border-b border-border/70 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted sm:text-xs">
          <div className="flex items-center gap-3">
            <NebulaLogo size={17} />
            <span>Conversion diagnostic</span>
          </div>
          <span className="hidden sm:block">293 audits / Q3 2026</span>
          <span className="text-accent">Engine online</span>
        </div>

        <div className="grid min-h-[calc(100svh-150px)] items-center gap-12 py-12 lg:grid-cols-[minmax(0,0.94fr)_minmax(520px,0.86fr)] lg:gap-16 lg:py-16 xl:gap-24">
          <div className="max-w-[760px]">
            <p className="mb-5 max-w-md font-mono text-xs uppercase tracking-[0.14em] text-fg-muted sm:mb-7 sm:text-sm">
              Clicks arriving. Stripe still quiet.
            </p>

            <h1 className="text-[clamp(3.35rem,7.2vw,7.4rem)] font-extrabold leading-[0.88] tracking-[-0.065em] text-fg">
              <span className="block">You paid for the click.</span>
              <span className="mt-3 block text-accent">Your page lost the sale.</span>
            </h1>

            <p className="mt-6 max-w-[590px] text-lg leading-8 text-fg-muted sm:mt-8 sm:text-xl sm:leading-9">
              Find the page failure before you spend another dollar on traffic.
              Free audit. Raw evidence. Ranked fixes.
            </p>

            <VisibilityBeacon
              beaconId="homepage_hero_audit_cta"
              eventName="audit_cta_exposed"
              properties={{ cta_id: 'hero_run_free_audit', cta_location: 'homepage_hero' }}
            >
              <form
                action="/audit"
                method="get"
                onSubmit={handleAuditSubmit}
                className="mt-6 max-w-[650px] border border-border-strong bg-bg-panel p-2 transition-colors focus-within:border-accent sm:mt-9 sm:flex sm:items-stretch"
              >
                <div className="flex min-h-14 flex-1 items-center gap-3 px-3 sm:px-4">
                  <Globe className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden="true" />
                  <label htmlFor="hero-landing-url" className="sr-only">Landing page URL</label>
                  <input
                    id="hero-landing-url"
                    name="url"
                    type="text"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    placeholder="yourlandingpage.com"
                    className="w-full bg-transparent text-base text-fg placeholder:text-fg-dim focus:outline-none"
                  />
                </div>
                <input type="hidden" name="utm_source" value="hero-search" />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group flex min-h-14 w-full items-center justify-between gap-5 rounded bg-accent px-5 font-bold text-bg transition-[opacity,transform] hover:opacity-90 active:translate-y-px disabled:cursor-wait disabled:opacity-70 sm:w-auto"
                >
                  <span>{isSubmitting ? 'Opening audit' : 'Run free audit'}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </button>
              </form>
            </VisibilityBeacon>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] text-fg-muted sm:text-xs">
              <span>No signup</span>
              <span aria-hidden="true">/</span>
              <span>Under 2 minutes</span>
              <span aria-hidden="true">/</span>
              <span>Findings ranked by priority</span>
            </div>
          </div>

          <div data-hero-case-file className="relative hidden lg:block">
            <div className="absolute -left-7 top-10 bottom-10 w-px bg-accent/50" aria-hidden="true" />
            <div className="border border-border-strong bg-[#0b0c0b] shadow-[0_32px_80px_rgba(0,0,0,0.48)]">
              <div className="flex items-center justify-between border-b border-border px-5 py-4 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
                <span>Case file 0293</span>
                <span>Sample audit output</span>
                <span className="text-signal-fail">3 failures found</span>
              </div>
              <div className="relative overflow-hidden [aspect-ratio:896/612]">
                <ScaledDashboard />
              </div>
              <div className="grid grid-cols-3 border-t border-border font-mono text-[10px] uppercase tracking-[0.1em] text-fg-muted">
                <span className="border-r border-border px-4 py-3">HTML inspected</span>
                <span className="border-r border-border px-4 py-3">Viewport measured</span>
                <span className="px-4 py-3 text-accent">Evidence attached</span>
              </div>
            </div>
            <p className="mt-3 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-fg-dim">
              Illustrative product view. Not a live result.
            </p>
          </div>
        </div>

        <div className="grid border-t border-border sm:grid-cols-3">
          {PROOF_POINTS.map(([value, label], index) => (
            <div
              key={label}
              className={`flex items-baseline gap-4 py-5 sm:px-6 ${index > 0 ? 'border-t border-border sm:border-l sm:border-t-0' : ''}`}
            >
              <span className="font-mono text-3xl font-bold tracking-tight text-fg">{value}</span>
              <span className="text-sm text-fg-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroSection
