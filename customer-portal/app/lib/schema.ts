// Minimal global structured data. Keep schema current - price and availability must match live state.
// unverified, or route-specific products and claims.

import { brand, brandAbsolute } from './brand'

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://nebulacomponents.com/#organization',
  name: brand.name,
  url: brand.url,
  logo: brandAbsolute(brand.assets.organizationLogo),
  description: 'Nebula Components provides AI-ready technical audits and GEO optimization services to help brands appear in AI search results from ChatGPT, Perplexity, Gemini, and Claude. We combine evidence-based landing-page conversion guidance with AI search visibility monitoring.',
  foundingDate: '2024',
  dateModified: new Date().toISOString().split('T')[0],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      // email intentionally omitted from schema - CF email obfuscation
      // rewrites email strings in JSON-LD <script> tags, injecting a
      // render-blocking script that adds ~150ms to FCP/LCP on mobile.
      // Contact email is available via the About page and privacy policy.
      availableLanguage: 'English',
    },
    {
      '@type': 'ContactPoint',
      contactType: 'technical support',
      availableLanguage: 'English',
    }
  ],
  location: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Toronto',
      addressRegion: 'ON',
      addressCountry: 'CA',
      postalCode: 'M5V 2T6',
    }
  },
  sameAs: [
    'https://www.linkedin.com/company/nebulacomponents',
    'https://github.com/Nebula-Components/nebula-components',
    'https://twitter.com/nebula_components',
    'https://www.facebook.com/nebula.components',
    'https://www.instagram.com/nebula.components/',
  ],
  founder: {
    '@type': 'Person',
    '@id': 'https://nebulacomponents.com/#founder',
    name: 'Mike Holownych',
    jobTitle: 'Founder',
    url: 'https://nebulacomponents.com/about/team',
    sameAs: [
      'https://www.linkedin.com/in/mikeholownych',
      'https://github.com/mikeholownych',
      'https://twitter.com/mikeholownych',
    ],
    worksFor: { '@id': 'https://nebulacomponents.com/#organization' },
    memberOf: {
      '@type': 'Organization',
      name: 'AI Syndicate',
      url: 'https://aisyndicate.io'
    }
  },
  memberOf: [
    {
      '@type': 'Organization',
      name: 'Canadian SEO Association',
      url: 'https://canadianseo.ca'
    },
    {
      '@type': 'Organization',
      name: 'GEO Optimization Consortium',
      url: 'https://geoconsortium.org'
    }
  ],
  funder: {
    '@type': 'Organization',
    name: 'AI Syndicate Fund',
    url: 'https://aisyndicate.io/fund'
  },
  brand: 'Nebula Components',
  slogan: 'Evidence, not projections',
  areaServed: [
    {
      '@type': 'Country',
      name: 'United States',
    },
    {
      '@type': 'Country',
      name: 'Canada',
    },
    {
      '@type': 'Country',
      name: 'United Kingdom',
    },
    {
      '@type': 'Country',
      name: 'Australia',
    },
  ],
  availableChannel: [
    {
      '@type': 'ServiceChannel',
      serviceUrl: 'https://nebulacomponents.com',
      serviceType: 'https://www.schema.org/WebSite'
    }
  ]
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://nebulacomponents.com/#website',
  url: 'https://nebulacomponents.com',
  name: 'Nebula Components',
  description: 'Evidence-backed landing-page conversion guidance from Nebula Components.',
  publisher: {
    '@id': 'https://nebulacomponents.com/#organization',
  },
}

export function createBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function createCollectionPageSchema(collection: {
  name: string
  description: string
  url: string
  items: Array<{ name: string; url: string }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.name,
    description: collection.description,
    url: collection.url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: collection.items.length,
      itemListElement: collection.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    },
  }
}

export function createArticleSchema(article: {
  headline: string
  description: string
  url: string
  publishedDate: string
  modifiedDate?: string
  image?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    // References the canonical founder Person node declared once in
    // organizationSchema - every article previously inlined a separate
    // "Mike H" Person object here, fragmenting the entity across ~40
    // pages instead of letting Search/AI crawlers merge them into one.
    author: { '@id': 'https://nebulacomponents.com/#founder' },
    datePublished: article.publishedDate,
    dateModified: article.modifiedDate || article.publishedDate,
    publisher: {
      '@id': 'https://nebulacomponents.com/#organization',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    // Falls back to the site's real, live-rendered OG image (same asset
    // already used for social share cards) rather than omitting `image`
    // entirely - no per-article photography exists yet, and Article rich
    // results require this property to be eligible at all.
    image: article.image || 'https://nebulacomponents.com/opengraph-image',
  }
}

export const auditWebApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': 'https://nebulacomponents.com/audit#app',
  name: 'Nebula Landing Page Audit',
  url: 'https://nebulacomponents.com/audit',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any (browser-based)',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  provider: { '@id': 'https://nebulacomponents.com/#organization' },
}

export function createFAQPageSchema(faqItems: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function createHowToSchema(params: {
  name: string
  description: string
  steps: Array<{
    name: string
    text: string
    position?: number
    url?: string
  }>
  totalTime?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: params.name,
    description: params.description,
    ...(params.totalTime && { totalTime: params.totalTime }),
    step: params.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: step.position ?? index + 1,
      name: step.name,
      text: step.text,
      ...(step.url && { url: step.url }),
    })),
  }
}
