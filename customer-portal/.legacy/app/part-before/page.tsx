import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Landing Page Audit — Score Your Site in 60 Seconds | Nebula',
  description: 'Paste your URL. Get a scored landing page audit in 60 seconds — clarity, CTA friction, trust gap, offer specificity. Free. No sales call. Fix leaks that kill conversions.',
  openGraph: {
    title: 'Free Landing Page Audit — Find Your Conversion Leaks | Nebula',
    description: 'Paste your URL. Get a scored landing page audit in 60 seconds — clarity, CTA, trust gap, offer specificity. Free. $147 Fix Pack turns it into implementation-ready copy.',
    url: 'https://nebulacomponents.shop/',
    type: 'website',
    siteName: 'Nebula Components',
    images: [
      {
        url: 'https://nebulacomponents.shop/og-card.png',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Landing Page Audit — Find Your Conversion Leaks | Nebula',
    description: 'Paste your URL. Scored teardown in 60 seconds. Clarity, CTA, trust, offer. Free. $147 Fix Pack for implementation.',
    images: ['https://nebulacomponents.shop/og-card.png'],
  },
  icons: {
    icon: '/og-card.png',
  },
};

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nebula Components',
  url: 'https://nebulacomponents.shop',
  description: 'Free landing page audit and conversion optimization. 60-second audit scores 5 dimensions. Self-serve $147 fix delivered in 24h.',
  slogan: 'Fix your landing page. No call. No calendar.',
  foundingDate: '2026',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'ops@launchcrate.io',
    contactType: 'customer support',
    availableLanguage: 'English',
  },
};

const jsonLdService = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Landing Page Conversion Audit',
  provider: { '@type': 'Organization', name: 'Nebula Components' },
  description: '60-second scored audit across 5 conversion dimensions: headline clarity, CTA friction, trust gap, offer specificity, and implementation difficulty. Free audit + $147 Fix Pack.',
  offers: [
    {
      '@type': 'Offer',
      name: 'Free Landing Page Audit',
      price: '0',
      priceCurrency: 'USD',
      description: 'Scored audit across 5 conversion dimensions. Delivered to your inbox in 60 seconds.',
    },
    {
      '@type': 'Offer',
      name: 'Conversion Fix Pack',
      price: '147',
      priceCurrency: 'USD',
      description: 'Audit results turned into implementation-ready copy: rewritten hero, CTA, trust proof, FAQ. Delivered within 72h.',
      url: 'https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b',
    },
    {
      '@type': 'Offer',
      name: 'AI Ops Retainer',
      price: '1497',
      priceCurrency: 'USD',
      description: 'Monthly monitoring, iteration, and AI governance. 3-month pilot. Renews monthly.',
      url: 'https://nebulacomponents.shop/ai-ops-retainer.html',
    },
    {
      '@type': 'Offer',
      name: 'Agency Partner Program',
      price: '497',
      priceCurrency: 'USD',
      description: 'White-label audit engine, compliance documentation pack, multi-model support. Monthly.',
      url: 'https://nebulacomponents.shop/agency-partner.html',
    },
  ],
};

const jsonLdFaq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why is the Fix Pack only $147?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The audit does the heavy lifting. No discovery calls, no account research. You give us the URL, we find the leaks, we write the fixes. No overhead, no meetings.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the guarantee?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "If you don't see a conversion leak worth fixing within 30 minutes of receiving your audit, email ops@launchcrate.io and say refund please. We return every cent, no reason needed, no questions asked.",
      },
    },
    {
      '@type': 'Question',
      name: 'Do you need access to my website?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Not for the free audit or Fix Kit. For the $147 Fix Pack, access is optional and only requested with your explicit authorization.',
      },
    },
  ],
};

export default function PartBeforePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdService) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Free Landing Page Audit
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Score Your Site in 60 Seconds
          </p>
          <div className="bg-[#111] border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 mb-4">
              Note: The source HTML file (part_before.html) contains only metadata and structured data — no visible body content was present to convert.
            </p>
            <p className="text-sm text-gray-500">
              Source: public/part_before.html (5965 bytes)
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
