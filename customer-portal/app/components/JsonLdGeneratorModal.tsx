'use client'

import { useState } from 'react'

type SchemaType = 'FAQPage' | 'SoftwareApplication' | 'Organization' | 'Product' | 'HowTo'

interface JsonLdGeneratorModalProps {
  initialType?: SchemaType
  pageTitle?: string
  pageUrl?: string
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export default function JsonLdGeneratorModal({
  initialType = 'FAQPage',
  pageTitle = 'My Landing Page',
  pageUrl = 'https://example.com',
  className = '',
}: JsonLdGeneratorModalProps) {
  const [schemaType, setSchemaType] = useState<SchemaType>(initialType)
  const [copied, setCopied] = useState(false)

  // Dynamic state for FAQ builder
  const [faqs, setFaqs] = useState([
    { q: 'What is this service?', a: 'We provide evidence-based conversion optimization for landing pages.' },
    { q: 'How long does it take?', a: 'Results are delivered within 48 hours.' },
  ])

  // Dynamic state for SoftwareApp
  const [appName, setAppName] = useState(pageTitle)
  const [appPrice, setAppPrice] = useState('0')

  const generateJsonLd = () => {
    switch (schemaType) {
      case 'FAQPage':
        return {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: f.a,
            },
          })),
        }
      case 'SoftwareApplication':
        return {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: appName,
          url: pageUrl,
          applicationCategory: 'BusinessApplication',
          applicationSubCategory: 'Conversion Rate Optimization & Landing Page Audit',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: appPrice,
            priceCurrency: 'USD',
          },
        }
      case 'Organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: appName,
          url: pageUrl,
          logo: `${pageUrl}/logo.png`,
          sameAs: [`https://twitter.com/${appName.toLowerCase().replace(/\s+/g, '')}`],
        }
      case 'HowTo':
        return {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: `How to optimize your landing page with ${appName}`,
          step: [
            {
              '@type': 'HowToStep',
              position: 1,
              name: 'Audit the page',
              text: 'Scan the public HTML against observable conversion signals.',
            },
            {
              '@type': 'HowToStep',
              position: 2,
              name: 'Fix the highest-priority leak',
              text: 'Implement the targeted copy or code replacement.',
            },
          ],
        }
      case 'Product':
        return {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: appName,
          description: `High-converting solution for ${appName}`,
          offers: {
            '@type': 'Offer',
            price: appPrice,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
        }
    }
  }

  const jsonLdString = JSON.stringify(generateJsonLd(), null, 2)
  const scriptTagString = `<script type="application/ld+json">\n${jsonLdString}\n</script>`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scriptTagString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className={`rounded-2xl border border-border bg-bg-panel p-6 sm:p-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-1">
            Schema.org JSON-LD Generator
          </p>
          <h3 className="text-xl font-bold text-fg">
            Instant AEO &amp; GEO Structured Data
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {(['FAQPage', 'SoftwareApplication', 'Organization', 'HowTo'] as SchemaType[]).map((t) => (
            <button
              key={t}
              onClick={() => setSchemaType(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                schemaType === t
                  ? 'bg-accent text-bg font-bold'
                  : 'border border-border bg-bg text-fg-muted hover:text-fg'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={handleCopy}
            className="rounded-md border border-border bg-bg-elevated px-3 py-1.5 text-xs font-semibold text-fg hover:border-accent hover:text-accent transition-colors"
          >
            {copied ? '✓ Copied <script>' : '⎘ Copy Script Tag'}
          </button>
        </div>

        <pre className="max-h-72 overflow-y-auto rounded-xl border border-border bg-bg p-4 font-mono text-xs text-fg-muted leading-relaxed whitespace-pre-wrap">
          {scriptTagString}
        </pre>
      </div>

      <p className="mt-4 text-xs text-fg-muted">
        Paste this script tag directly into your HTML <code className="text-accent">&lt;head&gt;</code> to help ChatGPT, Perplexity, and Google AI Overviews cite your content with structured answers.
      </p>
    </div>
  )
}
