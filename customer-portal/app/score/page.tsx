import type { Metadata } from 'next'
import ScoreClient from './ScoreClient'

export const metadata: Metadata = {
  title: 'Landing Page Conversion Score — Free, Instant | Nebula',
  description: 'Enter your domain. See your conversion score and top leak instantly — no signup required. 9 conversion signals scored in seconds.',
  alternates: { canonical: 'https://nebulacomponents.com/score' },
  openGraph: {
    title: 'Landing Page Conversion Score — Free, Instant | Nebula',
    description: 'Enter your domain. See your conversion score and top leak instantly — no signup required.',
    url: 'https://nebulacomponents.com/score',
    siteName: 'Nebula Components',
    locale: 'en_US',
    type: 'website',
  },
}

export default function ScorePage() {
  return <ScoreClient />
}
