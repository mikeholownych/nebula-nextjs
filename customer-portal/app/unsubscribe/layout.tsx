import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Unsubscribe | Nebula Components',
  description: 'Unsubscribe from Nebula Components email communications.',
  robots: { index: false, follow: false },
}

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
