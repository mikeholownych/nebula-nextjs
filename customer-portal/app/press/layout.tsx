import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nebula Components Press Kit - Key Metrics and Insights for Journalists',
  description:
    'Editorial press kit for Nebula Components with governed conversion-diagnostics research, approved boilerplate, founder facts, and downloadable brand assets.',
  openGraph: {
    title: 'Nebula Components Press Kit - Key Metrics and Insights for Journalists',
    description:
      'Governed research, editorial boilerplate, founder facts, and approved press assets from Nebula Components.',
    url: 'https://nebulacomponents.com/press',
    siteName: 'Nebula Components',
    type: 'website',
    images: [{ url: '/press/scorecard-example.png', alt: 'Nebula Components audit scorecard example' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nebula Components Press Kit',
    description:
      'Governed research, editorial boilerplate, founder facts, and approved press assets from Nebula Components.',
    creator: '@NebulaCRO',
  },
  alternates: {
    canonical: 'https://nebulacomponents.com/press',
  },
};

export default function PressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
