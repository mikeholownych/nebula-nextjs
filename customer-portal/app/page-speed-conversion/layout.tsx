import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Speed and Conversion Rate | Nebula Components',
  description: 'How slow load times hurt landing page conversions - and the 3 fastest fixes.',
  alternates: {
    canonical: 'https://nebulacomponents.com/page-speed-conversion',
  },
  openGraph: {
    title: 'Page Speed and Conversion Rate',
    description: 'How slow load times hurt landing page conversions - and the 3 fastest fixes.',
    url: 'https://nebulacomponents.com/page-speed-conversion',
    type: 'article',
    images: ['https://nebulacomponents.com/brand/v2/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://nebulacomponents.com/brand/v2/og-default.png'],
  },
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
