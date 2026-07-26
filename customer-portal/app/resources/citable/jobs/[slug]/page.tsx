import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createArticleSchema, createBreadcrumbSchema } from '@/app/lib/schema'
import { CitableJobTemplate } from '@/components/citable/CitableJobTemplate'
import {
  CITABLE_ORIGIN,
  citableJobRoutes,
  getCitableJobBySlug,
  getCitableMetadata,
} from '../../content'

export const dynamic = 'force-dynamic'

interface CitableJobPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return citableJobRoutes.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: CitableJobPageProps): Promise<Metadata> {
  const { slug } = await params
  const job = getCitableJobBySlug(slug)
  if (!job) notFound()
  return getCitableMetadata(job)
}

export default async function CitableJobPage({ params }: CitableJobPageProps) {
  const { slug } = await params
  const job = getCitableJobBySlug(slug)
  if (!job) notFound()

  const canonical = `${CITABLE_ORIGIN}${job.path}`
  const articleSchema = createArticleSchema({
    headline: job.h1,
    description: job.description,
    url: canonical,
    publishedDate: '2026-07-26',
  })
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Resources', url: `${CITABLE_ORIGIN}/resources` },
    { name: 'Citable', url: `${CITABLE_ORIGIN}/resources/citable` },
    { name: job.h1, url: canonical },
  ])

  return (
    <>
      {[articleSchema, breadcrumbSchema].map((schema) => (
        <script
          key={schema['@type']}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <CitableJobTemplate job={job} />
    </>
  )
}
