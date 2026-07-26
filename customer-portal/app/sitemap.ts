import { MetadataRoute } from 'next'
import { getPublishedCaseStudies } from '@/app/lib/public-facts'
import { getArticles } from './learning-centre/lib/getArticles'

const BASE_URL = 'https://nebulacomponents.shop'

// Priority reflects actual page importance, not a uniform default — legal/
// utility pages sit well below commercial and hub pages so the signal means
// something (Google ignores it for ranking, but other consumers don't, and a
// stale/flat value misrepresents the site to anyone who does read it).
const corePagesByPriority: Array<{ paths: readonly string[]; priority: number }> = [
  { paths: ['/pricing', '/audit'], priority: 0.9 },
  { paths: ['/learning-centre', '/resources', '/resources/citable', '/case-studies'], priority: 0.8 },
  {
    paths: [
      '/7-systems',
      '/ai-sdr-vs-audit',
      '/concepts',
      '/cta-optimization',
      '/editorial-standards',
      '/headline-optimization',
      '/mobile-landing-page-optimization',
      '/page-speed-conversion',
      '/roas-cliff',
      '/social-proof-landing-page',
      '/what-is-landing-page-audit',
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

  const caseStudyEntries: MetadataRoute.Sitemap = getPublishedCaseStudies().map(({ slug }) => ({
    url: `${BASE_URL}/case-studies/${slug}`,
    changeFrequency: 'yearly',
    priority: 0.8,
  }))

  // lastModified is intentionally omitted until each content object has a
  // truthful, durable publication/update timestamp. Build time is not freshness.
  return [homeEntry, ...coreEntries, ...articleEntries, ...caseStudyEntries]
}
