import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Landing Page Audit — Find Your Conversion Leaks | Nebula Components',
  description:
    'Submit your landing page URL for a free conversion audit. We check message-match, trust signals, mobile layout, form friction, load time, and compliance in minutes.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/audit',
  },
}

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
