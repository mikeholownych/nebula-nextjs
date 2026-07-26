import { readFileSync } from 'node:fs'
import path from 'node:path'

const read = (relative: string) =>
  readFileSync(path.join(process.cwd(), relative), 'utf8')
    .toLowerCase()
    .replace(/\s+/g, ' ')

describe('public copy evidence boundaries', () => {
  it('does not publish fixed sub-timeout audit promises or guaranteed conversion outcomes', () => {
    const source = read('app/ai-sdr-vs-audit/page.tsx')

    expect(source).not.toMatch(/(?:under|in|within|results in).{0,12}60 seconds/)
    expect(source).not.toContain('60-second audit')
    expect(source).not.toContain('page that converts')
  })

  it('keeps selected answer-first articles diagnostic rather than causal', () => {
    const source = [
      'app/learning-centre/google-ads-clicks-no-sales/page.tsx',
      'app/learning-centre/linkedin-ads-not-converting/page.tsx',
    ].map(read).join(' ')

    expect(source).not.toContain('the ad worked, the page did not')
    expect(source).not.toContain('the page failed')
    expect(source).not.toContain('this is the primary cause')
    expect(source).not.toContain('not a targeting problem')
    expect(source).not.toContain('the page is usually why')
    expect(source).not.toContain('most high-bounce patterns from paid search are caused by')
    expect(source).not.toContain('ad is the problem, not the page')
  })
})
