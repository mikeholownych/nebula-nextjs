import { Webhook } from 'svix'
import type { ContentRouteChange, OpinlyWebhookEvent } from '@opinly/backend'
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { OPINLY_BLOG_PATH } from '@/app/lib/opinly'

export const runtime = 'nodejs'

function changedRoutePath(route: ContentRouteChange): string {
  switch (route.type) {
    case 'post': return `${OPINLY_BLOG_PATH}/${route.slug}`
    case 'category': return `${OPINLY_BLOG_PATH}/category/${route.slug}`
    case 'author': return `${OPINLY_BLOG_PATH}/authors/${route.slug}`
    case 'tag': return `${OPINLY_BLOG_PATH}/tag/${route.slug}`
    case 'home': return OPINLY_BLOG_PATH
  }
}

export async function POST(request: Request) {
  const secret = process.env.OPINLY_WEBHOOK_SIGNING_SECRET
  if (!secret) return new Response('Opinly webhook is not configured', { status: 503 })

  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Invalid request', { status: 400 })
  }

  let event: OpinlyWebhookEvent
  try {
    const payload = Buffer.from(await request.arrayBuffer())
    event = new Webhook(secret).verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as unknown as OpinlyWebhookEvent
  } catch {
    return new Response('Error verifying webhook', { status: 400 })
  }

  if (event.type !== 'content.routes-changed') return NextResponse.json({ ok: true })

  // Immediate invalidation is required for publish-now semantics on Next 16+.
  revalidateTag('opinly', { expire: 0 })
  for (const route of event.data.changed) {
    revalidatePath(changedRoutePath(route))
  }
  // The sitemap is generated from the same content route list.
  revalidatePath('/sitemap.xml')

  return NextResponse.json({ ok: true, invalidated: event.data.changed.length })
}
