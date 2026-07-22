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

  test('projects the published v1.13.0 package across discoverable surfaces', () => {
    const projection = JSON.parse(read('data/citable-release.json'))
    expect(projection.version).toBe('1.13.0')
    expect(projection.detectorCount).toBe(123)
    expect(projection.namespaceCount).toBe(18)
    expect(projection.registryCount).toBe(27)

    for (const file of [
      'app/resources/citable/page.tsx',
      'app/resources/page.tsx',
      'public/llms.txt',
      'public/llms-full.txt',
    ]) {
      const content = read(file)
      expect(content).not.toContain('v1.12.0 — Evidence Layer')
      expect(content).not.toContain('softwareVersion: \'1.12.0\'')
    }

    expect(read('public/llms.txt')).toContain('Citable v1.13.0')
    expect(read('public/llms-full.txt')).toContain('- Version: 1.13.0')
  })

  test('serves the vendored release governance projections as controlled surfaces', () => {
    // Byte-exact copies of the citable GitHub release assets. The deployed
    // /resources/citable header and /resources/citable/llms.txt body are
    // verified against the release manifest by deployment receipts.
    const resourceData = JSON.parse(read('public/resources/citable/resource-data.json'))
    expect(resourceData.product).toBe('Citable')
    expect(resourceData.version).toMatch(/^\d+\.\d+\.\d+$/)
    expect(resourceData.commit).toMatch(/^[0-9a-f]{40}$/)

    const llms = read('public/resources/citable/llms.txt')
    expect(llms.startsWith('# Citable\n')).toBe(true)
    expect(llms).toContain(`- Version: ${resourceData.version}`)
    expect(llms).toContain(`- Release commit: ${resourceData.commit}`)
  })
})
