import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'About | Nebula Components',
  description: 'About Nebula Components — evidence-backed landing page conversion optimization.',
  robots: { index: true, follow: true },
}
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
