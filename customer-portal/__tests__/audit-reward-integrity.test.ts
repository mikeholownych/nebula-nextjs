import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function source(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

describe('audit reward integrity', () => {
  it('processing page uses worker-state-driven messages, no synthetic timers', () => {
    const processing = source('app/audit/[id]/processing/page.tsx')
    // No synthetic time-based progress
    expect(processing).not.toContain('STATUS_MESSAGES')
    expect(processing).not.toContain('setInterval(')
    expect(processing).not.toContain('messageTimeouts')
    // Drives from real worker status
    expect(processing).toContain('WORKER_MESSAGES')
    expect(processing).toContain("pending: 'Audit accepted")
    expect(processing).toContain("running: 'Worker is analyzing")
    expect(processing).toContain('onProgress:')
  })

  it('processing page does not show fabricated numeric % progress', () => {
    const processing = source('app/audit/[id]/processing/page.tsx')
    expect(processing).not.toContain('% complete')
    expect(processing).not.toContain('effectiveProgress')
    expect(processing).not.toContain('scaleX(')
  })

  it('audit page does not fabricate live activity avatars or fallback counts', () => {
    const page = source('app/audit/page.tsx')
    expect(page).not.toContain("'147+'")
    expect(page).not.toContain('Live Audits')
    expect(page).not.toContain("initial: 'LC'")
    // Avatar grid comment removed
    expect(page).not.toContain('12-Avatar')
  })

  it('audit page stat block is gated on live data being present', () => {
    const page = source('app/audit/page.tsx')
    // Stats only rendered when API returns data
    expect(page).toContain('{stats && (')
    // No unconditional fallback count shown to users
    expect(page).not.toContain("?? '147+'")
    expect(page).not.toContain("?? '139+'")
    // stat_count only referenced directly (not with fallback)
    expect(page).toContain('{stats.audit_count}')
  })
})
