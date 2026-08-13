import type { Metadata } from 'next'
import { PageShell } from '@/components/ui'
import CitableGeneratorClient from './CitableGeneratorClient'

export const metadata: Metadata = {
  title: 'Free llms.txt & Schema Generator | Citable AI Optimization | Nebula',
  description:
    'Generate production-ready llms.txt markdown and JSON-LD Organization schema to optimize your website for ChatGPT, Claude, Perplexity, and Gemini search engines.',
  alternates: {
    canonical: 'https://nebulacomponents.com/resources/citable/generator',
  },
}

export default function CitableGeneratorPage() {
  return (
    <PageShell
      title="Free llms.txt & Schema Generator"
      description="Build production-ready llms.txt and JSON-LD schema payloads to optimize your brand for AI search citation extractability."
    >
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 max-w-3xl">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-accent">
            Generative Engine Optimization (GEO / AEO)
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-fg md:text-4xl">
            Make your brand AI-extractable in 60 seconds
          </h1>
          <p className="mt-4 text-base leading-7 text-fg-muted">
            Large Language Models (ChatGPT, Claude, Perplexity) crawl structured metadata to discover, cite, and recommend software products. Fill out the fields below to generate copy-paste ready <code className="text-accent">llms.txt</code> markdown and <code className="text-accent">JSON-LD</code> schema.
          </p>
        </div>

        <CitableGeneratorClient />
      </div>
    </PageShell>
  )
}
