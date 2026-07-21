'use client'

import { useEffect } from 'react'

/**
 * WebMCP — exposes Nebula Components site tools to AI agents via the browser.
 * Spec: https://webmachinelearning.github.io/webmcp/
 * Chrome blog: https://developer.chrome.com/blog/webmcp-epp
 *
 * Tools registered:
 *   - request_audit      Request a free landing page audit
 *   - get_pricing        Return current pricing and offer details
 *   - search_learning    Search the Learning Centre
 */
export default function WebMCP() {
  useEffect(() => {
    const nav = navigator as Navigator & {
      modelContext?: {
        registerTool: (tool: {
          name: string
          description: string
          inputSchema: object
          execute: (input: unknown) => unknown
        }) => { unregister: () => void }
      }
    }

    if (!nav.modelContext?.registerTool) return

    const controller = new AbortController()
    const handles: Array<{ unregister: () => void }> = []

    handles.push(
      nav.modelContext.registerTool({
        name: 'request_audit',
        description:
          'Request a free landing page conversion audit from Nebula Components. ' +
          'Provide the landing page URL. Returns audit submission confirmation.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The landing page URL to audit (must be publicly accessible)',
            },
            email: {
              type: 'string',
              description: 'Email address to receive the audit report (optional)',
            },
          },
          required: ['url'],
        },
        execute: (input: unknown) => {
          const { url, email } = input as { url: string; email?: string }
          const params = new URLSearchParams({ url })
          if (email) params.set('email', email)
          window.location.href = `/audit?${params}`
          return { status: 'redirecting', url: `/audit?${params}` }
        },
      })
    )

    handles.push(
      nav.modelContext.registerTool({
        name: 'get_pricing',
        description:
          'Return current Nebula Components service pricing, offer details, and what is included.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        execute: () => ({
          offers: [
            {
              name: 'Free Audit',
              price: '$0',
              description: 'Automated landing page diagnosis — message match, trust signals, mobile, speed, CTA, form friction, compliance.',
              url: 'https://nebulacomponents.shop/audit',
            },
            {
              name: 'Conversion Fix Pack',
              price: '$97',
              description: 'Full audit + implementation of all identified fixes. Delivered in 24–48 hours. One-time payment, no retainer.',
              url: 'https://nebulacomponents.shop/pricing',
            },
            {
              name: 'Growth Launch',
              price: '$997',
              description: 'End-to-end landing page build and optimisation for founders launching with paid traffic.',
              url: 'https://nebulacomponents.shop/pricing',
            },
          ],
        }),
      })
    )

    handles.push(
      nav.modelContext.registerTool({
        name: 'search_learning',
        description:
          'Search the Nebula Components Learning Centre for articles on landing page conversion, CRO, and ad performance.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query — e.g. "message match", "trust signals", "mobile conversion"',
            },
          },
          required: ['query'],
        },
        execute: (input: unknown) => {
          const { query } = input as { query: string }
          const url = `/learning-centre?q=${encodeURIComponent(query)}`
          window.location.href = url
          return { status: 'redirecting', url }
        },
      })
    )

    controller.signal.addEventListener('abort', () => {
      handles.forEach((h) => h.unregister())
    })

    return () => controller.abort()
  }, [])

  return null
}
