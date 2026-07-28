import { execSync } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

function getRevision() {
  try {
    return process.env.BUILD_REVISION || execSync('git rev-parse HEAD', { cwd: rootDir, encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

const revision = getRevision()
const builtAt = process.env.BUILD_TIME || new Date().toISOString()

const buildInfo = {
  revision,
  builtAt,
}

const targetPath = join(rootDir, 'app', 'lib', 'build-info.json')
mkdirSync(dirname(targetPath), { recursive: true })
writeFileSync(targetPath, JSON.stringify(buildInfo, null, 2))
console.log(`[build-info] Generated build-info.json: ${revision} at ${builtAt}`)
