import type { Metadata } from 'next'
import MistakesChecklistClient from './MistakesClient'

export const metadata: Metadata = {
  title: 'Top 10 Landing Page Mistakes Checklist - Nebula Components',
  description: 'Free downloadable checklist: The 10 landing page mistakes costing founders thousands in wasted ad spend. One-page scan. Specific fixes included.',
}

export default function MistakesChecklistPage() {
  return <MistakesChecklistClient />
}
