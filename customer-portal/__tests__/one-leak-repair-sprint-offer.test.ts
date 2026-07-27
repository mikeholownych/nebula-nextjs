import fs from 'node:fs'
import path from 'node:path'
import { REPAIR_SPRINT_OFFER } from '@/app/lib/repair-sprint-offer'

const root = process.cwd()
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const publicSurfacePaths = [
  'app/page.tsx',
  'app/pricing/page.tsx',
  'app/checkout/page.tsx',
  'components/WebMCP.tsx',
  'app/terms/page.tsx',
  'public/llms-full.txt',
]

const forbiddenLegacyLanguage =
  /AI prompt pack|prompt pack|prompt per finding|every finding|no site access required|within minutes of payment|conversion does not improve|full implementation of all identified fixes/i

const activePublicFiles = ['app', 'components', 'public'].flatMap((directory) => {
  const walk = (absoluteDirectory: string): string[] =>
    fs.readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
      const absolutePath = path.join(absoluteDirectory, entry.name)
      if (entry.isDirectory()) return walk(absolutePath)
      return /\.(?:ts|tsx|js|jsx|md|mdx|txt|json)$/.test(entry.name) ? [absolutePath] : []
    })

  return walk(path.join(root, directory))
})

const forbiddenPaidOfferDrift =
  /\bFix Pack\b|Conversion Fix Pack|AI prompt pack|prompt pack|Fix Pack Prompt|tailored AI prompt|one prompt per finding|implements every finding|full implementation of all identified fixes|conversion does not improve/i

describe('One-Leak Repair Sprint offer integrity', () => {
  it('keeps the locked commercial identifiers stable', () => {
    expect(REPAIR_SPRINT_OFFER).toMatchObject({
      key: 'fix-pack',
      name: 'One-Leak Repair Sprint',
      priceUsd: 97,
      checkoutUrl: 'https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h',
    })
  })

  it.each(publicSurfacePaths)('%s contains no obsolete prompt-pack or guarantee language', (relativePath) => {
    expect(read(relativePath)).not.toMatch(forbiddenLegacyLanguage)
  })

  it('contains no stale paid-offer language on any active public source surface', () => {
    const drift = activePublicFiles.flatMap((absolutePath) => {
      const relativePath = path.relative(root, absolutePath)
      const lines = fs.readFileSync(absolutePath, 'utf8').split('\n')
      return lines
        .map((line, index) => ({ relativePath, line, lineNumber: index + 1 }))
        .filter(({ line }) => forbiddenPaidOfferDrift.test(line))
    })

    expect(drift).toEqual([])
  })

  it('states the bounded scope and evidence boundary on pricing', () => {
    const pricing = read('app/pricing/page.tsx')
    expect(pricing).toContain('One-Leak Repair Sprint')
    expect(pricing).toMatch(/one landing page/i)
    expect(pricing).toMatch(/one high-confidence repair/i)
    expect(pricing).toMatch(/does not promise conversion lift/i)
  })

  it('states access and refund boundaries before checkout', () => {
    const checkout = read('app/checkout/page.tsx')
    expect(checkout).toMatch(/temporary collaborator access|buyer-approved patch/i)
    expect(checkout).toMatch(/never send (?:us )?passwords/i)
    expect(checkout).toMatch(/full refund before work begins/i)
  })
})
