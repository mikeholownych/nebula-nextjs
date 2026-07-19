import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Thank You — Your Audit Is On Its Way | Nebula Components',
  description: 'Your landing page audit request has been received. You will receive your conversion diagnosis by email within 24 hours.',
  robots: { index: false, follow: false },
}
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
