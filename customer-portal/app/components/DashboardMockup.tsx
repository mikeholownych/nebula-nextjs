'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCw,
  Share2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Activity,
  FileCode2,
  Wrench,
  Sparkles,
  Lock,
} from 'lucide-react'
import { NebulaMark } from '@/components/NebulaMark'

export const DashboardMockup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'fail' | 'review'>('all')
  const [selectedRow, setSelectedRow] = useState<number | null>(0)

  const findings = [
    {
      id: 'F-01',
      title: 'Primary CTA button placed 210px below initial 812px mobile fold',
      selector: 'button#checkout-cta',
      rule: 'CTA_INITIAL_VIEWPORT_V3',
      priority: 7.2,
      status: 'FAIL' as const,
      category: 'Conversion Mechanics',
      measured: 'Viewport Y = 1,022px (Target ≤ 812px)',
    },
    {
      id: 'F-02',
      title: 'H1 headline does not state explicit customer payoff or outcome',
      selector: 'h1.hero-headline',
      rule: 'HEADLINE_OUTCOME_SPECIFICITY_V2',
      priority: 5.4,
      status: 'REVIEW' as const,
      category: 'Message Clarity',
      measured: 'Detected 0 outcome markers in 12 words',
    },
    {
      id: 'F-03',
      title: 'No citable trust or security proof within 160px of payment trigger',
      selector: '.payment-form-wrapper',
      rule: 'TRUST_PROOF_PROXIMITY_V1',
      priority: 4.8,
      status: 'FAIL' as const,
      category: 'Trust & Proof',
      measured: 'Distance = 420px to nearest proof badge',
    },
    {
      id: 'F-04',
      title: 'JSON-LD structured organization and offer schema missing from DOM',
      selector: 'head > script[type="application/ld+json"]',
      rule: 'SCHEMA_ORGANIZATION_V2',
      priority: 3.1,
      status: 'FAIL' as const,
      category: 'AI Citation & Schema',
      measured: '0 structured schema nodes detected',
    },
    {
      id: 'F-05',
      title: 'Mobile Largest Contentful Paint (LCP) measured at 1.84s',
      selector: 'img.hero-banner-visual',
      rule: 'LCP_CORE_VITALS_V4',
      priority: 1.0,
      status: 'PASS' as const,
      category: 'Technical Speed',
      measured: 'LCP = 1.84s (Target ≤ 2.5s)',
    },
  ]

  const filteredFindings = findings.filter((f) => {
    if (activeTab === 'fail') return f.status === 'FAIL'
    if (activeTab === 'review') return f.status === 'REVIEW'
    return true
  })

  return (
    <div className="w-[896px] overflow-hidden border border-border bg-bg-surface text-left font-sans shadow-[0_24px_80px_rgba(0,0,0,0.65)] select-none">
      {/* 1. Browser Chrome Header */}
      <div className="flex h-11 items-center justify-between border-b border-border bg-bg-panel px-4">
        {/* Window controls */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56]/80 hover:opacity-100 transition-opacity" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]/80 hover:opacity-100 transition-opacity" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f]/80 hover:opacity-100 transition-opacity" />
          </div>

          {/* Navigation buttons */}
          <div className="ml-3 hidden sm:flex items-center gap-1 text-fg-dim">
            <button
              type="button"
              className="p-1 hover:text-fg transition-colors"
              aria-label="Back"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="p-1 hover:text-fg transition-colors"
              aria-label="Forward"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="p-1 hover:text-fg transition-colors"
              aria-label="Reload"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* URL Pill */}
        <div className="flex w-72 sm:w-96 items-center justify-center gap-2 rounded-md bg-bg py-1 px-3 text-xs text-fg-muted border border-border">
          <Lock className="h-3 w-3 text-accent" />
          <span className="text-fg font-mono text-[11px]">
            nebulacomponents.com
          </span>
          <span className="text-fg-dim">/audit/</span>
          <span className="text-accent font-mono text-[11px]">launchcrate.io</span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 text-fg-muted">
          <button
            type="button"
            className="p-1 hover:text-fg transition-colors"
            title="Share Audit"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="p-1 hover:text-fg transition-colors"
            title="Copy Report Link"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Application Body */}
      <div className="flex min-h-[440px]">
        {/* Left Diagnostic Sidebar (22% width) */}
        <div className="w-52 shrink-0 border-r border-border bg-bg-surface p-3 flex flex-col justify-between">
          <div>
            {/* Workspace / Target */}
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-bg-panel border border-border mb-3">
              <NebulaMark size={16} />
              <div className="overflow-hidden">
                <p className="text-[11px] font-semibold text-fg truncate">
                  launchcrate.io
                </p>
                <p className="text-[9px] text-fg-muted flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  Live Evaluator
                </p>
              </div>
            </div>

            {/* Nav Items */}
            <div className="space-y-1 text-xs">
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg bg-bg-card px-2.5 py-1.5 font-medium text-accent border border-accent/20"
              >
                <Activity className="h-3.5 w-3.5 text-accent" />
                <span>Diagnostic Lab</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-fg-muted hover:bg-bg-panel hover:text-fg transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Signals</span>
                </div>
                <span className="rounded bg-bg-card px-1.5 py-0.5 text-[10px] font-mono text-fg">
                  9
                </span>
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-fg-muted hover:bg-bg-panel hover:text-fg transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileCode2 className="h-3.5 w-3.5" />
                  <span>Page Findings</span>
                </div>
                <span className="rounded bg-signal-fail/10 text-signal-fail px-1.5 py-0.5 text-[10px] font-mono">
                  3 Leaks
                </span>
              </button>

              <Link
                href="/repair-sprint"
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-fg-muted hover:bg-bg-panel hover:text-fg transition-colors"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>Repair Sprint</span>
                <span className="ml-auto text-[9px] font-mono text-accent bg-accent/10 px-1 rounded">
                  $97
                </span>
              </Link>
            </div>

            {/* Audited History */}
            <div className="mt-4 border-t border-border pt-3">
              <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-fg-dim mb-2">
                Recent Targets
              </p>
              <div className="space-y-1 text-[11px] text-fg-muted">
                <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-bg-panel">
                  <span className="truncate">basecamp.com</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-bg-panel">
                  <span className="truncate">notion.so</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-bg-panel">
                  <span className="truncate text-signal-fail">airtable.com</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-signal-fail" />
                </div>
              </div>
            </div>
          </div>

          {/* Engine Status */}
          <div className="rounded bg-bg p-2 border border-border text-[10px] font-mono text-fg-dim">
            <div className="flex items-center justify-between text-fg-muted mb-0.5">
              <span>ENGINE</span>
              <span className="text-accent">v2.4.0 PASS</span>
            </div>
            <div>Registry: 9 Active Signals</div>
          </div>
        </div>

        {/* Right Main Diagnostic Viewport */}
        <div className="flex-1 bg-bg p-4 flex flex-col justify-between">
          <div>
            {/* Header Strip */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                    <span>https://launchcrate.io/pricing</span>
                    <ExternalLink className="h-3 w-3 text-fg-dim" />
                  </h3>
                  <p className="text-[11px] text-fg-muted">
                    Evaluated 9 signals across desktop &amp; mobile viewport DOM trees
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-panel border border-border text-xs font-mono text-fg">
                  <span className="h-2 w-2 rounded-full bg-signal-fail animate-pulse" />
                  3 Leaks Ranked
                </span>
                <Link
                  href="/repair-sprint"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-accent text-bg text-xs font-semibold hover:opacity-85 transition-opacity"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Fix $97</span>
                </Link>
              </div>
            </div>

            {/* 4 Stats Cards Strip */}
            <div className="grid grid-cols-4 gap-2.5 my-3">
              <div className="rounded-lg bg-bg-surface border border-border p-2.5">
                <p className="text-[10px] font-mono uppercase text-fg-muted">
                  Audit Score
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-bold text-fg">68</span>
                  <span className="text-xs text-fg-dim">/ 100</span>
                </div>
              </div>

              <div className="rounded-lg bg-bg-surface border border-border p-2.5">
                <p className="text-[10px] font-mono uppercase text-fg-muted">
                  Signals Passed
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-bold text-accent">6</span>
                  <span className="text-xs text-fg-dim">/ 9 Active</span>
                </div>
              </div>

              <div className="rounded-lg bg-bg-surface border border-border p-2.5">
                <p className="text-[10px] font-mono uppercase text-fg-muted">
                  Leaks Found
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-bold text-signal-fail">3</span>
                  <span className="text-xs text-fg-dim">Worth Fixing</span>
                </div>
              </div>

              <div className="rounded-lg bg-bg-surface border border-border p-2.5">
                <p className="text-[10px] font-mono uppercase text-fg-muted">
                  Max Priority
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-bold text-fg">7.2</span>
                  <span className="text-xs text-fg-dim">/ 10.0</span>
                </div>
              </div>
            </div>

            {/* 3 Signal Health Clusters */}
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              <div className="rounded-lg bg-bg-surface border border-border p-2 text-xs">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-fg font-medium">Conversion Mechanics</span>
                  <span className="text-signal-fail font-mono">52%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-bg-panel overflow-hidden">
                  <div className="h-full bg-signal-fail rounded-full w-[52%]" />
                </div>
              </div>

              <div className="rounded-lg bg-bg-surface border border-border p-2 text-xs">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-fg font-medium">Message &amp; Copy</span>
                  <span className="text-accent font-mono">84%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-bg-panel overflow-hidden">
                  <div className="h-full bg-accent rounded-full w-[84%]" />
                </div>
              </div>

              <div className="rounded-lg bg-bg-surface border border-border p-2 text-xs">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-fg font-medium">AI Citation &amp; Schema</span>
                  <span className="text-signal-fail font-mono">33%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-bg-panel overflow-hidden">
                  <div className="h-full bg-signal-fail rounded-full w-[33%]" />
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    activeTab === 'all'
                      ? 'bg-bg-card text-fg border border-border'
                      : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  All (5)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('fail')}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    activeTab === 'fail'
                      ? 'bg-signal-fail/10 text-signal-fail border border-signal-fail/30'
                      : 'text-fg-muted hover:text-signal-fail'
                  }`}
                >
                  Failing (3)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('review')}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    activeTab === 'review'
                      ? 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30'
                      : 'text-fg-muted hover:text-[#3b82f6]'
                  }`}
                >
                  Review (1)
                </button>
              </div>

              <span className="text-[10px] font-mono text-fg-dim">
                Click finding to inspect atom
              </span>
            </div>

            {/* 5-Row Diagnostic Findings Table */}
            <div className="rounded-lg border border-border overflow-hidden bg-bg-surface">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-bg-panel text-[10px] font-mono text-fg-muted uppercase">
                    <th className="py-2 px-3">Condition &amp; Finding</th>
                    <th className="py-2 px-3 hidden sm:table-cell">Measured State</th>
                    <th className="py-2 px-3 text-center">Score</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredFindings.map((finding, idx) => {
                    const isSelected = selectedRow === idx
                    return (
                      <tr
                        key={finding.id}
                        onClick={() => setSelectedRow(idx)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-bg-card' : 'hover:bg-bg-panel/70'
                        }`}
                      >
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            {finding.status === 'FAIL' ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-signal-fail shrink-0" />
                            ) : finding.status === 'REVIEW' ? (
                              <ShieldAlert className="h-3.5 w-3.5 text-[#3b82f6] shrink-0" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                            )}
                            <div>
                              <p className="font-medium text-fg truncate max-w-[260px]">
                                {finding.title}
                              </p>
                              <p className="font-mono text-[10px] text-fg-dim">
                                {finding.rule}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-2 px-3 hidden sm:table-cell font-mono text-[11px] text-fg-muted">
                          {finding.measured}
                        </td>

                        <td className="py-2 px-3 text-center font-mono font-bold text-fg">
                          P{finding.priority}
                        </td>

                        <td className="py-2 px-3 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              finding.status === 'FAIL'
                                ? 'bg-signal-fail/15 text-signal-fail'
                                : finding.status === 'REVIEW'
                                ? 'bg-[#3b82f6]/15 text-[#3b82f6]'
                                : 'bg-accent/15 text-accent'
                            }`}
                          >
                            {finding.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Page Element Inspection Footer */}
          <div className="mt-3 rounded-lg bg-bg-panel border border-border p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-fg-muted">Selected Page Element:</span>
              <span className="font-mono text-[11px] text-fg">
                {findings[selectedRow ?? 0]?.selector}
              </span>
            </div>
            <div className="flex items-center gap-1 text-accent font-mono text-[11px]">
              <span>Evidence-based diagnosis</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardMockup
