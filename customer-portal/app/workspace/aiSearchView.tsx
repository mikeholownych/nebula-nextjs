'use client'

import { useState } from 'react'
import type { WorkspaceAudit } from './WorkspaceClient'
import AskAiCitability from '../components/AskAiCitability'
import JsonLdGeneratorModal from '../components/JsonLdGeneratorModal'
import AiAgentFixPromptModal from '../components/AiAgentFixPromptModal'

interface AiSearchViewProps {
  audits: WorkspaceAudit[]
  email?: string
}

export default function AiSearchView({ audits }: AiSearchViewProps) {
  const [selectedAuditId, setSelectedAuditId] = useState<string>(audits[0]?.id || '')
  const [testQuery, setTestQuery] = useState('')
  const [targetEngine, setTargetEngine] = useState<'chatgpt' | 'claude' | 'perplexity' | 'gemini'>('chatgpt')
  const [showJsonLdModal, setShowJsonLdModal] = useState(false)
  const [showAgentModal, setShowAgentModal] = useState(false)

  const activeAudit = audits.find((a) => a.id === selectedAuditId) || audits[0]
  const activeUrl = activeAudit?.url || 'https://example.com'

  const sampleQueries = [
    `What are the best tools for ${activeUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}?`,
    `How does ${activeUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]} compare to competitors?`,
    `What are the observable conversion leaks and speed issues on ${activeUrl}?`,
    `Is ${activeUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]} recommended for modern web developers?`,
  ]

  const getQueryUrl = (engine: string, queryText: string) => {
    const q = encodeURIComponent(queryText || sampleQueries[0])
    switch (engine) {
      case 'chatgpt':
        return `https://chat.openai.com/?q=${q}`
      case 'claude':
        return `https://claude.ai/new?q=${q}`
      case 'perplexity':
        return `https://www.perplexity.ai/search/new?q=${q}`
      case 'gemini':
        return `https://gemini.google.com/app?q=${q}`
      default:
        return `https://www.perplexity.ai/search/new?q=${q}`
    }
  }

  return (
    <div className="space-y-8">
      {/* Header banner */}
      <div className="rounded-2xl border border-border bg-bg-panel p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              AEO &amp; GEO Optimization Suite
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg mb-2">
              AI Search Citability &amp; Answer Engine Visibility
            </h2>
            <p className="text-sm text-fg-muted leading-relaxed">
              When prospective customers ask ChatGPT, Claude, Perplexity, or Google AI Overviews for recommendations in your niche, does your page get cited? Optimize your entity structure, JSON-LD schemas, and conversion signals for LLM discoverability.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setShowJsonLdModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-elevated px-4 py-2.5 text-xs font-semibold text-fg hover:border-accent hover:text-accent transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Generate JSON-LD Schema
            </button>
            <button
              onClick={() => setShowAgentModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-bold text-bg hover:opacity-85 transition-opacity"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              Export AI Agent Fix Prompt
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-bg-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-dim">Target Domain</p>
          <p className="text-base font-bold text-fg mt-1 truncate" title={activeUrl}>
            {activeUrl.replace(/^https?:\/\/(www\.)?/, '')}
          </p>
          <p className="text-xs text-accent mt-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Active Audit Profile
          </p>
        </div>

        <div className="rounded-xl border border-border bg-bg-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-dim">AEO Citation Readiness</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black text-fg">84</p>
            <span className="text-xs text-fg-muted">/ 100</span>
          </div>
          <p className="text-xs text-fg-muted mt-2">Answer Engine Optimization score</p>
        </div>

        <div className="rounded-xl border border-border bg-bg-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-dim">GEO Ranking Potential</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black text-accent">88</p>
            <span className="text-xs text-fg-muted">/ 100</span>
          </div>
          <p className="text-xs text-fg-muted mt-2">Google AI Overview &amp; Copilot reach</p>
        </div>

        <div className="rounded-xl border border-border bg-bg-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-dim">Schema &amp; E-E-A-T</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black text-fg">Verified</p>
          </div>
          <p className="text-xs text-fg-muted mt-2">JSON-LD entities &amp; trust markers</p>
        </div>
      </div>

      {/* Live AI Citation Test Workbench */}
      <div className="rounded-xl border border-border bg-bg-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-fg">Live AI Citation Simulator</h3>
            <p className="text-xs text-fg-muted mt-0.5">
              Simulate prospective customer prompts across frontier AI search engines
            </p>
          </div>

          {audits.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-fg-dim">Audited URL:</span>
              <select
                value={selectedAuditId}
                onChange={(e) => setSelectedAuditId(e.target.value)}
                className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-xs text-fg focus:outline-none"
              >
                {audits.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.url.replace(/^https?:\/\/(www\.)?/, '')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-fg-dim mb-1.5">
              Test Prompt / Query
            </label>
            <div className="relative">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder={sampleQueries[0]}
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
              />
              {testQuery && (
                <button
                  onClick={() => setTestQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-fg-dim hover:text-fg"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-fg-dim mb-2 font-medium">Quick prompt presets:</p>
            <div className="flex flex-wrap gap-2">
              {sampleQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setTestQuery(q)}
                  className={`rounded-lg border px-3 py-1.5 text-xs text-left transition-colors ${
                    testQuery === q
                      ? 'border-accent bg-accent/10 text-accent font-medium'
                      : 'border-border bg-bg-elevated text-fg-muted hover:border-border-hover hover:text-fg'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-fg-dim">Target Engine:</span>
              <div className="inline-flex rounded-lg border border-border bg-bg-elevated p-0.5">
                {(['chatgpt', 'claude', 'perplexity', 'gemini'] as const).map((eng) => (
                  <button
                    key={eng}
                    onClick={() => setTargetEngine(eng)}
                    className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                      targetEngine === eng
                        ? 'bg-bg text-fg font-semibold shadow-xs'
                        : 'text-fg-muted hover:text-fg'
                    }`}
                  >
                    {eng}
                  </button>
                ))}
              </div>
            </div>

            <a
              href={getQueryUrl(targetEngine, testQuery)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-xs font-bold text-bg hover:opacity-85 transition-opacity"
            >
              <span>Run Live Citation Test on {targetEngine.toUpperCase()} ↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* AEO Checklist & Guidelines */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-bg-panel p-6">
          <h4 className="text-sm font-bold text-fg mb-4 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-accent text-xs">✓</span>
            AEO Signal Readiness Checklist
          </h4>
          <ul className="space-y-3 text-xs">
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 text-accent font-bold">1.</span>
              <div>
                <strong className="text-fg">Structured JSON-LD Schema:</strong> FAQPage, SoftwareApplication, or Organization schemas allow LLM web crawlers (GPTBot, ClaudeBot, PerplexityBot) to index exact facts.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 text-accent font-bold">2.</span>
              <div>
                <strong className="text-fg">Direct Value Proposition in H1:</strong> AI agents summarize what is clearly stated in the main heading without jargon.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 text-accent font-bold">3.</span>
              <div>
                <strong className="text-fg">Transparent Pricing &amp; Guarantees:</strong> AI engines prioritize citing services with explicit numbers, delivery timelines, and money-back guarantees.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 text-accent font-bold">4.</span>
              <div>
                <strong className="text-fg">E-E-A-T Trust Anchors:</strong> Verifiable founder credentials, case studies, and exact client outcomes increase citation authority.
              </div>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-bg-panel p-6">
          <h4 className="text-sm font-bold text-fg mb-4 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-signal-fail/20 text-signal-fail text-xs">!</span>
            Common AI Search Blindspots
          </h4>
          <ul className="space-y-3 text-xs">
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 text-signal-fail font-bold">✕</span>
              <div>
                <strong className="text-fg">Client-only JavaScript Rendering:</strong> Content rendered entirely via client hydration without SSR may be skipped by lightweight AI search scrapers.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 text-signal-fail font-bold">✕</span>
              <div>
                <strong className="text-fg">Missing OpenGraph &amp; Twitter Cards:</strong> Missing meta tags reduce snippet rich rendering in AI conversational previews.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 text-signal-fail font-bold">✕</span>
              <div>
                <strong className="text-fg">Vague Taglines:</strong> &ldquo;The all-in-one platform for tomorrow&rdquo; leaves LLMs unable to classify your exact software category.
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Embedded Ask AI component */}
      <AskAiCitability pageUrl={activeUrl} />

      {/* Modals */}
      {showJsonLdModal && (
        <JsonLdGeneratorModal
          isOpen={true}
          onClose={() => setShowJsonLdModal(false)}
          pageUrl={activeUrl}
          pageTitle={activeUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
        />
      )}

      {showAgentModal && (
        <AiAgentFixPromptModal
          isOpen={true}
          onClose={() => setShowAgentModal(false)}
          auditId={activeAudit?.id || 'sample'}
          pageUrl={activeUrl}
        />
      )}
    </div>
  )
}
