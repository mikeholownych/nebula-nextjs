import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ClaimClient from './ClaimClient'
import { fetchTeardown } from '../data.server'

export const metadata: Metadata = {
  title: 'Claim your teardown | Nebula',
  robots: { index: false },
}

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const t = await fetchTeardown(slug)
  if (!t) notFound()
  return <ClaimClient slug={slug} domain={t.domain} />
}
