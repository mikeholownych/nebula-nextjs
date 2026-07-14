import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Speed and Conversion Rate | Nebula Components',
  description: 'How slow load times kill landing page conversions — and the 3 fastest fixes.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/page-speed-conversion',
  },
  openGraph: {
    title: 'Page Speed and Conversion Rate',
    description: 'How slow load times kill landing page conversions — and the 3 fastest fixes.',
    url: 'https://nebulacomponents.shop/page-speed-conversion',
    type: 'article',
    images: ['https://nebulacomponents.shop/og-card.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://nebulacomponents.shop/og-card.png'],
  },
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
