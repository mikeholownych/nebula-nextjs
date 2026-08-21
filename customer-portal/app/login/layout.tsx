import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Sign in to your workspace | Nebula',
  description: 'Sign in to access your audits, recommendations, and optimization history.',
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://nebulacomponents.com/login',
  },
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children
}
