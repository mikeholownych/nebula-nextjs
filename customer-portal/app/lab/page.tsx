import type { Metadata } from 'next'
import LabClient from './LabClient'

export const metadata: Metadata = {
  title: 'Component Lab — Check Your Headline, CTA & Message Match | Nebula',
  description:
    'Three evidence-backed component checks: message match, headline, and CTA. Paste your ad copy and page URL — get status, evidence, and the pass standard for each component.',
}

export default function LabPage() {
  return (
    <main className="min-h-screen bg-bg">
      <section className="border-b border-border px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Component Lab
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Check the components that decide the click.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-fg-muted md:text-lg">
            All 9 conversion components, on demand. Paste your ad copy and page URL — Nebula
            runs the same engine as the free audit and shows you the status, the evidence, and the
            pass standard for each component. Grouped by layer: conversion, technical, discoverability.
          </p>
        </div>
      </section>
      <LabClient />
    </main>
  )
}
