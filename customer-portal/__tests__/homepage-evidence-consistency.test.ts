import fs from 'node:fs'
import path from 'node:path'

const homepageSource = fs.readFileSync(path.join(process.cwd(), 'app/page.tsx'), 'utf8')

describe('homepage evidence consistency', () => {
  it('does not hard-code a self-audit score beside the live SelfScan result', () => {
    expect(homepageSource).not.toMatch(/\b\d+(?:\.\d+)?\/10\b/)
  })

  it('keeps the honest proof boundary without implying a client outcome', () => {
    expect(homepageSource).toContain('We run this audit on ourselves first.')
    expect(homepageSource).toContain('When we have a real client outcome with dates, proof, and a way for you to verify it')
  })
})
