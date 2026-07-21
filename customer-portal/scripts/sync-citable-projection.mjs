#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const args = new Set(process.argv.slice(2))
const check = args.has('--check')
const packageDirIndex = process.argv.indexOf('--package-dir')
const suppliedPackageDir = packageDirIndex >= 0 ? resolve(process.argv[packageDirIndex + 1]) : null

function read(file) {
  return readFileSync(file, 'utf8')
}

function npmPackageDir() {
  if (suppliedPackageDir) return { dir: suppliedPackageDir, cleanup: () => {} }
  const dir = mkdtempSync(join(tmpdir(), 'nebula-citable-projection-'))
  const packed = JSON.parse(execFileSync('npm', [
    'pack', '@nebulacomponents/citable@latest', '--json', '--pack-destination', dir,
  ], { encoding: 'utf8' }))[0]
  execFileSync('tar', ['-xzf', join(dir, packed.filename), '-C', dir])
  return { dir: join(dir, 'package'), cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

function releaseSection(changelog, version) {
  const escaped = version.replaceAll('.', '\\.')
  const match = changelog.match(new RegExp(`## ${escaped}[^\\n]*\\n([\\s\\S]*?)(?=\\n## \\d|$)`))
  if (!match) throw new Error(`CHANGELOG.md has no ${version} release section`)
  return match[1]
}

function bulletHighlights(section) {
  return [...section.matchAll(/^- ([^\n]+(?:\n {2}[^\n]+)*)/gm)]
    .map((match) => match[1].replace(/\n\s+/g, ' ').trim())
    .slice(0, 4)
}

function replaceOrFail(text, pattern, replacement, label) {
  if (!pattern.test(text)) throw new Error(`Cannot project ${label}; expected source pattern is missing`)
  return text.replace(pattern, replacement)
}

function projectedTextFiles(projection) {
  const llmsPath = join(root, 'public/llms.txt')
  const fullPath = join(root, 'public/llms-full.txt')
  let llms = read(llmsPath)
  llms = replaceOrFail(
    llms,
    /Citable v\d+\.\d+\.\d+: Evidence layer[^\n]*/,
    `Citable v${projection.version}: Evidence layer for SEO, AEO, and GEO audits. ${projection.detectorCount} detectors across ${projection.namespaceCount} namespaces and ${projection.registryCount} schema-validated registries (not all detectors are deterministic — each declares its determinism posture). Apache 2.0. npm: @nebulacomponents/citable`,
    'llms.txt Citable summary',
  )

  let full = read(fullPath)
  full = replaceOrFail(full, /- Version: \d+\.\d+\.\d+/, `- Version: ${projection.version}`, 'llms-full.txt version')
  full = replaceOrFail(
    full,
    /Citable runs \d+ detectors across \d+ namespaces[^\n]*/,
    `Citable runs ${projection.detectorCount} detectors across ${projection.namespaceCount} namespaces and ${projection.registryCount} schema-validated registries (not all detectors are deterministic — each declares its determinism posture explicitly):`,
    'llms-full.txt counts',
  )
  return new Map([[llmsPath, llms], [fullPath, full]])
}

const npmPackage = npmPackageDir()
try {
  const manifest = JSON.parse(read(join(npmPackage.dir, 'package.json')))
  const changelog = read(join(npmPackage.dir, 'CHANGELOG.md'))
  const registrySource = read(join(npmPackage.dir, 'src/registries/index.js'))
  const detectorDir = join(npmPackage.dir, 'src/detectors')
  const detectorSource = execFileSync('sh', ['-c', 'printf "%s\\0" "$1"/*.js | xargs -0 cat', 'sh', detectorDir], { encoding: 'utf8' })
  const detectorIds = new Set(detectorSource.match(/\b[A-Z]{2,}-\d{3}\b/g) ?? [])
  const namespaces = new Set([...detectorIds].map((id) => id.split('-')[0]))
  const registryCount = (registrySource.match(/\{\s*file:\s*['"]/g) ?? []).length
  const previousPath = join(root, 'data/citable-release.json')
  let previous = null
  try { previous = JSON.parse(read(previousPath)) } catch { /* first projection */ }
  const section = releaseSection(changelog, manifest.version)
  const projection = {
    package: manifest.name,
    version: manifest.version,
    releasedAt: manifest.version === previous?.version ? previous.releasedAt : new Date().toISOString().slice(0, 10),
    detectorCount: detectorIds.size,
    namespaceCount: namespaces.size,
    registryCount,
    nodeRequirement: manifest.engines?.node ?? null,
    license: manifest.license,
    source: `npm:${manifest.name}@${manifest.version}`,
    highlights: manifest.version === previous?.version && previous.highlights?.length
      ? previous.highlights
      : bulletHighlights(section),
  }
  if (!projection.detectorCount || !projection.namespaceCount || !projection.registryCount) {
    throw new Error('Published package projection produced an invalid zero count')
  }

  const expectedJson = `${JSON.stringify(projection, null, 2)}\n`
  const projectedFiles = projectedTextFiles(projection)
  const mismatches = []
  let currentJson = ''
  try { currentJson = read(previousPath) } catch { /* first projection */ }
  if (currentJson !== expectedJson) mismatches.push('data/citable-release.json')
  for (const [file, expected] of projectedFiles) if (read(file) !== expected) mismatches.push(file.slice(root.length + 1))

  if (check) {
    if (mismatches.length) {
      console.error(`Citable projection drift: ${mismatches.join(', ')}`)
      process.exitCode = 1
    } else {
      console.log(`Citable projection current: v${projection.version}`)
    }
  } else {
    mkdirSync(join(root, 'data'), { recursive: true })
    writeFileSync(previousPath, expectedJson)
    for (const [file, expected] of projectedFiles) writeFileSync(file, expected)
    console.log(`Projected ${projection.source}: ${projection.detectorCount} detectors, ${projection.namespaceCount} namespaces, ${projection.registryCount} registries`)
  }
} finally {
  npmPackage.cleanup()
}
