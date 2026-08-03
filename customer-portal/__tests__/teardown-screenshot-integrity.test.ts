import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { TEARDOWNS } from '@/app/teardowns/[slug]/data'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

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
    '%s has a real 1280x800 PNG screenshot',
    (slug, teardown) => {
      expect(teardown.screenshotUrl).toBe(`/teardown-screenshots/${slug}.png`)

      const assetPath = path.join(process.cwd(), 'public', teardown.screenshotUrl!.slice(1))
      expect(existsSync(assetPath)).toBe(true)
      expect(statSync(assetPath).size).toBeGreaterThan(10_000)

      const image = readFileSync(assetPath)
      expect(image.subarray(0, 8)).toEqual(PNG_SIGNATURE)
      expect(image.readUInt32BE(16)).toBe(1280)
      expect(image.readUInt32BE(20)).toBe(800)
    },
  )
})
