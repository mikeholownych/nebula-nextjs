import { Metadata } from 'next'

// Session-scoped surface: renders per-user data client-side. Must never be
// treated as static or cached by any shared cache (CDN or otherwise).
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Workspace - Nebula Components',
  description:
    'Your optimization workspace: audit history, project health, and what to work on next.',
  openGraph: {
    title: 'Workspace - Nebula Components',
    description:
      'Dashboard, projects, and immutable audit history for your landing pages.',
    url: 'https://nebulacomponents.com/workspace',
  },
  alternates: {
    canonical: 'https://nebulacomponents.com/workspace',
  },
}

export default function WorkspacePage() {
  return <WorkspaceClient />
}

import WorkspaceClient from './WorkspaceClient'
