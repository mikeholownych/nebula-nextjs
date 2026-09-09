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
    expect(resourceDataHash).toBe('95fdc56bd0e199dba6baef47c29ee62881f9cb9af3c1a85f8fe2a72fb4318d65')

    const resourceData = JSON.parse(resourceDataRaw)
    expect(resourceData.product).toBe('Citable')
    expect(resourceData.version).toBe('1.18.0')
    expect(resourceData.commit).toBe('9b01dcd4ce43482e3c82883088689c908a94fb7d')
    expect(resourceData.facts).toEqual({
      detectors: 181,
      namespaces: 19,
      registries: 29,
      providers: 12,
      distribution_files_per_provider: 102,
    })

    const llms = read('public/resources/citable/llms.txt')
    const llmsHash = require('node:crypto').createHash('sha256').update(llms).digest('hex')
    expect(llmsHash).toBe('94a6b78b4643297721d5471375085ef4008b3d579eb26d182354ff00a385d173')

    expect(llms.startsWith('# Citable\n')).toBe(true)
    expect(llms).toContain(`- Version: ${resourceData.version}`)
    expect(llms).toContain(`- Release commit: ${resourceData.commit}`)
  })
})
