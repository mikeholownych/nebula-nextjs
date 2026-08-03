import fs from 'node:fs'
import path from 'node:path'
import { REPAIR_SPRINT_OFFER } from '@/app/lib/self-implementation-kit-offer'

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
  /AI prompt pack|prompt pack|prompt per finding|temporary collaborator|Nebula implements|implements (?:it|the fix) for you|within minutes of payment|full implementation of all identified fixes|refund if (?:your )?conversion/i

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
  /\bFix Pack\b|Conversion Fix Pack|AI prompt pack|prompt pack|Fix Pack Prompt|tailored AI prompt|one prompt per finding|implements every finding|temporary collaborator|full implementation of all identified fixes|refund if (?:your )?conversion/i

describe('One-Leak Self-Implementation Kit offer integrity', () => {
  it('defines the $97 offer as a customer-implemented kit', () => {
    expect(REPAIR_SPRINT_OFFER).toMatchObject({
      key: 'fix-pack',
      name: 'One-Leak Self-Implementation Kit',
      priceUsd: 97,
    })
    expect(REPAIR_SPRINT_OFFER.summary).toMatch(/customer|developer|implement/i)
    expect(REPAIR_SPRINT_OFFER.evidenceBoundary).toMatch(/does not guarantee conversion lift/i)
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

  it('states the bounded self-implementation scope and evidence boundary on pricing', () => {
    const pricing = read('app/pricing/page.tsx')
    expect(pricing).toContain('One-Leak Self-Implementation Kit')
    expect(pricing).toMatch(/one landing page/i)
    expect(pricing).toMatch(/customer|developer|implement/i)
    expect(pricing).toMatch(/does not promise conversion lift/i)
  })

  it('states no-access and no-lift-guarantee boundaries before checkout', () => {
    const checkout = read('app/checkout/page.tsx')
    expect(checkout).toMatch(/no site access|required from Nebula/i)
    expect(checkout).toMatch(/implement.*yourself|your developer|through your CMS/i)
    expect(checkout).toMatch(/does not guarantee conversion lift/i)
  })
})
