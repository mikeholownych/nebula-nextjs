'use client'

import { useState } from 'react'
import type { AuditResult, Finding } from '@/app/audit/[id]/results/auditResultSchema'
import posthog from '@/app/lib/posthog-browser'

interface AiAgentFixPromptModalProps {
  results: AuditResult
  className?: string
}

export default function AiAgentFixPromptModal({ results, className = '' }: AiAgentFixPromptModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [agentType, setAgentType] = useState<'cursor' | 'claude' | 'generic'>('cursor')

  const buildPrompt = () => {
    const findingsList = results.findings
      .map((f, i) => {
        const selector = f.evidence?.selector && f.evidence.selector !== 'N/A'
          ? `\`${f.evidence.selector}\``
          : 'Hero section / Main CTA'
        const evidenceStr = f.evidence?.measured
          ? `\n   - **Measured Evidence:** ${f.evidence.measured} (Required: ${f.evidence.required || 'Standard'})`
          : ''

        return `${i + 1}. **[${f.label}]** (Priority: ${f.impact}/10 | Effort: ${f.effort}/10)
   - **Target DOM Selector:** ${selector}
   - **Issue:** ${f.issue}${evidenceStr}
   - **Fix Requirement:** ${f.fix}`
      })
      .join('\n\n')

    if (agentType === 'cursor') {
      return `/* 
 * CONVERSION LEAK REMEDIATION TASK (Cursor / AI Agent)
 * Target URL: ${results.url}
 * Audit Score: ${results.score}/100
 * Detected Leaks: ${results.findings.length}
 */

You are an expert Frontend CRO Engineer. Please refactor our landing page components to fix the following conversion leaks:

${findingsList}

Implementation instructions:
1. Locate the component corresponding to each target selector.
2. Apply the required copy, layout, or viewport adjustments.
3. Ensure all changes maintain mobile responsiveness (375px viewport) and keep primary CTAs and trust proof visible above the fold.
4. Keep all existing analytics tags intact.`
    }

    if (agentType === 'claude') {
      return `# Landing Page Conversion Fix Task for Claude Code

Target URL: ${results.url}
Audit Score: ${results.score}/100

Please review the codebase and implement fixes for the following ${results.findings.length} conversion issues:

${findingsList}

Please review the matching template files, update the markup according to the fix requirements, and run test suites to ensure no layout or mobile viewport regressions.`
    }

    return `Please fix the following landing page conversion issues on ${results.url}:

${findingsList}

Instructions: Implement the exact fixes specified above and verify that the page renders properly on mobile viewports.`
  }

  const promptText = buildPrompt()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      posthog.capture('ai_fix_prompt_copied', { agentType, url: results.url })
    } catch {
      // fallback
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-2 text-xs font-bold text-accent hover:bg-accent hover:text-bg transition-colors ${className}`}
      >
        <span>⚡</span>
        <span>AI Fix Prompt (Cursor / Claude)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-bg-panel p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Developer &amp; Agent Prompt Export
                </p>
                <h3 className="text-lg font-bold text-fg">
                  AI Fix Prompt for Coding Agents
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-fg-muted hover:bg-bg hover:text-fg transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-fg-muted mb-4">
              Export all {results.findings.length} detected conversion leaks formatted as an actionable prompt for Cursor, Claude Code, Antigravity, or ChatGPT.
            </p>

            <div className="flex items-center gap-2 mb-3">
              {(['cursor', 'claude', 'generic'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAgentType(t)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                    agentType === t
                      ? 'bg-accent text-bg'
                      : 'border border-border bg-bg text-fg-muted hover:text-fg'
                  }`}
                >
                  {t === 'cursor' ? 'Cursor / Copilot' : t === 'claude' ? 'Claude Code' : 'Generic Prompt'}
                </button>
              ))}
            </div>

            <pre className="max-h-80 overflow-y-auto rounded-xl border border-border bg-bg p-4 font-mono text-xs leading-relaxed text-fg-muted whitespace-pre-wrap">
              {promptText}
            </pre>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-fg-muted hover:text-fg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-xs font-bold text-bg hover:opacity-85 transition-opacity"
              >
                {copied ? '✓ Copied to Clipboard' : '⎘ Copy Prompt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
