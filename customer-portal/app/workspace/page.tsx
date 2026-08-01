import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workspace — Nebula Components',
  description:
    'Your optimization workspace: audit history, project health, and what to work on next.',
  openGraph: {
    title: 'Workspace — Nebula Components',
    description:
      'Dashboard, projects, and immutable audit history for your landing pages.',
    url: 'https://nebulacomponents.shop/workspace',
  },
  alternates: {
    canonical: 'https://nebulacomponents.shop/workspace',
  },
}

export default function WorkspacePage() {
  return <WorkspaceClient />
}

import WorkspaceClient from './WorkspaceClient'
