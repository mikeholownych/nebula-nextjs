'use client'

import { useState } from 'react'
import type { AuditResult } from '@/app/audit/[id]/results/auditResultSchema'
import posthog from '@/app/lib/posthog-browser'

interface AiAgentFixPromptModalProps {
  results?: AuditResult
  auditId?: string
  pageUrl?: string
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export default function AiAgentFixPromptModal({
  results,
  auditId,
  pageUrl,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  className = '',
}: AiAgentFixPromptModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [agentType, setAgentType] = useState<'api_direct' | 'cursor' | 'claude' | 'generic'>('api_direct')

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const handleClose = () => {
    if (controlledOnClose) controlledOnClose()
    else setInternalIsOpen(false)
  }

  const effectiveAuditId = results?.audit_id || auditId || 'audit_latest'
  const effectiveUrl = results?.url || pageUrl || 'https://example.com'
  const findings = results?.findings || []

  const buildPrompt = () => {
    if (agentType === 'api_direct') {
      return `# ⚡ Direct Agent API Integration (Autonomous Agents)
# Use your registered Workspace API Key to let agents fetch live, machine-readable fix directives.

# 1. Set your API Key in your environment or agent config:
export NEBULA_API_KEY="nbk_your_api_key_here"

# 2. Fetch structured JSON directives directly in agent tool calls:
curl -s -H "Authorization: Bearer $NEBULA_API_KEY" \\
  "https://nebulacomponents.com/api/v1/fixes/${effectiveAuditId}"

# 3. Or fetch as clean Markdown for immediate agent reasoning context:
curl -s -H "Authorization: Bearer $NEBULA_API_KEY" -H "Accept: text/markdown" \\
  "https://nebulacomponents.com/api/v1/fixes/${effectiveAuditId}"

# 4. Autonomous Agent CLI Command (Claude Code / Antigravity / Hermes):
claude "Read conversion leak instructions from https://nebulacomponents.com/api/v1/fixes/${effectiveAuditId} using Authorization: Bearer $NEBULA_API_KEY and apply all required CSS and component markup changes."`
    }

    const findingsList = findings.length > 0
      ? findings
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
      : `1. **[Primary CTA Contrast Below Standard]** (Priority: 9/10 | Effort: 2/10)
   - **Target DOM Selector:** \`.hero-cta-button, a[href*='/audit']\`
   - **Issue:** Primary CTA lacks sufficient 4.5:1 contrast against dark background.
   - **Fix Requirement:** Use brand neon accent #c7ff2f with dark text #09090b.`

    if (agentType === 'cursor') {
      return `/* 
 * CONVERSION LEAK REMEDIATION TASK (Cursor / AI Agent)
 * Target URL: ${effectiveUrl}
 * Audit ID: ${effectiveAuditId}
 */

You are an expert Frontend CRO Engineer. Please refactor our landing page components to fix the following conversion leaks:

${findingsList}

Implementation instructions:
1. Locate the component corresponding to each target selector.
2. Apply the required copy, layout, or viewport adjustments.
3. Ensure all changes maintain mobile responsiveness (375px viewport) and keep primary CTAs visible above the fold.
4. Keep all existing analytics tags intact.`
    }

    if (agentType === 'claude') {
      return `# Landing Page Conversion Fix Task for Claude Code

Target URL: ${effectiveUrl}
Audit ID: ${effectiveAuditId}

Please review the codebase and implement fixes for the following conversion leaks:

${findingsList}

Instructions:
1. Review matching template files in the repository.
2. Update markup and CSS according to the exact fix requirements.
3. Run test suites to ensure no layout or mobile viewport regressions.`
    }

    return `Please fix the following landing page conversion issues on ${effectiveUrl}:

${findingsList}

Instructions: Implement the exact fixes specified above and verify that the page renders properly on mobile viewports.`
  }

  const promptText = buildPrompt()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      posthog.capture('ai_fix_prompt_copied', { agentType, url: effectiveUrl, auditId: effectiveAuditId })
    } catch {
      // fallback
    }
  }

  return (
    <>
      {controlledIsOpen === undefined && (
        <button
          onClick={() => setInternalIsOpen(true)}
          className={`inline-flex min-w-0 max-w-full w-full sm:w-auto items-center gap-2 whitespace-normal break-words rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-2 text-left text-xs font-bold text-accent hover:bg-accent hover:text-bg transition-colors ${className}`}
        >
          <span>⚡</span>
          <span className="min-w-0 break-words">AI Agent Fix API / Prompt</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-bg-panel p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Developer &amp; Agent API Protocol
                </p>
                <h3 className="text-lg font-bold text-fg">
                  AI Agent Fix Directives &amp; API Key
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 text-fg-muted hover:bg-bg hover:text-fg transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-fg-muted mb-4">
              Provide AI agents (Claude Code, Cursor, Antigravity, Aider) with direct, machine-readable instructions to fix your landing page conversion leaks using your workspace API key.
            </p>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              {(
                [
                  { id: 'api_direct', label: '⚡ Agent API (API Key)' },
                  { id: 'cursor', label: 'Cursor Rules' },
                  { id: 'claude', label: 'Claude Code' },
                  { id: 'generic', label: 'Prompt Copy' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setAgentType(t.id)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                    agentType === t.id
                      ? 'bg-accent text-bg'
                      : 'border border-border bg-bg text-fg-muted hover:text-fg'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <pre className="max-h-80 overflow-y-auto rounded-xl border border-border bg-bg p-4 font-mono text-xs leading-relaxed text-fg-muted whitespace-pre-wrap">
              {promptText}
            </pre>

            <div className="mt-4 flex items-center justify-between gap-3">
              <a
                href="https://app.nebulacomponents.com/settings"
                className="text-xs text-accent hover:underline font-medium"
              >
                Manage API Keys in Settings →
              </a>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClose}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-fg-muted hover:text-fg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-xs font-bold text-bg hover:opacity-85 transition-opacity"
                >
                  {copied ? '✓ Copied Instructions' : '⎘ Copy Command / Prompt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
