import { getPublishedCaseStudies } from '@/app/lib/public-facts'
import CaseStudiesContent from './CaseStudiesContent'

export const dynamic = 'force-dynamic'

const caseStudiesSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': 'https://nebulacomponents.com/case-studies#webpage',
  url: 'https://nebulacomponents.com/case-studies',
  name: 'Nebula Components Case Studies',
  description: 'Evidence-backed case studies published only when permission, measurement, and supporting evidence are complete.',
  isPartOf: { '@id': 'https://nebulacomponents.com/#website' },
  about: { '@id': 'https://nebulacomponents.com/#organization' },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.com/' },
      { '@type': 'ListItem', position: 2, name: 'Case Studies', item: 'https://nebulacomponents.com/case-studies' },
    ],
  },
}

export const metadata = {
  title: 'Case Studies | Nebula Components',
  description: 'Evidence-backed case studies published only when permission, measurement, and supporting evidence are complete.',
  alternates: {
    canonical: 'https://nebulacomponents.com/case-studies',
  },
}

export default function CaseStudiesIndex() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(caseStudiesSchema) }}
      />
      <CaseStudiesContent studies={getPublishedCaseStudies()} />
    </>
  )
}
