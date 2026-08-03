import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Press Kit — Nebula Components',
  description:
    'Press kit for Nebula Components: product facts, founder bio, key statistics, and media assets.',
  alternates: {
    canonical: 'https://nebulacomponents.com/press',
  },
};

export default function PressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
