/**
 * Shared route factory: every workspace tab is a real page rendering the
 * full legacy WorkspaceClient with that tab preselected. One source of
 * truth for chrome and data; only the initial tab differs per route.
 */

import WorkspaceClient from '@/components/workspace/WorkspaceClient'

export function makeWorkspacePage(tabId: string) {
  function Page() {
    return <WorkspaceClient initialTab={tabId} />
  }
  return Page
}
