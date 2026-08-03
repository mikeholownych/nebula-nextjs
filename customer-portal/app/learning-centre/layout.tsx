import type { Metadata } from 'next'
import BreadcrumbSchema from '@/app/components/BreadcrumbSchema'

export const metadata: Metadata = {
  title: 'Learning Centre — Landing Page Conversion Guides | Nebula Components',
  description:
    'In-depth guides on landing page conversion leaks: message-match failures, trust signal gaps, mobile friction, slow load times, and paid traffic diagnostics.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre',
  },
}

export default function LearningCentreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbSchema />
      {children}
    </>
  )
}
