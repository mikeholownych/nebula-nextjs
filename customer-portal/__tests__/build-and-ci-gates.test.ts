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
    const source = readRepoFile('.github/workflows/ci.yml')
    const workflow = YAML.parse(source) as {
      jobs?: Record<
        string,
        {
          steps?: Array<{ name?: string; run?: string }>
        }
      >
    }
    const lintStep = workflow.jobs?.build?.steps?.find((step) => step.name === 'Lint')

    expect(lintStep).toBeDefined()
    expect(lintStep?.run).toBe('npm run lint')
    expect(lintStep?.run).not.toContain('|| true')
    expect(source).not.toMatch(/npm run lint\s*\|\|\s*true/)
  })
})
