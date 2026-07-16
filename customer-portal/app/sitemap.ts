import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://nebulacomponents.shop'
  
  // Core pages
  const corePages = [
    '',
    '/pricing',
    '/audit',
    '/audit-lander',
    '/privacy-policy',
    '/data-rights',
    '/learning-centre',
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
 
  // Note: Case studies (450+) are lower priority and may cause sitemap bloat
  // Consider adding only top 50 case studies or using a separate sitemap index
  // For now, we'll add a curated selection of case studies (first 20 as examples)
  const curatedCaseStudies = [
    'ecommerce-airbnb-com',
    'ecommerce-example-com',
    'ecommerce-shopify-com',
    'saas-play-google-com',
  ]
 
  curatedCaseStudies.forEach(slug => {
    sitemapEntries.push({
      url: `${baseUrl}/case-studies/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    })
  })
 
  return sitemapEntries
}
