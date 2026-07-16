import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Concepts — Nebula Components',
  description: 'Proprietary concepts and methodologies developed by Nebula Components for landing page conversion optimization.',
  openGraph: {
    title: 'Concepts — Nebula Components',
    description: 'Proprietary concepts: Trigger-aware prospecting, Message-match audit, 7-Point Diagnosis.',
    url: 'https://nebulacomponents.shop/concepts',
  },
  alternates: {
    canonical: 'https://nebulacomponents.shop/concepts',
  },
}

const concepts = [
  {
    id: 'trigger-aware-prospecting',
    name: 'Trigger-Aware Prospecting',
    definition: 'Lead generation method that identifies prospects based on buying triggers (actions indicating purchase intent) rather than demographic filters.',
    keyPrinciple: 'A prospect actively searching for a solution is more valuable than a prospect matching a demographic profile.',
    example: 'Founder searching "Google ads clicks no sales" (trigger) vs "Founder with SaaS company" (demographic).',
    source: 'https://nebulacomponents.shop/learning-centre',
  },
  {
    id: 'message-match-audit',
    name: 'Message-Match Audit',
    definition: 'Diagnostic process that verifies whether landing page headline matches the ad promise that drove the visitor.',
    keyPrinciple: 'When ad promise ≠ landing page headline, conversion drops 40-60%.',
    example: 'Ad: "Get more leads" → Landing Page: "CRM for Sales Teams" (mismatch). Should be: "Get more leads for your sales team."',
    source: 'https://nebulacomponents.shop/learning-centre/message-match-checklist',
  },
  {
    id: 'seven-point-diagnosis',
    name: '7-Point Landing Page Diagnosis',
    definition: "Nebula's proprietary audit framework identifying the 7 most common landing page conversion killers.",
    keyPrinciple: '90% of landing page problems fall into 7 categories: message match, CTA clarity, proof placement, mobile experience, load speed, form friction, and trust signals.',
    example: 'Audit score of 6.2/10 indicates specific failures in message match (3/10) and CTA clarity (5/10).',
    points: [
      'Message Match (Ad → Landing Page alignment)',
      'CTA Clarity (What action, why now)',
      'Proof Placement (Testimonials near decision points)',
      'Mobile Experience (Responsive, touch-friendly)',
      'Load Speed (<3s on 4G)',
      'Form Friction (Minimize fields)',
      'Trust Signals (Guarantees, security badges)',
    ],
    source: 'https://nebulacomponents.shop/audit',
  },
]

export default function ConceptsPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white" id="main-content" role="main">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 id="hero-title" className="text-4xl font-bold mb-4">
          Proprietary Concepts
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Methodologies developed by Nebula Components for landing page conversion optimization.
        </p>
        
        <section className="space-y-8">
          {concepts.map((concept) => (
            <article
              key={concept.id}
              id={concept.id}
              className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6"
            >
              <h2 className="text-2xl font-bold text-emerald-400 mb-2">
                {concept.name}
              </h2>
              
              <div className="space-y-4 text-gray-300">
                <div>
                  <strong className="text-white">Definition:</strong>
                  <p className="mt-1">{concept.definition}</p>
                </div>
                
                <div>
                  <strong className="text-white">Key Principle:</strong>
                  <p className="mt-1">{concept.keyPrinciple}</p>
                </div>
                
                <div>
                  <strong className="text-white">Example:</strong>
                  <p className="mt-1">{concept.example}</p>
                </div>
                
                {'points' in concept && concept.points && (
                  <div>
                    <strong className="text-white">The 7 Points:</strong>
                    <ol className="mt-2 list-decimal list-inside space-y-1">
                      {concept.points.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ol>
                  </div>
                )}
                
                <div className="text-sm text-gray-500">
                  <strong>Source:</strong>{' '}
                  <a href={concept.source} className="text-emerald-400 hover:underline">
                    {concept.source}
                  </a>
                </div>
              </div>
              
              {/* DefinedTerm Schema */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'DefinedTerm',
                    '@id': `https://nebulacomponents.shop/concepts#${concept.id}`,
                    name: concept.name,
                    description: concept.definition,
                    inDefinedTermSet: {
                      '@type': 'DefinedTermSet',
                      name: 'Nebula Components Methodology',
                    },
                  }),
                }}
              />
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
