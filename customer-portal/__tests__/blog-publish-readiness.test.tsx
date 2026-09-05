import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('blog publish readiness CI wiring', () => {
  it('runs local content readiness before build', () => {
    const pkg = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'))
    const ci = String(pkg.scripts.ci)
    expect(ci.indexOf('npm run check:blog-content')).toBeGreaterThanOrEqual(0)
    expect(ci.indexOf('npm run check:blog-content')).toBeLessThan(ci.indexOf('npm run build'))
  })

  it('keeps report-only execution local and analytics-free', () => {
    const scripts = ['create_draft.py', 'review_draft.py', 'apply_edits.py', 'publish_article.py']
      .map((name) => readFileSync(path.join(process.cwd(), '..', 'scripts', 'content_pipeline', name), 'utf8'))
      .join('\n')
    expect(scripts).not.toMatch(/posthog|analytics\.track|fetch\(/i)
    expect(scripts).toContain('--dry-run')
    expect(scripts).toContain('report-only')
  })
})
