import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { TEARDOWNS } from '@/app/teardowns/[slug]/data'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const WEBP_SIGNATURE = Buffer.from([0x52, 0x49, 0x46, 0x46]) // RIFF header

describe('public teardown screenshot integrity', () => {
  test('runs this integrity gate before every production build', () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
    ) as { scripts?: Record<string, string> }

    expect(packageJson.scripts?.prebuild).toBe(
      'npm test -- --runInBand __tests__/teardown-screenshot-integrity.test.ts',
    )
  })

  test.each(Object.values(TEARDOWNS).map((teardown) => [teardown.slug, teardown] as const))(
    '%s has a screenshot asset (PNG or WebP)',
    (slug, teardown) => {
      // Accept either .png or .webp — WebP is preferred (smaller, same quality)
      const isPng = teardown.screenshotUrl?.endsWith('.png')
      const isWebp = teardown.screenshotUrl?.endsWith('.webp')
      expect(isPng || isWebp).toBe(true)

      const expectedUrl = isWebp
        ? `/teardown-screenshots/${slug}.webp`
        : `/teardown-screenshots/${slug}.png`
      expect(teardown.screenshotUrl).toBe(expectedUrl)

      const assetPath = path.join(process.cwd(), 'public', teardown.screenshotUrl!.slice(1))
      expect(existsSync(assetPath)).toBe(true)
      expect(statSync(assetPath).size).toBeGreaterThan(5_000)

      const image = readFileSync(assetPath)
      if (isPng) {
        expect(image.subarray(0, 8)).toEqual(PNG_SIGNATURE)
        expect(image.readUInt32BE(16)).toBe(1280)
        expect(image.readUInt32BE(20)).toBe(800)
      } else {
        // WebP: starts with RIFF....WEBP
        expect(image.subarray(0, 4)).toEqual(WEBP_SIGNATURE)
        expect(image.toString('ascii', 8, 12)).toBe('WEBP')
      }
    },
  )
})
