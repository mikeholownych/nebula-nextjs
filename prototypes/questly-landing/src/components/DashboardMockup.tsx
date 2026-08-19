import React, { useState } from 'react';
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
} from 'lucide-react';
import { NebulaMark } from './NebulaLogo';

export const DashboardMockup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'fail' | 'review'>('all');
  const [selectedRow, setSelectedRow] = useState<number | null>(0);

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
  ];

  const filteredFindings = findings.filter((f) => {
    if (activeTab === 'fail') return f.status === 'FAIL';
    if (activeTab === 'review') return f.status === 'REVIEW';
    return true;
  });

  return (
    <div className="w-[896px] overflow-hidden rounded-2xl bg-[#0d0f0e] border border-[#1f2422] shadow-[0_24px_80px_rgba(0,0,0,0.85),0_0_40px_rgba(199,255,47,0.08)] text-left font-sans select-none">
      {/* 1. Browser Chrome Header */}
      <div className="flex h-11 items-center justify-between border-b border-[#1f2422] bg-[#131615] px-4">
        {/* Window controls */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56]/80 hover:opacity-100 transition-opacity" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]/80 hover:opacity-100 transition-opacity" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f]/80 hover:opacity-100 transition-opacity" />
          </div>

          {/* Navigation buttons */}
          <div className="ml-3 hidden sm:flex items-center gap-1 text-[#525750]">
            <button
              type="button"
              className="p-1 hover:text-[#e8ebe7] transition-colors"
              aria-label="Back"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="p-1 hover:text-[#e8ebe7] transition-colors"
              aria-label="Forward"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="p-1 hover:text-[#e8ebe7] transition-colors"
              aria-label="Reload"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* URL Pill */}
        <div className="flex w-72 sm:w-96 items-center justify-center gap-2 rounded-md bg-[#080909] py-1 px-3 text-xs text-[#7a8078] border border-[#1f2422]">
          <Lock className="h-3 w-3 text-[#c7ff2f]" />
          <span className="text-[#e8ebe7] font-mono text-[11px]">
            nebulacomponents.com
          </span>
          <span className="text-[#525750]">/audit/</span>
          <span className="text-[#c7ff2f] font-mono text-[11px]">launchcrate.io</span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 text-[#7a8078]">
          <button
            type="button"
            className="p-1 hover:text-[#e8ebe7] transition-colors"
            title="Share Audit"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="p-1 hover:text-[#e8ebe7] transition-colors"
            title="Copy Report Link"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Application Body */}
      <div className="flex min-h-[440px]">
        {/* Left Diagnostic Sidebar (22% width) */}
        <div className="w-52 shrink-0 border-r border-[#1f2422] bg-[#0d0f0e] p-3 flex flex-col justify-between">
          <div>
            {/* Workspace / Target */}
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-[#131615] border border-[#1f2422] mb-3">
              <NebulaMark size={16} />
              <div className="overflow-hidden">
                <p className="text-[11px] font-semibold text-[#e8ebe7] truncate">
                  launchcrate.io
                </p>
                <p className="text-[9px] text-[#7a8078] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c7ff2f] animate-pulse" />
                  Live Evaluator
                </p>
              </div>
            </div>

            {/* Nav Items */}
            <div className="space-y-1 text-xs">
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg bg-[#191c1a] px-2.5 py-1.5 font-medium text-[#c7ff2f] border border-[#c7ff2f]/20"
              >
                <Activity className="h-3.5 w-3.5 text-[#c7ff2f]" />
                <span>Diagnostic Lab</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[#7a8078] hover:bg-[#131615] hover:text-[#e8ebe7] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Signals</span>
                </div>
                <span className="rounded bg-[#191c1a] px-1.5 py-0.5 text-[10px] font-mono text-[#e8ebe7]">
                  9
                </span>
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[#7a8078] hover:bg-[#131615] hover:text-[#e8ebe7] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileCode2 className="h-3.5 w-3.5" />
                  <span>Evidence Atoms</span>
                </div>
                <span className="rounded bg-[#f59e0b]/10 text-[#f59e0b] px-1.5 py-0.5 text-[10px] font-mono">
                  3 Leaks
                </span>
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[#7a8078] hover:bg-[#131615] hover:text-[#e8ebe7] transition-colors"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>Repair Sprint</span>
                <span className="ml-auto text-[9px] font-mono text-[#c7ff2f] bg-[#c7ff2f]/10 px-1 rounded">
                  $97
                </span>
              </button>
            </div>

            {/* Audited History */}
            <div className="mt-4 border-t border-[#1f2422] pt-3">
              <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-[#525750] mb-2">
                Recent Targets
              </p>
              <div className="space-y-1 text-[11px] text-[#7a8078]">
                <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#131615]">
                  <span className="truncate">basecamp.com</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c7ff2f]" />
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#131615]">
                  <span className="truncate">notion.so</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c7ff2f]" />
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#131615]">
                  <span className="truncate text-[#f59e0b]">airtable.com</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                </div>
              </div>
            </div>
          </div>

          {/* Engine Status */}
          <div className="rounded bg-[#080909] p-2 border border-[#1f2422] text-[10px] font-mono text-[#525750]">
            <div className="flex items-center justify-between text-[#7a8078] mb-0.5">
              <span>ENGINE</span>
              <span className="text-[#c7ff2f]">v2.4.0 PASS</span>
            </div>
            <div>Registry: 9 Active Signals</div>
          </div>
        </div>

        {/* Right Main Diagnostic Viewport */}
        <div className="flex-1 bg-[#080909] p-4 flex flex-col justify-between">
          <div>
            {/* Header Strip */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2422]">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#e8ebe7] flex items-center gap-2">
                    <span>https://launchcrate.io/pricing</span>
                    <ExternalLink className="h-3 w-3 text-[#525750]" />
                  </h3>
                  <p className="text-[11px] text-[#7a8078]">
                    Evaluated 9 signals across desktop & mobile viewport DOM trees
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#131615] border border-[#1f2422] text-xs font-mono text-[#e8ebe7]">
                  <span className="h-2 w-2 rounded-full bg-[#f59e0b] animate-pulse" />
                  3 Leaks Ranked
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#c7ff2f] text-[#080909] text-xs font-semibold hover:bg-[#b5eb25] transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Fix $97</span>
                </button>
              </div>
            </div>

            {/* 4 Stats Cards Strip (Questly format adapted to Nebula metrics) */}
            <div className="grid grid-cols-4 gap-2.5 my-3">
              <div className="rounded-lg bg-[#0d0f0e] border border-[#1f2422] p-2.5">
                <p className="text-[10px] font-mono uppercase text-[#7a8078]">
                  Audit Score
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-bold text-[#e8ebe7]">68</span>
                  <span className="text-xs text-[#525750]">/ 100</span>
                </div>
              </div>

              <div className="rounded-lg bg-[#0d0f0e] border border-[#1f2422] p-2.5">
                <p className="text-[10px] font-mono uppercase text-[#7a8078]">
                  Signals Passed
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-bold text-[#c7ff2f]">6</span>
                  <span className="text-xs text-[#525750]">/ 9 Active</span>
                </div>
              </div>

              <div className="rounded-lg bg-[#0d0f0e] border border-[#1f2422] p-2.5">
                <p className="text-[10px] font-mono uppercase text-[#7a8078]">
                  Leaks Found
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-bold text-[#f59e0b]">3</span>
                  <span className="text-xs text-[#525750]">Worth Fixing</span>
                </div>
              </div>

              <div className="rounded-lg bg-[#0d0f0e] border border-[#1f2422] p-2.5">
                <p className="text-[10px] font-mono uppercase text-[#7a8078]">
                  Max Priority
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-bold text-[#e8ebe7]">7.2</span>
                  <span className="text-xs text-[#525750]">/ 10.0</span>
                </div>
              </div>
            </div>

            {/* 3 Signal Health Clusters */}
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              <div className="rounded-lg bg-[#0d0f0e] border border-[#1f2422] p-2 text-xs">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#e8ebe7] font-medium">Conversion Mechanics</span>
                  <span className="text-[#f59e0b] font-mono">52%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#131615] overflow-hidden">
                  <div className="h-full bg-[#f59e0b] rounded-full w-[52%]" />
                </div>
              </div>

              <div className="rounded-lg bg-[#0d0f0e] border border-[#1f2422] p-2 text-xs">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#e8ebe7] font-medium">Message & Copy</span>
                  <span className="text-[#c7ff2f] font-mono">84%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#131615] overflow-hidden">
                  <div className="h-full bg-[#c7ff2f] rounded-full w-[84%]" />
                </div>
              </div>

              <div className="rounded-lg bg-[#0d0f0e] border border-[#1f2422] p-2 text-xs">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#e8ebe7] font-medium">AI Citation & Schema</span>
                  <span className="text-[#f59e0b] font-mono">33%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#131615] overflow-hidden">
                  <div className="h-full bg-[#f59e0b] rounded-full w-[33%]" />
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
                      ? 'bg-[#191c1a] text-[#e8ebe7] border border-[#1f2422]'
                      : 'text-[#7a8078] hover:text-[#e8ebe7]'
                  }`}
                >
                  All (5)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('fail')}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    activeTab === 'fail'
                      ? 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30'
                      : 'text-[#7a8078] hover:text-[#f59e0b]'
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
                      : 'text-[#7a8078] hover:text-[#3b82f6]'
                  }`}
                >
                  Review (1)
                </button>
              </div>

              <span className="text-[10px] font-mono text-[#525750]">
                Click finding to inspect atom
              </span>
            </div>

            {/* 5-Row Diagnostic Findings Table */}
            <div className="rounded-lg border border-[#1f2422] overflow-hidden bg-[#0d0f0e]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1f2422] bg-[#131615] text-[10px] font-mono text-[#7a8078] uppercase">
                    <th className="py-2 px-3">Condition & Finding</th>
                    <th className="py-2 px-3 hidden sm:table-cell">Measured State</th>
                    <th className="py-2 px-3 text-center">Score</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2422]">
                  {filteredFindings.map((finding, idx) => {
                    const isSelected = selectedRow === idx;
                    return (
                      <tr
                        key={finding.id}
                        onClick={() => setSelectedRow(idx)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#191c1a]' : 'hover:bg-[#131615]/70'
                        }`}
                      >
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            {finding.status === 'FAIL' ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-[#f59e0b] shrink-0" />
                            ) : finding.status === 'REVIEW' ? (
                              <ShieldAlert className="h-3.5 w-3.5 text-[#3b82f6] shrink-0" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#c7ff2f] shrink-0" />
                            )}
                            <div>
                              <p className="font-medium text-[#e8ebe7] truncate max-w-[260px]">
                                {finding.title}
                              </p>
                              <p className="font-mono text-[10px] text-[#525750]">
                                {finding.rule}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-2 px-3 hidden sm:table-cell font-mono text-[11px] text-[#7a8078]">
                          {finding.measured}
                        </td>

                        <td className="py-2 px-3 text-center font-mono font-bold text-[#e8ebe7]">
                          P{finding.priority}
                        </td>

                        <td className="py-2 px-3 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              finding.status === 'FAIL'
                                ? 'bg-[#f59e0b]/15 text-[#f59e0b]'
                                : finding.status === 'REVIEW'
                                ? 'bg-[#3b82f6]/15 text-[#3b82f6]'
                                : 'bg-[#c7ff2f]/15 text-[#c7ff2f]'
                            }`}
                          >
                            {finding.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Evidence Atom Inspection Footer */}
          <div className="mt-3 rounded-lg bg-[#131615] border border-[#1f2422] p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#c7ff2f]" />
              <span className="text-[#7a8078]">Selected Evidence Atom:</span>
              <span className="font-mono text-[11px] text-[#e8ebe7]">
                {findings[selectedRow ?? 0]?.selector}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#c7ff2f] font-mono text-[11px]">
              <span>Rule-derived diagnosis</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMockup;
