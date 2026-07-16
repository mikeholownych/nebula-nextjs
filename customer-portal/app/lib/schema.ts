// Organization and WebSite schema for Nebula Components
// These should be included in the root layout

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://nebulacomponents.shop/#organization',
  name: 'Nebula Components',
  url: 'https://nebulacomponents.shop',
  logo: 'https://nebulacomponents.shop/logo-dark.png',
  description: 'Landing page conversion optimization — free audit, $147 implementation, no retainer.',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    email: 'hello@nebulacomponents.shop',
  },
  sameAs: [
    'https://linkedin.com/company/nebula-components',
    'https://twitter.com/nebulacomponents',
  ],
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://nebulacomponents.shop/#website',
  url: 'https://nebulacomponents.shop',
  name: 'Nebula Components',
  description: 'Free landing page audit in 60 seconds. Find the leak, fix it for $147.',
  publisher: {
    '@id': 'https://nebulacomponents.shop/#organization',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://nebulacomponents.shop/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

// SpeakableSpecification for voice search / AEO
export const speakableSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://nebulacomponents.shop/#webpage',
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['h1', 'h2', '.pricing-hero', '.faq-item'],
  },
}

export const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Fix Pack',
  description: 'Landing page audit and implementation — specific diagnosis, $147 implementation, 24-hour turnaround.',
  brand: {
    '@id': 'https://nebulacomponents.shop/#organization',
  },
  offers: {
    '@type': 'Offer',
    price: '147',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    priceValidUntil: '2027-12-31',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '12',
  },
}

export const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Landing Page Audit',
  description: 'Comprehensive landing page conversion analysis — message match, CTA clarity, proof placement, mobile, speed.',
  provider: {
    '@id': 'https://nebulacomponents.shop/#organization',
  },
  areaServed: 'Worldwide',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Landing Page Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Free Landing Page Audit',
          description: '60-second audit with specific diagnosis',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Fix Pack',
          description: 'Full implementation for $147',
        },
        price: '147',
        priceCurrency: 'USD',
      },
    ],
  },
}

// Helper function to create breadcrumb schema
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

// Helper function to create article schema
export function createArticleSchema(article: {
  headline: string;
  description: string;
  url: string;
  publishedDate: string;
  modifiedDate?: string;
  authorName?: string;
  authorUrl?: string;
  image?: string;
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
  };
}

// Helper function to create FAQ schema
export function createFAQPageSchema(faqItems: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
