// Minimal global structured data. Keep schema current — price and availability must match live state.
// unverified, or route-specific products and claims.

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://nebulacomponents.shop/#organization',
  name: 'Nebula Components',
  url: 'https://nebulacomponents.shop',
  logo: 'https://nebulacomponents.shop/logo-dark.png',
  description: 'Evidence-backed landing-page conversion guidance and implementation services.',
  foundingDate: '2024',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'hello@nebulacomponents.shop',
    availableLanguage: 'English',
  },
  sameAs: [
    'https://www.linkedin.com/company/nebula-components',
    'https://github.com/mikeholownych',
  ],
  founder: {
    '@type': 'Person',
    '@id': 'https://nebulacomponents.shop/#founder',
    name: 'Mike Holownych',
    jobTitle: 'Founder',
    url: 'https://nebulacomponents.shop/about/team',
    sameAs: [
      'https://www.linkedin.com/in/mikeholownych',
      'https://github.com/mikeholownych',
    ],
    worksFor: { '@id': 'https://nebulacomponents.shop/#organization' },
  },
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://nebulacomponents.shop/#website',
  url: 'https://nebulacomponents.shop',
  name: 'Nebula Components',
  description: 'Evidence-backed landing-page conversion guidance from Nebula Components.',
  publisher: {
    '@id': 'https://nebulacomponents.shop/#organization',
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
    // organizationSchema — every article previously inlined a separate
    // "Mike H" Person object here, fragmenting the entity across ~40
    // pages instead of letting Search/AI crawlers merge them into one.
    author: { '@id': 'https://nebulacomponents.shop/#founder' },
    datePublished: article.publishedDate,
    dateModified: article.modifiedDate || article.publishedDate,
    publisher: {
      '@id': 'https://nebulacomponents.shop/#organization',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    // Falls back to the site's real, live-rendered OG image (same asset
    // already used for social share cards) rather than omitting `image`
    // entirely — no per-article photography exists yet, and Article rich
    // results require this property to be eligible at all.
    image: article.image || 'https://nebulacomponents.shop/opengraph-image',
  }
}

export const auditWebApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': 'https://nebulacomponents.shop/audit#app',
  name: 'Nebula Landing Page Audit',
  url: 'https://nebulacomponents.shop/audit',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any (browser-based)',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  provider: { '@id': 'https://nebulacomponents.shop/#organization' },
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
