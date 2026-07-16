import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/ui'

interface CaseStudyData {
  name: string
  description: string
  score: number
  datePublished: string
  issues: { category: string; severity: string; description: string }[]
  fixes: { category: string; description: string }[]
}

// Database of case studies (would come from CMS/database in production)
const caseStudies: Record<string, CaseStudyData> = {
  'ecommerce-example-com': {
    name: 'Ecommerce Landing Page Conversion Audit',
    description: 'A real Ecommerce landing page scored 0/10 on conversion audit.',
    score: 0,
    datePublished: '2026-07-05',
    issues: [
      { category: 'Headline', severity: 'critical', description: 'No clear value proposition' },
      { category: 'CTA', severity: 'critical', description: 'No visible call to action above fold' },
      { category: 'Trust', severity: 'high', description: 'Zero social proof elements' },
    ],
    fixes: [
      { category: 'Headline', description: 'Added pain-focused headline addressing target audience' },
      { category: 'CTA', description: 'Implemented high-contrast CTA button above fold' },
      { category: 'Trust', description: 'Added testimonials and trust badges' },
    ],
  },
  // Add more case studies here...
}

export async function generateStaticParams() {
  return Object.keys(caseStudies).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const study = caseStudies[slug]
  
  if (!study) return { title: 'Case Study Not Found' }
  
  return {
    title: `${study.name} | Nebula Case Study`,
    description: study.description,
    openGraph: {
      title: study.name,
      description: study.description,
      type: 'article',
      publishedTime: study.datePublished,
    },
  }
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const study = caseStudies[slug]
  
  if (!study) notFound()
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CaseStudy',
    name: study.name,
    description: study.description,
    datePublished: study.datePublished,
    author: {
      '@type': 'Organization',
      name: 'Nebula Components',
      url: 'https://nebulacomponents.shop',
    },
    result: {
      '@type': 'QuantitativeValue',
      name: 'Conversion Audit Score',
      value: study.score,
      maxValue: 10,
      unitText: '/10',
    },
  }
  
  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-8">
          <span className="text-sm text-accent font-medium">{study.datePublished}</span>
          <h1 className="mt-2 text-4xl font-bold text-fg">{study.name}</h1>
          <p className="mt-4 text-lg text-fg-muted">{study.description}</p>
        </div>
        
        {/* Score */}
        <div className="mb-12 p-8 bg-bg-panel rounded-2xl border border-border">
          <div className="text-center">
            <p className="text-sm text-fg-muted mb-2">Conversion Audit Score</p>
            <p className={`text-6xl font-bold ${study.score < 5 ? 'text-danger' : 'text-accent'}`}>
              {study.score}/10
            </p>
          </div>
        </div>
        
        {/* Issues Found */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-fg mb-6">Issues Found</h2>
          <div className="space-y-4">
            {study.issues.map((issue, index) => (
              <div key={index} className="p-4 bg-bg-panel rounded-xl border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    issue.severity === 'critical' ? 'bg-danger/20 text-danger' :
                    issue.severity === 'high' ? 'bg-warning/20 text-warning' :
                    'bg-fg-muted/20 text-fg-muted'
                  }`}>
                    {issue.severity}
                  </span>
                  <span className="font-medium text-fg">{issue.category}</span>
                </div>
                <p className="text-fg-muted">{issue.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Fixes Applied */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-fg mb-6">Fixes Applied</h2>
          <div className="space-y-4">
            {study.fixes.map((fix, index) => (
              <div key={index} className="p-4 bg-accent/5 rounded-xl border border-accent/20">
                <span className="font-medium text-accent">{fix.category}</span>
                <p className="text-fg-muted mt-1">{fix.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* CTA */}
        <div className="text-center">
          <a
            href="/audit"
            className="inline-block px-8 py-4 bg-accent text-bg font-semibold rounded-xl hover:bg-accent-light transition-colors"
          >
            Get Your Free Audit →
          </a>
        </div>
      </div>
    </PageShell>
  )
}
