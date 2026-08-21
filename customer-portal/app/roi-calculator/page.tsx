import type { Metadata } from 'next'
import ROICalculatorClient from './ROICalculatorClient'

export const metadata: Metadata = {
  title: 'Ad Spend ROI Calculator: Measure Conversion Loss | Nebula',
  description: 'Enter your monthly ad spend, current conversion rate, and vertical. See exactly how much revenue your landing page is leaking every month, and what fixing it is worth.',
  alternates: { canonical: 'https://nebulacomponents.com/roi-calculator' },
  openGraph: {
    title: 'Ad Spend ROI Calculator: Measure Conversion Loss | Nebula',
    description: 'See your monthly revenue leak in dollars. Based on your actual spend, CVR, and vertical benchmark.',
    url: 'https://nebulacomponents.com/roi-calculator',
    siteName: 'Nebula Components',
    type: 'website',
  },
}

export default function ROICalculatorPage() {
  return <ROICalculatorClient />
}
