'use client'

import { useState } from 'react'

interface AskAiCitabilityProps {
  defaultQuery?: string
  pageUrl?: string
  className?: string
  compact?: boolean
}

export default function AskAiCitability({
  defaultQuery,
  pageUrl,
  className = '',
  compact = false,
}: AskAiCitabilityProps) {
  const [url, setUrl] = useState(pageUrl || '')

  const buildQuery = (aiName: string) => {
    if (defaultQuery) return defaultQuery
    const target = url ? `for ${url}` : 'for my landing page'
    return `Analyze the conversion leaks, ad message match, and AI search visibility (AEO/GEO) ${target}. What are the observable HTML conditions that cause paid traffic to bounce?`
  }

  const getChatGptUrl = () => {
    const q = encodeURIComponent(buildQuery('ChatGPT'))
    return `https://chat.openai.com/?q=${q}`
  }

  const getClaudeUrl = () => {
    const q = encodeURIComponent(buildQuery('Claude'))
    return `https://claude.ai/new?q=${q}`
  }

  const getPerplexityUrl = () => {
    const q = encodeURIComponent(buildQuery('Perplexity'))
    return `https://www.perplexity.ai/search/new?q=${q}`
  }

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <span className="text-xs font-medium text-fg-muted">Ask AI:</span>
        <a
          href={getChatGptUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-panel px-2.5 py-1 text-xs font-medium text-fg hover:border-accent hover:text-accent transition-colors"
        >
          <span>ChatGPT ↗</span>
        </a>
        <a
          href={getClaudeUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-panel px-2.5 py-1 text-xs font-medium text-fg hover:border-accent hover:text-accent transition-colors"
        >
          <span>Claude ↗</span>
        </a>
        <a
          href={getPerplexityUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-panel px-2.5 py-1 text-xs font-medium text-fg hover:border-accent hover:text-accent transition-colors"
        >
          <span>Perplexity ↗</span>
        </a>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border border-border bg-bg-panel p-6 sm:p-8 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
            AI Search Citability &amp; LLM Discovery
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-fg mb-2">
            See what AI assistants say about your conversion leaks
          </h3>
          <p className="text-sm text-fg-muted leading-relaxed">
            Test how ChatGPT, Claude, and Perplexity parse your category, evaluate conversion readiness, or cite your domain.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <a
            href={getChatGptUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-bg px-4 py-2.5 text-xs font-semibold text-fg hover:border-accent hover:text-accent transition-colors"
          >
            <span>Ask ChatGPT ↗</span>
          </a>
          <a
            href={getClaudeUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-bg px-4 py-2.5 text-xs font-semibold text-fg hover:border-accent hover:text-accent transition-colors"
          >
            <span>Ask Claude ↗</span>
          </a>
          <a
            href={getPerplexityUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-bold text-bg hover:opacity-85 transition-opacity"
          >
            <span>Ask Perplexity ↗</span>
          </a>
        </div>
      </div>
    </div>
  )
}
