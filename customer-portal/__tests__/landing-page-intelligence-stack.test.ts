import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { unzipSync } from 'fflate'

const ROOT = process.cwd()
const SCRIPT = path.join(ROOT, 'scripts', 'package-landing-page-intelligence-stack.mjs')
const ZIP = path.join(ROOT, 'public', 'downloads', 'nebula-landing-page-intelligence-stack-v1.zip')

const EXPECTED_ENTRIES = [
  'README.md',
  'evidence-record.schema.json',
  'manifest.json',
  'workflows/01-message-match-checker.md',
  'workflows/02-trust-gap-detector.md',
  'workflows/03-mobile-first-scroll-analyzer.md',
  'workflows/04-cta-form-friction-analyzer.md',
  'workflows/05-paid-traffic-leak-prioritizer.md',
  'workflows/06-fix-verification-workflow.md',
]

function runPackager(args: string[] = [], env: Record<string, string> = {}) {
  return execFileSync(process.execPath, [SCRIPT, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    stdio: 'pipe',
  })
}

function withFixture(mutate: (sourceDir: string) => void, assertion: (sourceDir: string, outputDir: string) => void) {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), 'nebula-intelligence-stack-'))
  const sourceDir = path.join(fixtureRoot, 'source')
  const outputDir = path.join(fixtureRoot, 'output')
  cpSync(path.join(ROOT, 'content', 'landing-page-intelligence-stack'), sourceDir, { recursive: true })

  try {
    mutate(sourceDir)
    assertion(sourceDir, outputDir)
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
}

function expectFixtureRejected(mutate: (sourceDir: string) => void) {
  withFixture(mutate, (sourceDir, outputDir) => {
    expect(() => runPackager([], {
      STACK_SOURCE_DIR: sourceDir,
      STACK_OUTPUT_DIR: outputDir,
    })).toThrow()
    expect(existsSync(path.join(outputDir, 'nebula-landing-page-intelligence-stack-v1.zip'))).toBe(false)
    expect(existsSync(path.join(outputDir, 'nebula-landing-page-intelligence-stack-v1.zip.sha256'))).toBe(false)
  })
}

function updateManifest(sourceDir: string, mutate: (manifest: Record<string, unknown>) => void) {
  const manifestPath = path.join(sourceDir, 'manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>
  mutate(manifest)
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

describe('landing page intelligence stack', () => {
  it('does not emit FAQ schema without matching visible FAQ projections', () => {
    const home = readFileSync(path.join(ROOT, 'app', 'page.tsx'), 'utf8')
    const audit = readFileSync(path.join(ROOT, 'app', 'audit', 'page.tsx'), 'utf8')
    expect(home).not.toContain('homeFAQSchema')
    expect(audit).not.toContain('auditPageFAQSchema')
  })

  it('is enforced by the actual GitHub Actions workflow', () => {
    const workflow = readFileSync(path.join(ROOT, '..', '.github', 'workflows', 'ci.yml'), 'utf8')
    expect(workflow).toContain('- name: Verify intelligence stack projection')
    expect(workflow).toContain('run: npm run check:intelligence-stack')
  })

  it('publishes the approved article metadata and direct-download surface', () => {
    const articleDir = path.join(ROOT, 'app', 'learning-centre', 'landing-page-intelligence-stack')
    const meta = JSON.parse(readFileSync(path.join(articleDir, 'meta.json'), 'utf8'))
    const pageSource = readFileSync(path.join(articleDir, 'page.tsx'), 'utf8')

    expect(meta).toEqual({
      slug: 'landing-page-intelligence-stack',
      title: 'Landing Page Intelligence Stack: 6 Evidence-Grade Workflows',
      category: 'Conversion Systems',
      description: 'Download six inspectable workflows for message match, trust, mobile layout, CTA friction, prioritization, and fix verification.',
    })
    expect(pageSource.match(/<h1/g)).toHaveLength(1)
    expect(pageSource).toContain('/downloads/nebula-landing-page-intelligence-stack-v1.zip')
    expect(pageSource).toContain('data-testid="intelligence-stack-download-link"')
    expect(pageSource).toContain('href="/audit"')
    expect(pageSource).toContain('data-testid="intelligence-stack-audit-link"')
    expect(pageSource).not.toMatch(/<input|type="email"|guarantee|replaces paid|conversion lift/i)
  })

  it('exposes deterministic package and check commands', () => {
    const packageJson = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
    expect(packageJson.devDependencies.fflate).toBe('^0.8.3')
    expect(packageJson.scripts['package:intelligence-stack']).toBe(
      'node scripts/package-landing-page-intelligence-stack.mjs',
    )
    expect(packageJson.scripts['check:intelligence-stack']).toBe(
      'node scripts/package-landing-page-intelligence-stack.mjs --check',
    )
    expect(packageJson.scripts.ci).toContain('npm run check:intelligence-stack && npm run build')
  })

  it('packages exactly the declared non-empty files', () => {
    runPackager()

    const entries = unzipSync(readFileSync(ZIP))
    expect(Object.keys(entries).sort()).toEqual(EXPECTED_ENTRIES)

    for (const content of Object.values(entries)) {
      expect(content.byteLength).toBeGreaterThan(0)
    }
  })

  it('binds every workflow to the shared evidence-record contract', () => {
    runPackager()
    const entries = unzipSync(readFileSync(ZIP))
    const decoder = new TextDecoder()
    const requiredHeadings = [
      '## Purpose',
      '## Inputs',
      '## Evidence boundary',
      '## Procedure',
      '## Output contract',
      '## Evidence record',
      '## Fail-closed conditions',
      '## Verification checklist',
    ]
    const requiredFields = [
      '`workflow_id`',
      '`page_url`',
      '`observed_at`',
      '`selector`',
      '`observation`',
      '`interpretation`',
      '`confidence`',
      '`status`',
    ]

    for (const relative of EXPECTED_ENTRIES.filter((entry) => entry.startsWith('workflows/'))) {
      const markdown = decoder.decode(entries[relative])
      for (const heading of requiredHeadings) expect(markdown).toContain(heading)
      for (const field of requiredFields) expect(markdown).toContain(field)
      expect(markdown).toContain('../evidence-record.schema.json')
    }

    const allText = Object.entries(entries)
      .filter(([relative]) => relative.endsWith('.md'))
      .map(([, bytes]) => decoder.decode(bytes).toLowerCase())
      .join('\n')
    for (const unsupported of ['fixes 80%', 'guaranteed conversion', 'replacement for', 'fastest way', 'best tool']) {
      expect(allText).not.toContain(unsupported)
    }
  })

  it('writes a matching SHA-256 sidecar and identical bytes across builds', () => {
    runPackager()
    const first = readFileSync(ZIP)
    const firstDigest = createHash('sha256').update(first).digest('hex')

    runPackager()
    const second = readFileSync(ZIP)
    const secondDigest = createHash('sha256').update(second).digest('hex')
    const sidecar = readFileSync(`${ZIP}.sha256`, 'utf8')

    expect(secondDigest).toBe(firstDigest)
    expect(sidecar).toBe(`${secondDigest}  nebula-landing-page-intelligence-stack-v1.zip\n`)
  })

  it('detects projection drift without overwriting the stale projection', () => {
    const fixtureRoot = mkdtempSync(path.join(tmpdir(), 'nebula-intelligence-stack-'))
    const sourceDir = path.join(fixtureRoot, 'source')
    const outputDir = path.join(fixtureRoot, 'output')
    cpSync(path.join(ROOT, 'content', 'landing-page-intelligence-stack'), sourceDir, { recursive: true })

    try {
      runPackager([], { STACK_SOURCE_DIR: sourceDir, STACK_OUTPUT_DIR: outputDir })
      const fixtureZip = path.join(outputDir, 'nebula-landing-page-intelligence-stack-v1.zip')
      const staleBytes = readFileSync(fixtureZip)
      writeFileSync(path.join(sourceDir, 'README.md'), '# Changed fixture\n')

      expect(() => runPackager(['--check'], {
        STACK_SOURCE_DIR: sourceDir,
        STACK_OUTPUT_DIR: outputDir,
      })).toThrow()
      expect(readFileSync(fixtureZip)).toEqual(staleBytes)
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true })
    }
  })

  it.each([
    ['unsupported version', (sourceDir: string) => updateManifest(sourceDir, (manifest) => { manifest.version = 2 })],
    ['unknown root key', (sourceDir: string) => updateManifest(sourceDir, (manifest) => { manifest.extra = true })],
    ['files is not an array', (sourceDir: string) => updateManifest(sourceDir, (manifest) => { manifest.files = {} })],
    ['duplicate path', (sourceDir: string) => updateManifest(sourceDir, (manifest) => {
      const files = manifest.files as unknown[]
      manifest.files = [...files, files[0]]
    })],
    ['unsorted paths', (sourceDir: string) => updateManifest(sourceDir, (manifest) => {
      manifest.files = [...(manifest.files as unknown[])].reverse()
    })],
    ['parent traversal', (sourceDir: string) => updateManifest(sourceDir, (manifest) => {
      manifest.files = ['../escape.md']
    })],
    ['absolute path', (sourceDir: string) => updateManifest(sourceDir, (manifest) => {
      manifest.files = ['/absolute.md']
    })],
    ['backslash path', (sourceDir: string) => updateManifest(sourceDir, (manifest) => {
      manifest.files = ['workflows\\escape.md']
    })],
    ['empty path', (sourceDir: string) => updateManifest(sourceDir, (manifest) => { manifest.files = [''] })],
    ['null path', (sourceDir: string) => updateManifest(sourceDir, (manifest) => { manifest.files = [null] })],
    ['false path', (sourceDir: string) => updateManifest(sourceDir, (manifest) => { manifest.files = [false] })],
    ['zero path', (sourceDir: string) => updateManifest(sourceDir, (manifest) => { manifest.files = [0] })],
    ['object path', (sourceDir: string) => updateManifest(sourceDir, (manifest) => { manifest.files = [{}] })],
    ['array path', (sourceDir: string) => updateManifest(sourceDir, (manifest) => { manifest.files = [[]] })],
    ['missing file', (sourceDir: string) => updateManifest(sourceDir, (manifest) => {
      manifest.files = [...(manifest.files as unknown[]), 'missing.md'].sort()
    })],
    ['manifest omitted from files', (sourceDir: string) => updateManifest(sourceDir, (manifest) => {
      manifest.files = (manifest.files as unknown[]).filter((entry) => entry !== 'manifest.json')
    })],
  ] as Array<[string, (sourceDir: string) => void]>)('rejects malformed manifest: %s', (_label, mutate) => {
    expectFixtureRejected(mutate)
  })

  it('rejects malformed manifest JSON', () => {
    expectFixtureRejected((sourceDir) => {
      writeFileSync(path.join(sourceDir, 'manifest.json'), '{not-json')
    })
  })

  it('rejects undeclared source files', () => {
    expectFixtureRejected((sourceDir) => {
      writeFileSync(path.join(sourceDir, 'undeclared.md'), '# Undeclared\n')
    })
  })

  it('rejects symlinked source files', () => {
    expectFixtureRejected((sourceDir) => {
      const readme = path.join(sourceDir, 'README.md')
      unlinkSync(readme)
      symlinkSync('/etc/hosts', readme)
    })
  })
})
