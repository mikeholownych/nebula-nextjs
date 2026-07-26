import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { zipSync } from 'fflate'

const ROOT = process.cwd()
const SOURCE_DIR = path.resolve(
  process.env.STACK_SOURCE_DIR || path.join(ROOT, 'content', 'landing-page-intelligence-stack'),
)
const OUTPUT_DIR = path.resolve(
  process.env.STACK_OUTPUT_DIR || path.join(ROOT, 'public', 'downloads'),
)
const ZIP_NAME = 'nebula-landing-page-intelligence-stack-v1.zip'
const ZIP_PATH = path.join(OUTPUT_DIR, ZIP_NAME)
const HASH_PATH = `${ZIP_PATH}.sha256`
const NORMALIZED_MTIME = new Date('1980-01-01T00:00:00.000Z')
const MANIFEST_KEYS = ['bundleId', 'files', 'release', 'version']
const EXPECTED_FILES = [
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

function assertEqualArrays(actual, expected, label) {
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    throw new Error(`${label} must match the canonical ordered list`)
  }
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Manifest root must be an object')
  }

  assertEqualArrays(Object.keys(manifest).sort(), MANIFEST_KEYS, 'Manifest keys')
  if (manifest.version !== 1) throw new Error('Manifest version must be 1')
  if (manifest.bundleId !== 'nebula-landing-page-intelligence-stack') {
    throw new Error('Manifest bundleId is unsupported')
  }
  if (manifest.release !== 'v1') throw new Error('Manifest release must be v1')
  if (!Array.isArray(manifest.files)) throw new Error('Manifest files must be an array')

  for (const relative of manifest.files) {
    if (
      typeof relative !== 'string'
      || relative.length === 0
      || relative.includes('\\')
      || path.posix.isAbsolute(relative)
      || path.posix.normalize(relative) !== relative
      || relative.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')
    ) {
      throw new Error('Manifest contains an unsafe file path')
    }
  }

  assertEqualArrays(manifest.files, [...manifest.files].sort(), 'Manifest files')
  if (new Set(manifest.files).size !== manifest.files.length) {
    throw new Error('Manifest files must be unique')
  }
  assertEqualArrays(manifest.files, EXPECTED_FILES, 'Manifest files')
}

async function listSourceFiles(directory, prefix = '') {
  const files = []
  const entries = await readdir(directory, { withFileTypes: true })

  for (const entry of entries.sort((left, right) => (
    left.name < right.name ? -1 : left.name > right.name ? 1 : 0
  ))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    const absolute = path.join(directory, entry.name)
    const stat = await lstat(absolute)

    if (stat.isSymbolicLink()) throw new Error(`Symlinked source entry is not allowed: ${relative}`)
    if (stat.isDirectory()) {
      files.push(...await listSourceFiles(absolute, relative))
    } else if (stat.isFile()) {
      files.push(relative)
    } else {
      throw new Error(`Unsupported source entry type: ${relative}`)
    }
  }

  return files
}

async function main() {
  const manifest = JSON.parse(await readFile(path.join(SOURCE_DIR, 'manifest.json'), 'utf8'))
  validateManifest(manifest)
  const sourceFiles = await listSourceFiles(SOURCE_DIR)
  assertEqualArrays(sourceFiles, manifest.files, 'Source files')

  const entries = {}
  for (const relative of manifest.files) {
    const absolute = path.resolve(SOURCE_DIR, relative)
    if (!absolute.startsWith(`${SOURCE_DIR}${path.sep}`)) {
      throw new Error(`Source path escapes the bundle root: ${relative}`)
    }
    const bytes = new Uint8Array(await readFile(absolute))
    if (bytes.byteLength === 0) throw new Error(`Source file must not be empty: ${relative}`)
    entries[relative] = [bytes, {
      level: 9,
      mtime: NORMALIZED_MTIME,
      os: 3,
      attrs: 0o644 << 16,
    }]
  }

  const zipBytes = zipSync(entries)
  const digest = createHash('sha256').update(zipBytes).digest('hex')
  const expectedSidecar = `${digest}  ${ZIP_NAME}\n`

  if (process.argv.includes('--check')) {
    try {
      const [committedZip, committedSidecar] = await Promise.all([
        readFile(ZIP_PATH),
        readFile(HASH_PATH, 'utf8'),
      ])
      if (!committedZip.equals(Buffer.from(zipBytes)) || committedSidecar !== expectedSidecar) {
        throw new Error('Landing page intelligence stack projection drift detected')
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Landing page intelligence stack projection drift detected') {
        throw error
      }
      throw new Error('Landing page intelligence stack projection drift detected')
    }
    console.log('Landing page intelligence stack projection is current')
    return
  }

  await mkdir(OUTPUT_DIR, { recursive: true })
  await writeFile(ZIP_PATH, zipBytes)
  await writeFile(HASH_PATH, expectedSidecar, 'utf8')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
