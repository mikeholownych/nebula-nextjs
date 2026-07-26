import { cleanup, render, within } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import FacebookAdsNoLeadsPage from '@/app/learning-centre/facebook-ads-no-leads/page'
import GoogleAdsClicksNoSalesPage from '@/app/learning-centre/google-ads-clicks-no-sales/page'
import LandingPageNotConvertingPage from '@/app/learning-centre/landing-page-not-converting/page'
import LinkedinAdsNotConvertingPage from '@/app/learning-centre/linkedin-ads-not-converting/page'

const priorityPages = [
  {
    slug: 'landing-page-not-converting',
    Page: LandingPageNotConvertingPage,
  },
  {
    slug: 'google-ads-clicks-no-sales',
    Page: GoogleAdsClicksNoSalesPage,
  },
  {
    slug: 'facebook-ads-no-leads',
    Page: FacebookAdsNoLeadsPage,
  },
  {
    slug: 'linkedin-ads-not-converting',
    Page: LinkedinAdsNotConvertingPage,
  },
] as const

describe('answer-first priority editorial', () => {
  afterEach(cleanup)

  it('keeps the conversion-intent editorial set explicitly bounded', () => {
    expect(priorityPages.map(({ slug }) => slug)).toEqual([
      'landing-page-not-converting',
      'google-ads-clicks-no-sales',
      'facebook-ads-no-leads',
      'linkedin-ads-not-converting',
    ])
  })

  it.each(priorityPages)(
    'places one direct answer before the rest of the article: $slug',
    ({ Page }) => {
      const { container } = render(<Page />)
      const main = container.querySelector('main')
      const answer = container.querySelector<HTMLElement>(
        'section[data-editorial="answer-first"]',
      )

      expect(main).not.toBeNull()
      expect(answer).not.toBeNull()
      expect(within(answer!).getByRole('heading', { level: 2, name: /direct answer/i }))
        .toBeInTheDocument()
      expect(main!.querySelector('section')).toBe(answer)
    },
  )

  it.each(priorityPages)(
    'states the evidence and causality boundary in the direct answer: $slug',
    ({ Page }) => {
      const { container } = render(<Page />)
      const answer = container.querySelector<HTMLElement>(
        'section[data-editorial="answer-first"]',
      )
      const boundary = within(answer!).getByRole('note', {
        name: /evidence boundary/i,
      })

      expect(boundary).toHaveTextContent(/\b(?:do(?:es)? not|cannot) prove\b/i)
      expect(boundary).toHaveTextContent(/\b(?:hypoth(?:esis|eses)|causality)\b/i)
      expect(boundary).toHaveTextContent(/\bno\b.+\bguarantee(?:s|d)?\b/i)
    },
  )

  it.each(priorityPages)(
    'uses descriptive links to real related Learning Centre pages: $slug',
    ({ Page }) => {
      const { container } = render(<Page />)
      const answer = container.querySelector<HTMLElement>(
        'section[data-editorial="answer-first"]',
      )
      const links = within(answer!).getAllByRole('link')
        .filter((link) => link.getAttribute('href')?.startsWith('/learning-centre/'))

      expect(links.length).toBeGreaterThanOrEqual(2)
      for (const link of links) {
        const href = link.getAttribute('href')!
        const label = link.textContent?.trim() ?? ''
        const slug = href.replace('/learning-centre/', '')

        expect(label.split(/\s+/).length).toBeGreaterThanOrEqual(4)
        expect(label).not.toMatch(/^(?:click here|here|learn more|read more|more)$/i)
        expect(
          existsSync(path.join(process.cwd(), 'app', 'learning-centre', slug, 'meta.json')),
        ).toBe(true)
      }
    },
  )

  it.each(priorityPages)(
    'does not make an unsupported outcome promise: $slug',
    ({ slug }) => {
      const source = readFileSync(
        path.join(process.cwd(), 'app', 'learning-centre', slug, 'page.tsx'),
        'utf8',
      )

      expect(source).not.toMatch(
        /\b(?:almost certainly|almost always|will consistently underperform|consistently outperforms?|converts? consistently better|converts? at higher volume|can reduce cost-per-lead by|one real proof point outperforms)\b/i,
      )
    },
  )

  it('keeps the representative long article FAQ visible without duplicating FAQPage schema', () => {
    const { container } = render(<LandingPageNotConvertingPage />)
    const jsonLdTypes = Array.from(
      container.querySelectorAll<HTMLScriptElement>(
        'script[type="application/ld+json"]',
      ),
      (script) => JSON.parse(script.textContent ?? '{}')['@type'],
    )

    expect(
      within(container).getByRole('heading', {
        level: 2,
        name: /frequently asked questions/i,
      }),
    ).toBeInTheDocument()
    expect(jsonLdTypes).not.toContain('FAQPage')
  })
})
