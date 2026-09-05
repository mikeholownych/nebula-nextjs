import { createOpinlyClient, type OpinlyClient } from '@opinly/backend'

export const OPINLY_CDN_NAMESPACE = '_NlFRT6KwFUIYgYHEbUVL'

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
