import { permanentRedirect } from 'next/navigation'

// Deprecated 2026-08-25: workspace has moved to app.nebulacomponents.com.
// All nav and auth callbacks already point there. This permanent redirect
// handles any bookmarks or external links still using the old URL.
export const dynamic = 'force-dynamic'

export default function WorkspacePage() {
  permanentRedirect('https://app.nebulacomponents.com')
}
