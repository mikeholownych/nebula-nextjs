import type { Metadata } from 'next'
import FunnelAuditClient from './FunnelAuditClient'

export const metadata: Metadata = {
  title: 'Funnel Friction Miner, Find Where Your Funnel Breaks | Nebula',
  description: 'Enter your ad landing page, signup page, and checkout URL. Nebula scores each step and shows where conversion drops, so you fix the right leak first.',
  alternates: { canonical: 'https://nebulacomponents.com/funnel-audit' },
  openGraph: {
    title: 'Funnel Friction Miner, Find Where Your Funnel Breaks | Nebula',
    description: 'Multi-step funnel analysis. Score each page, find the friction point, fix the biggest leak first.',
    url: 'https://nebulacomponents.com/funnel-audit',
    siteName: 'Nebula Components',
    type: 'website',
  },
}

export default function FunnelAuditPage() {
  return <FunnelAuditClient />
}
