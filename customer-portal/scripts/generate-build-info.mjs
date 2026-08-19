import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

function getRevision() {
  if (process.env.BUILD_REVISION && /^[a-f0-9]{40}$/.test(process.env.BUILD_REVISION)) {
    return process.env.BUILD_REVISION
  }

  try {
    const rev = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: rootDir,
      encoding: 'utf8',
    }).trim()

    if (!/^[a-f0-9]{40}$/.test(rev)) {
      throw new Error(`Invalid Git revision output: "${rev}"`)
    }
    return rev
  } catch (err) {
    throw new Error(`Unable to generate a valid immutable build revision: ${err.message}`)
  }
}

const revision = getRevision()
const builtAt = process.env.BUILD_TIME || new Date().toISOString()
const environment = process.env.NODE_ENV || 'production'

const buildInfo = {
  revision,
  builtAt,
  environment,
  brandVersion: 2,
}

const targetPath = join(rootDir, 'app', 'lib', 'build-info.json')
mkdirSync(dirname(targetPath), { recursive: true })
writeFileSync(targetPath, JSON.stringify(buildInfo, null, 2) + '\n')
console.log(`[build-info] Generated immutable build-info.json: ${revision} (${environment}) at ${builtAt}`)
