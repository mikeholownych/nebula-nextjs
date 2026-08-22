import { readFileSync } from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('next.config TypeScript build gate', () => {
  it('does not ignore TypeScript errors during next build', () => {
    const source = readRepoFile('next.config.ts')

    expect(source).not.toMatch(/ignoreBuildErrors\s*:\s*true/)
    expect(source).toMatch(/ignoreBuildErrors\s*:\s*false/)
  })
})

describe('nested GitHub CI lint gate', () => {
  it('fails the job when lint fails', () => {
    // TD-14: nested customer-portal workflow removed; assert against the
    // repo-root CI (single source of truth) and its dedicated lint job.
    const source = readRepoFile('../.github/workflows/ci.yml')
    const workflow = YAML.parse(source) as {
      jobs?: Record<
        string,
        {
          name?: string
          steps?: Array<{ name?: string; run?: string }>
        }
      >
    }

    const lintJob = Object.values(workflow.jobs ?? {}).find(
      (job) => job.name === 'Lint & Typecheck'
    )

    expect(lintJob).toBeDefined()
    const runs = (lintJob?.steps ?? []).map((step) => step.run).join('\n')
    expect(runs).toContain('npm run lint')
    expect(runs).not.toContain('|| true')
    expect(runs).toContain('npm run typecheck')
    expect(source).not.toMatch(/npm run lint\s*\|\|\s*true/)
  })
})
