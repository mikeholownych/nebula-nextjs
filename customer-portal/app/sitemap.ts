import { MetadataRoute } from 'next'
import { getPublishedCaseStudies } from '@/app/lib/public-facts'
import { getPublishedCitableRoutes } from '@/app/resources/citable/content'
import { getArticles } from './learning-centre/lib/getArticles'
import { TEARDOWNS } from './teardowns/[slug]/data'
import { COMPARISONS } from './vs/[slug]/data'
import { PRICING_GUIDE_SLUGS } from './pricing-guides/data'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://nebulacomponents.com'

// Build-time date used as lastModified for static pages that don't
// carry per-page timestamps. This is truthful, it reflects when the
// sitemap was generated, not when the content was last edited, and
// satisfies sitemap validators that require lastModified to be present.
const BUILD_DATE = new Date().toISOString().split('T')[0] // YYYY-MM-DD

// Priority reflects actual page importance, not a uniform default - legal/
// utility pages sit well below commercial and hub pages so the signal means
// something (Google ignores it for ranking, but other consumers don't, and a
// stale/flat value misrepresents the site to anyone who does read it).
const corePagesByPriority: Array<{ paths: readonly string[]; priority: number }> = [
  { paths: ['/pricing', '/audit'], priority: 0.9 },
  {
    paths: ['/spec/landing-page-diagnostic-v1'],
    priority: 0.9,
  },
  {
    paths: [
      '/signals',
      '/signals/message-match',
      '/signals/trust-signals',
      '/signals/mobile-cta',
      '/signals/load-speed',
      '/signals/cta-clarity',
      '/signals/above-fold-clarity',
      '/signals/ad-signal-continuity',
      '/signals/seo-foundations',
      '/signals/ai-readiness',
    ],
    priority: 0.8,
  },
  {
    paths: [
      '/learning-centre',
      '/resources',
      '/case-studies',
      '/why-is-my-landing-page-not-converting',
      '/ads-getting-clicks-but-no-sales',
      '/best-landing-page-audit-tools',
      '/landing-page-audit-tools-pricing',
      '/landing-page-message-match',
      '/landing-page-trust-signals',
      '/landing-page-cta-audit',
      '/mobile-landing-page-audit',
      '/saas-landing-page-audit',
      '/ecommerce-landing-page-audit',
      '/page-intent-aware-audit',
      '/ai-readiness-landing-page-check',
      '/why-cro-agencies-dont-work',
      '/lead-generation-landing-page-audit',
    ],
    priority: 0.8,
  },
  {
    paths: [
      '/7-systems',
      '/ai-sdr-vs-audit',
      '/compare',
      '/compare/unbounce',
      '/compare/instapage',
      '/compare/pagespeed-insights',
      '/compare/leadpages',
      '/concepts',
      '/cta-optimization',
      '/editorial-standards',
      '/headline-optimization',
      '/mobile-landing-page-optimization',
      '/page-speed-conversion',
      '/roas-cliff',
      '/social-proof-landing-page',
      '/what-is-landing-page-audit',
      // NOTE: /workspace is intentionally absent - it is email-gated (307 →
      // /login), robots.txt Disallows /workspace/, and gated paths must never
      // appear in the sitemap (wastes crawl budget, risks soft-404 signals).
      '/playbooks',
      '/benchmarks',
      '/brand',
      '/lab',
      '/press',
      '/faq',
      '/what-is-nebula-components',
      '/teardowns',
      '/vs',
    ],
    priority: 0.7,
  },
  { paths: ['/about', '/about/team'], priority: 0.5 },
  { paths: ['/privacy-policy', '/data-rights', '/terms'], priority: 0.2 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const homeEntry: MetadataRoute.Sitemap[number] = {
    url: BASE_URL,
    lastModified: BUILD_DATE,
    changeFrequency: 'weekly',
    priority: 1,
  }

  const coreEntries: MetadataRoute.Sitemap = corePagesByPriority.flatMap(({ paths, priority }) =>
    paths.map((path) => ({
      url: `${BASE_URL}${path}`,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly' as const,
      priority,
    }))
  )

  const articleEntries: MetadataRoute.Sitemap = getArticles()
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map(({ slug }) => ({
      url: `${BASE_URL}/learning-centre/${slug}`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

  // Relocated out of /learning-centre (2026-07-27) - founder-productivity/
  // AI-ops content, not part of getArticles()'s conversion-diagnosis scan.
  const playbookEntries: MetadataRoute.Sitemap = [
    'founder-second-brain',
    'linkedin-skill-engine',
    'specialist-ai-agent-library',
  ].map((slug) => ({
    url: `${BASE_URL}/playbooks/${slug}`,
    lastModified: BUILD_DATE,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const caseStudyEntries: MetadataRoute.Sitemap = getPublishedCaseStudies().map(({ slug }) => ({
    url: `${BASE_URL}/case-studies/${slug}`,
    lastModified: BUILD_DATE,
    changeFrequency: 'yearly',
    priority: 0.8,
  }))

  const citableEntries: MetadataRoute.Sitemap = getPublishedCitableRoutes({
    includeOverview: true,
  }).map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: BUILD_DATE,
    changeFrequency: 'monthly',
    priority: route.kind === 'overview' ? 0.8 : 0.7,
  }))

  const teardownEntries: MetadataRoute.Sitemap = Object.keys(TEARDOWNS).sort().map((slug) => ({
    url: `${BASE_URL}/teardowns/${slug}`,
    lastModified: BUILD_DATE,
    changeFrequency: 'yearly',
    priority: 0.7,
  }))

  const comparisonEntries: MetadataRoute.Sitemap = Object.keys(COMPARISONS).sort().map((slug) => ({
    url: `${BASE_URL}/vs/${slug}`,
    lastModified: BUILD_DATE,
    changeFrequency: 'yearly',
    priority: 0.6,
  }))

  const pricingGuideEntries: MetadataRoute.Sitemap = PRICING_GUIDE_SLUGS.map((slug) => ({
    url: `${BASE_URL}/pricing-guides/${slug}`,
    lastModified: BUILD_DATE,
    changeFrequency: 'yearly',
    priority: 0.6,
  }))

  // lastModified is intentionally omitted until each content object has a
  // truthful, durable publication/update timestamp. Build time is not freshness.
  return [homeEntry, ...coreEntries, ...articleEntries, ...playbookEntries, ...caseStudyEntries, ...citableEntries, ...teardownEntries, ...comparisonEntries, ...pricingGuideEntries]
}
