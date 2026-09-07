'use client'
import { usePostHog } from 'posthog-js/react'

export function BlogAuditCTA({ slug, contentLane, postType }: {
  slug: string
  contentLane: string
  postType: string
}) {
  const posthog = usePostHog()

  const handleClick = () => {
    posthog?.capture('blog_audit_click', {
      post_slug: slug,
      content_lane: contentLane,
      post_type: postType,
    })
  }

  return (
    <aside className="mt-14 max-w-3xl rounded-lg border border-accent/30 bg-accent-dim p-7">
      <h2 className="text-2xl font-semibold">Should you find the leak before buying more traffic?</h2>
      <p className="mt-3 text-fg-muted">Run the same evidence-backed check on your public landing page.</p>
      <a
        href="/audit"
        onClick={handleClick}
        className="mt-5 inline-block rounded bg-accent px-5 py-3 font-semibold text-bg"
      >
        Run the free audit
      </a>
    </aside>
  )
}
