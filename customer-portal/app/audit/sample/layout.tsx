import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Sample Audit Report | Nebula Components',
  description: 'See what a Nebula landing page audit report looks like before you submit your own URL.',
  robots: { index: true, follow: true },
}
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
