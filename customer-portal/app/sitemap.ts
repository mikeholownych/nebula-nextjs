import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://nebulacomponents.shop'
  
  // Core pages
  const corePages = [
    '',
    '/pricing',
    '/audit',
    '/privacy-policy',
    '/data-rights',
    '/learning-centre',
    '/case-studies',
    '/resources',
    '/resources/citable',
  ]
 
  // Learning centre articles (22 articles)
  const learningArticles = [
    'b2b-saas-landing-page-not-converting',
    'before-you-raise-ad-budget',
    'cta-not-working',
    'ecommerce-landing-page-not-converting',
    'facebook-ads-no-leads',
    'founder-second-brain',
    'google-ads-clicks-no-sales',
    'google-ads-disapproved-ads-still-spending',
    'google-ads-quality-score-low',
    'high-cpc-low-conversion',
    'landing-page-bounce-rate-high',
    'landing-page-load-time-slow',
    'landing-page-not-converting',
    'linkedin-skill-engine',
    'message-match-checklist',
    'meta-ads-high-frequency-not-converting',
    'mobile-landing-page-leaks',
    'no-testimonials-on-landing-page',
    'pricing-page-not-converting',
    'proof-before-cta',
    'retargeting-ads-not-converting',
    'specialist-ai-agent-library',
    'traffic-but-no-form-fills',
  ]
 
  const sitemapEntries: MetadataRoute.Sitemap = []
 
  // Add core pages (high priority, weekly update)
  corePages.forEach(path => {
    sitemapEntries.push({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: path === '' ? 1 : 0.9,
    })
  })
 
  // Add learning-centre articles (medium priority, monthly update)
  learningArticles.forEach(slug => {
    sitemapEntries.push({
      url: `${baseUrl}/learning-centre/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  })

  // Case study slugs — none yet. Previously listed 4 fabricated case
  // studies here; removed 2026-07-24 along with the fabricated content
  // itself (see app/case-studies/[slug]/page.tsx). Add a slug here only
  // once a real, evidenced case study exists at that route.
  const caseStudySlugs: string[] = []

  caseStudySlugs.forEach(slug => {
    sitemapEntries.push({
      url: `${baseUrl}/case-studies/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.8,
    })
  })

  // paid-traffic-leak-map learning article (new)
  sitemapEntries.push({
    url: `${baseUrl}/learning-centre/paid-traffic-leak-map`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  })

  return sitemapEntries
}
