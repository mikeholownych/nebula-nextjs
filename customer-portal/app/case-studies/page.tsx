import { getPublishedCaseStudies } from '@/app/lib/public-facts'
import CaseStudiesContent from './CaseStudiesContent'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Case Studies | Nebula Components',
  description: 'Evidence-backed case studies published only when permission, measurement, and supporting evidence are complete.',
  alternates: {
    canonical: 'https://nebulacomponents.com/case-studies',
  },
}

export default function CaseStudiesIndex() {
  return <CaseStudiesContent studies={getPublishedCaseStudies()} />
}
