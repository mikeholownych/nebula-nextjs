'use client'

import { useState } from 'react'
import { Card } from '@/components/ui'

export default function CitableGeneratorClient() {
  const [brandName, setBrandName] = useState('')
  const [domain, setDomain] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [primaryOffer, setPrimaryOffer] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [copiedType, setCopiedType] = useState<'llms' | 'schema' | null>(null)

  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim()
  const baseUrl = cleanDomain ? `https://${cleanDomain}` : 'https://example.com'

  const generatedLlmsTxt = `# ${brandName || 'Brand Name'}

> ${tagline || 'Single-sentence value proposition for your product.'}

## Overview
${description || 'Detailed summary of what your company offers, who it serves, and key capabilities.'}

## Target Audience
- ${targetAudience || 'B2B Founders, Growth Teams, Engineers'}

## Core Offerings & Services
- ${primaryOffer || 'Primary Product or Service offering'}

## Canonical Resources
- [Homepage](${baseUrl}/)
- [Pricing & Packages](${baseUrl}/pricing)
- [Documentation & AI Citation Guide](${baseUrl}/resources/citable)
- [LLM Text Summary](${baseUrl}/llms.txt)
`

  const generatedSchemaJson = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: brandName || 'Brand Name',
      url: baseUrl,
      description: description || 'Company description for AI search extraction.',
      knowsAbout: [primaryOffer, tagline, targetAudience].filter(Boolean),
      offers: {
        '@type': 'Offer',
        name: primaryOffer || 'Main Offering',
        url: `${baseUrl}/pricing`,
      },
    },
    null,
    2
  )

  const copyToClipboard = (text: string, type: 'llms' | 'schema') => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2500)
  }

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Form */}
        <Card variant="bordered" className="space-y-6">
          <h2 className="text-xl font-bold text-fg">1. Enter Brand & Product Details</h2>
          
          <div>
            <label className="block text-xs font-mono uppercase text-fg-muted">Brand / Company Name</label>
            <input
              type="text"
              placeholder="e.g. Nebula Components"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-bg p-3 text-sm text-fg placeholder:text-fg-muted/50 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-fg-muted">Primary Domain</label>
            <input
              type="text"
              placeholder="e.g. nebulacomponents.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-bg p-3 text-sm text-fg placeholder:text-fg-muted/50 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-fg-muted">One-Sentence Tagline / Positioning</label>
            <input
              type="text"
              placeholder="e.g. Automated 7-signal landing page audit & code repair sprint"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-bg p-3 text-sm text-fg placeholder:text-fg-muted/50 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-fg-muted">Target Audience / ICP</label>
            <input
              type="text"
              placeholder="e.g. B2B SaaS Founders, Growth Marketers, Developers"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-bg p-3 text-sm text-fg placeholder:text-fg-muted/50 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-fg-muted">Primary Offering / Service</label>
            <input
              type="text"
              placeholder="e.g. One-Leak Repair Sprint ($97 one-time code diff delivery)"
              value={primaryOffer}
              onChange={(e) => setPrimaryOffer(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-bg p-3 text-sm text-fg placeholder:text-fg-muted/50 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-fg-muted">Comprehensive Summary</label>
            <textarea
              rows={4}
              placeholder="e.g. Nebula provides instant evidence-based conversion audits and tailored Next.js code diffs to eliminate paid traffic leaks."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-bg p-3 text-sm text-fg placeholder:text-fg-muted/50 focus:border-accent focus:outline-none"
            />
          </div>
        </Card>

        {/* Output Preview */}
        <div className="space-y-8">
          {/* llms.txt Box */}
          <Card variant="bordered" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-fg">Generated llms.txt</h3>
                <p className="text-xs text-fg-muted">Deploy to your domain root (e.g. /llms.txt)</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(generatedLlmsTxt, 'llms')}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-accent"
                >
                  {copiedType === 'llms' ? '✓ Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => downloadFile(generatedLlmsTxt, 'llms.txt')}
                  className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-colors hover:bg-accent-light"
                >
                  Download
                </button>
              </div>
            </div>
            <pre className="max-h-60 overflow-y-auto rounded-lg bg-bg p-4 font-mono text-xs text-fg-muted">
              {generatedLlmsTxt}
            </pre>
          </Card>

          {/* JSON-LD Schema Box */}
          <Card variant="bordered" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-fg">Generated JSON-LD Schema</h3>
                <p className="text-xs text-fg-muted">Paste inside your HTML &lt;head&gt; script tag</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(generatedSchemaJson, 'schema')}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-accent"
                >
                  {copiedType === 'schema' ? '✓ Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => downloadFile(generatedSchemaJson, 'schema.jsonld')}
                  className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-colors hover:bg-accent-light"
                >
                  Download
                </button>
              </div>
            </div>
            <pre className="max-h-60 overflow-y-auto rounded-lg bg-bg p-4 font-mono text-xs text-fg-muted">
              {generatedSchemaJson}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  )
}
