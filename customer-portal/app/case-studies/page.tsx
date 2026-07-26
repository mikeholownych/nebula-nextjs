import { getPublishedCaseStudies } from '@/app/lib/public-facts'
import CaseStudiesContent from './CaseStudiesContent'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Case Studies | Nebula Components',
  description: "Evidence-backed Nebula Components case studies. We don't publish an entry until its evidence, measurement window, permission, disclosure, and publication metadata are complete.",
  alternates: {
    canonical: 'https://nebulacomponents.shop/case-studies',
  },
}

export default function CaseStudiesIndex() {
  return <CaseStudiesContent studies={getPublishedCaseStudies()} />
}
