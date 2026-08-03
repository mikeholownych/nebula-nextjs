import { MetadataRoute } from 'next'
import { getPublishedCaseStudies } from '@/app/lib/public-facts'
import { getPublishedCitableRoutes } from '@/app/resources/citable/content'
import { getArticles } from './learning-centre/lib/getArticles'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://nebulacomponents.com'

// Priority reflects actual page importance, not a uniform default — legal/
// utility pages sit well below commercial and hub pages so the signal means
// something (Google ignores it for ranking, but other consumers don't, and a
// stale/flat value misrepresents the site to anyone who does read it).
const corePagesByPriority: Array<{ paths: readonly string[]; priority: number }> = [
  { paths: ['/pricing', '/audit'], priority: 0.9 },
  {
    paths: [
      '/learning-centre',
      '/resources',
      '/case-studies',
      '/why-is-my-landing-page-not-converting',
      '/ads-getting-clicks-but-no-sales',
      '/landing-page-message-match',
      '/landing-page-trust-signals',
      '/landing-page-cta-audit',
      '/mobile-landing-page-audit',
      '/saas-landing-page-audit',
      '/ecommerce-landing-page-audit',
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
      '/workspace',
      '/playbooks',
    ],
    priority: 0.7,
  },
  { paths: ['/about', '/about/team'], priority: 0.5 },
  { paths: ['/privacy-policy', '/data-rights', '/terms'], priority: 0.2 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const homeEntry: MetadataRoute.Sitemap[number] = {
    url: BASE_URL,
    changeFrequency: 'weekly',
    priority: 1,
  }

  const coreEntries: MetadataRoute.Sitemap = corePagesByPriority.flatMap(({ paths, priority }) =>
    paths.map((path) => ({
      url: `${BASE_URL}${path}`,
      changeFrequency: 'weekly' as const,
      priority,
    }))
  )

  const articleEntries: MetadataRoute.Sitemap = getArticles()
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map(({ slug }) => ({
      url: `${BASE_URL}/learning-centre/${slug}`,
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

  // Relocated out of /learning-centre (2026-07-27) — founder-productivity/
  // AI-ops content, not part of getArticles()'s conversion-diagnosis scan.
  const playbookEntries: MetadataRoute.Sitemap = [
    'founder-second-brain',
    'linkedin-skill-engine',
    'specialist-ai-agent-library',
  ].map((slug) => ({
    url: `${BASE_URL}/playbooks/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const caseStudyEntries: MetadataRoute.Sitemap = getPublishedCaseStudies().map(({ slug }) => ({
    url: `${BASE_URL}/case-studies/${slug}`,
    changeFrequency: 'yearly',
    priority: 0.8,
  }))

  const citableEntries: MetadataRoute.Sitemap = getPublishedCitableRoutes({
    includeOverview: true,
  }).map((route) => ({
    url: `${BASE_URL}${route.path}`,
    changeFrequency: 'monthly',
    priority: route.kind === 'overview' ? 0.8 : 0.7,
  }))

  // lastModified is intentionally omitted until each content object has a
  // truthful, durable publication/update timestamp. Build time is not freshness.
  return [homeEntry, ...coreEntries, ...articleEntries, ...playbookEntries, ...caseStudyEntries, ...citableEntries]
}
