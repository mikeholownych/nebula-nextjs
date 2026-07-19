import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Your Landing Page Audit Results | Nebula Components',
  description: 'Review your landing page audit findings — scored conversion leaks with prioritised fixes.',
  robots: { index: false, follow: false },
}
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
