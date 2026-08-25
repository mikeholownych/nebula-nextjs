'use client'

// Site Health: the legacy workspace, ported whole for exact visual parity.
// Data loads through the BFF proxy to the portal app; auth uses the shared
// parent-domain session cookie. Real route (no ?tab= default state changes:
// deep links still work via the same query params the legacy app used).

import WorkspaceClient from '@/components/workspace/WorkspaceClient'

export default function SiteHealthPage() {
  return <WorkspaceClient />
}
