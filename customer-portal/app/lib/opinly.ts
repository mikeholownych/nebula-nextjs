import { createOpinlyClient, type OpinlyClient } from '@opinly/backend'

export const OPINLY_BLOG_PATH = '/blog'
export const OPINLY_IMAGES_PATH = '/opinly-images'
export const OPINLY_CDN_NAMESPACE = '_NlFRT6KwFUIYgYHEbUVL'
export const OPINLY_SITE_URL = 'https://nebulacomponents.com'
export const OPINLY_COMPANY_NAME = 'Nebula Components'
export const OPINLY_IMAGES_PREFIX = `https://cdn.opinly.ai/${OPINLY_CDN_NAMESPACE}`

/**
 * Every Opinly content request carries the shared invalidation tag. This is
 * intentionally applied at the fetch boundary so future client methods cannot
 * accidentally bypass webhook invalidation.
 */
export function getOpinlyClient(): OpinlyClient {
  const apiKey = process.env.OPINLY_API_KEY
  if (!apiKey) {
    throw new Error('Opinly is not configured: OPINLY_API_KEY is missing')
  }

  return createOpinlyClient({
    apiKey,
    fetch: (input, init) => fetch(input, {
      ...init,
      next: {
        ...(init?.next ?? {}),
        tags: ['opinly'],
      },
    }),
  })
}

export const opinlyRenderConfig = {
  imagesPrefix: OPINLY_IMAGES_PREFIX,
  siteUrl: OPINLY_SITE_URL,
  blogPrefix: OPINLY_BLOG_PATH,
  siteName: OPINLY_COMPANY_NAME,
  categoryPrefix: 'category',
  authorPrefix: 'authors',
  tagPrefix: 'tag',
}
