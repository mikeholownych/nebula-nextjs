import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nebula Components Press Kit - Conversion Diagnostics Research',
  description:
    'Editorial press kit for Nebula Components with governed conversion-diagnostics research, approved boilerplate, founder facts, and downloadable brand assets.',
  openGraph: {
    title: 'Nebula Components Press Kit - Conversion Diagnostics Research',
    description:
      'Governed research, editorial boilerplate, founder facts, and approved press assets from Nebula Components.',
    images: [{ url: '/press/scorecard-example.png', alt: 'Nebula Components audit scorecard example' }],
  },
  alternates: {
    canonical: 'https://nebulacomponents.com/press',
  },
};

export default function PressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
