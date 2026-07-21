// Minimal global structured data. Public schema must not advertise paused,
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

export function createArticleSchema(article: {
  headline: string
  description: string
  url: string
  publishedDate: string
  modifiedDate?: string
  authorName?: string
  authorUrl?: string
  image?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.authorName || 'Mike H',
      url: article.authorUrl || 'https://nebulacomponents.shop/about/team',
    },
    datePublished: article.publishedDate,
    dateModified: article.modifiedDate || article.publishedDate,
    publisher: {
      '@id': 'https://nebulacomponents.shop/#organization',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    image: article.image,
  }
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
