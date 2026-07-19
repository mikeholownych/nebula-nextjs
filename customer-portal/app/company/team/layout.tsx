import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Team | Nebula Components',
  description: 'The people behind Nebula Components conversion optimization.',
  robots: { index: true, follow: true },
}
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
