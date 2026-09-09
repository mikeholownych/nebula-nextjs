import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '..')
const repoRoot = path.resolve(root, '..')

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

describe('Citable public projection', () => {
  test('commits the deployed page and deterministic projection workflow', () => {
    expect(fs.existsSync(path.join(root, 'app/resources/citable/page.tsx'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'scripts/sync-citable-projection.mjs'))).toBe(true)
    expect(fs.existsSync(path.join(repoRoot, '.github/workflows/sync-citable-projection.yml'))).toBe(true)
  })

  test('projects the synchronized package facts across discoverable surfaces without pinning old counts', () => {
    const projection = JSON.parse(read('data/citable-release.json'))
    expect(projection.package).toBe('@nebulacomponents/citable')
    expect(projection.version).toMatch(/^\d+\.\d+\.\d+$/)
    expect(projection.detectorCount).toBeGreaterThan(0)
    expect(projection.namespaceCount).toBeGreaterThan(0)
    expect(projection.registryCount).toBeGreaterThan(0)
    expect(projection.source).toBe(`npm:${projection.package}@${projection.version}`)

    for (const file of [
      'app/resources/citable/content.ts',
      'app/resources/citable/page.tsx',
      'app/resources/page.tsx',
    ]) {
      const content = read(file)
      expect(content).not.toMatch(/softwareVersion:\s*['"]\d+\.\d+\.\d+['"]/)
    }

    expect(read('app/resources/citable/content.ts'))
      .toContain("import citableRelease from '../../../data/citable-release.json'")
    expect(read('public/llms.txt')).toContain(`Citable v${projection.version}`)
    expect(read('public/llms-full.txt')).toContain(`- Version: ${projection.version}`)
  })

  test('serves the vendored release governance projections as controlled surfaces', () => {
    // Byte-exact copies of the citable GitHub release assets. The deployed
    // /resources/citable header and /resources/citable/llms.txt body are
    // verified against the release manifest by deployment receipts.
    const resourceDataRaw = read('public/resources/citable/resource-data.json')
    const resourceDataHash = require('node:crypto').createHash('sha256').update(resourceDataRaw).digest('hex')
    expect(resourceDataHash).toBe('c71cc240318e2adc4674cb2be24cef49a7ad68ee39171efe41c7cd909e4abc88')

    const resourceData = JSON.parse(resourceDataRaw)
    expect(resourceData.product).toBe('Citable')
    expect(resourceData.version).toBe('1.17.0')
    expect(resourceData.commit).toBe('5c7beecdadce9c3b55ba5f947cf8c685c7017205')
    expect(resourceData.facts).toEqual({
      detectors: 181,
      namespaces: 19,
      registries: 29,
      providers: 12,
      distribution_files_per_provider: 101,
    })

    const llms = read('public/resources/citable/llms.txt')
    const llmsHash = require('node:crypto').createHash('sha256').update(llms).digest('hex')
    expect(llmsHash).toBe('efe57aeed75fa35b40e3396c901ee62e9b54221a0fad51fc1670cdda085d40c5')

    expect(llms.startsWith('# Citable\n')).toBe(true)
    expect(llms).toContain(`- Version: ${resourceData.version}`)
    expect(llms).toContain(`- Release commit: ${resourceData.commit}`)
  })
})
