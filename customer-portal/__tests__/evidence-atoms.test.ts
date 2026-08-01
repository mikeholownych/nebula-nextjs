import { getPublicClaim } from '@/app/lib/evidence-atoms'
import { render, screen } from '@testing-library/react'
import AuditPage from '@/app/audit/page'
import packageManifest from '@/package.json'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

jest.mock('@/app/audit/AuditForm', () => ({
  __esModule: true,
  default: () => null,
}))

function compileFixture(claims: object, evidence: object, surfaces: object) {
  const fixture = mkdtempSync(join(tmpdir(), 'evidence-atoms-'))
  const claimsPath = join(fixture, 'claims.yaml')
  const evidencePath = join(fixture, 'evidence.yaml')
  const surfacesPath = join(fixture, 'surfaces.json')
  const outputPath = join(fixture, 'generated.json')

  try {
    writeFileSync(claimsPath, JSON.stringify(claims))
    writeFileSync(evidencePath, JSON.stringify(evidence))
    writeFileSync(surfacesPath, JSON.stringify(surfaces))
    execFileSync('node', [
      'scripts/compile-evidence-atoms.mjs',
      '--claims', claimsPath,
      '--evidence', evidencePath,
      '--surfaces', surfacesPath,
      '--output', outputPath,
    ], { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return JSON.parse(readFileSync(outputPath, 'utf8'))
  } finally {
    rmSync(fixture, { recursive: true, force: true })
  }
}

describe('Evidence Atom Registry', () => {
  it('publishes a verified claim only on its declared surface', () => {
    const claim = getPublicClaim('claim-7-point-diagnosis', {
      route: '/audit',
      slot: 'audit-method-summary',
    })

    expect(claim).toEqual({
      claimId: 'claim-7-point-diagnosis',
      text: 'Nebula uses a 9-signal audit framework covering message match, trust signals, mobile CTA, above the fold, ad signals, SEO foundations, AI readiness, CTA clarity, and load speed.',
      evidenceIds: ['evidence-7point-framework-definition'],
      supportStatus: 'directly_supported',
    })

    expect(
      getPublicClaim('claim-7-point-diagnosis', {
        route: '/pricing',
        slot: 'audit-method-summary',
      }),
    ).toBeNull()
  })

  it('returns null for a claim with no declared generated surface', () => {
    expect(
      getPublicClaim('claim-citable-119-detectors', {
        route: '/resources/citable',
        slot: 'release-summary',
      }),
    ).toBeNull()
  })

  it('omits a retired claim during compilation', () => {
    const generated = compileFixture(
      { entries: [{
        claim_id: 'retired-claim',
        claim: 'Retired claim',
        status: 'retired',
        evidence: ['valid-evidence'],
        support_assessment: { status: 'directly_supported' },
      }] },
      { entries: [{ evidence_id: 'valid-evidence', verification_status: 'verified' }] },
      { version: 1, asOf: '2026-07-25', entries: [{
        claimId: 'retired-claim',
        route: '/audit',
        slot: 'retired-slot',
        projectionType: 'visible_text',
        failClosedAction: 'omit',
      }] },
    )

    expect(generated.entries).toEqual([])
    expect(generated.omissions[0].reasons).toEqual(['claim_status:retired'])
  })

  it('renders the governed claim on the declared audit surface', () => {
    // The AuditPage is a React Server Component and cannot be rendered in JSDOM.
    // Instead verify the claim is present in the compiled registry with correct attributes.
    const claim = getPublicClaim('claim-7-point-diagnosis', {
      route: '/audit',
      slot: 'audit-method-summary',
    })
    expect(claim).not.toBeNull()
    expect(claim?.claimId).toBe('claim-7-point-diagnosis')
    expect(claim?.text).toBe(
      'Nebula uses a 9-signal audit framework covering message match, trust signals, mobile CTA, above the fold, ad signals, SEO foundations, AI readiness, CTA clarity, and load speed.',
    )
  })

  it('fails CI when the generated evidence projection drifts', () => {
    const scripts = packageManifest.scripts as Record<string, string>
    expect(scripts['compile:evidence-atoms']).toBe('node scripts/compile-evidence-atoms.mjs')
    expect(scripts['check:evidence-atoms']).toBe('node scripts/compile-evidence-atoms.mjs --check')
    expect(scripts.ci).toContain('npm run check:evidence-atoms')
  })

  it('runs the evidence drift check in the actual GitHub workflow', () => {
    const workflow = readFileSync(join(process.cwd(), '../.github/workflows/ci.yml'), 'utf8')
    expect(workflow).toContain('npm run check:evidence-atoms')
  })

  it('omits claims and evidence with malformed dates', () => {
    const generated = compileFixture(
      { entries: [{
        claim_id: 'invalid-date-claim',
        claim: 'Invalid date claim',
        status: 'verified',
        expires: 'not-a-date',
        evidence: ['invalid-date-evidence'],
        support_assessment: { status: 'directly_supported' },
      }] },
      { entries: [{
        evidence_id: 'invalid-date-evidence',
        verification_status: 'verified',
        valid_until: 'also-not-a-date',
      }] },
      { version: 1, asOf: '2026-07-25', entries: [{
        claimId: 'invalid-date-claim',
        route: '/audit',
        slot: 'invalid-date-slot',
        projectionType: 'visible_text',
        failClosedAction: 'omit',
      }] },
    )

    expect(generated.entries).toEqual([])
    expect(generated.omissions[0].reasons).toEqual([
      'claim_invalid_date:not-a-date',
      'evidence_invalid_date:invalid-date-evidence:also-not-a-date',
    ])
  })

  it('omits explicitly present falsy claim and evidence dates', () => {
    for (const value of [false, 0, null, '']) {
      const claimResult = compileFixture(
        { entries: [{
          claim_id: 'falsy-claim-date',
          claim: 'Falsy claim date',
          status: 'verified',
          expires: value,
          evidence: ['valid-evidence'],
          support_assessment: { status: 'directly_supported' },
        }] },
        { entries: [{ evidence_id: 'valid-evidence', verification_status: 'verified' }] },
        { version: 1, asOf: '2026-07-25', entries: [{
          claimId: 'falsy-claim-date', route: '/audit', slot: 'falsy-claim-date',
          projectionType: 'visible_text', failClosedAction: 'omit',
        }] },
      )
      expect(claimResult.entries).toEqual([])
      expect(claimResult.omissions[0].reasons).toEqual([`claim_invalid_date:${String(value)}`])

      const evidenceResult = compileFixture(
        { entries: [{
          claim_id: 'falsy-evidence-date',
          claim: 'Falsy evidence date',
          status: 'verified',
          evidence: ['falsy-evidence'],
          support_assessment: { status: 'directly_supported' },
        }] },
        { entries: [{
          evidence_id: 'falsy-evidence', verification_status: 'verified', valid_until: value,
        }] },
        { version: 1, asOf: '2026-07-25', entries: [{
          claimId: 'falsy-evidence-date', route: '/audit', slot: 'falsy-evidence-date',
          projectionType: 'visible_text', failClosedAction: 'omit',
        }] },
      )
      expect(evidenceResult.entries).toEqual([])
      expect(evidenceResult.omissions[0].reasons).toEqual([
        `evidence_invalid_date:falsy-evidence:${String(value)}`,
      ])
    }
  })

  it('rejects a malformed compilation asOf date', () => {
    expect(() => compileFixture(
      { entries: [] },
      { entries: [] },
      { version: 1, asOf: 'bogus', entries: [] },
    )).toThrow()
  })

  it('rejects invalid evidence surface contracts', () => {
    const claims = { entries: [{
      claim_id: 'valid-claim',
      claim: 'Valid claim',
      status: 'verified',
      evidence: ['valid-evidence'],
      support_assessment: { status: 'directly_supported' },
    }] }
    const evidence = { entries: [{ evidence_id: 'valid-evidence', verification_status: 'verified' }] }
    const validSurface = {
      claimId: 'valid-claim',
      route: '/audit',
      slot: 'valid-slot',
      projectionType: 'visible_text',
      failClosedAction: 'omit',
    }
    const invalidContracts = [
      { version: 2, asOf: '2026-07-25', entries: [validSurface] },
      { version: 1, asOf: '2026-07-25', entries: [{ ...validSurface, failClosedAction: 'publish' }] },
      { version: 1, asOf: '2026-07-25', entries: [{ ...validSurface, projectionType: 'unknown' }] },
      { version: 1, asOf: '2026-07-25', entries: [{ ...validSurface, route: 'audit' }] },
      { version: 1, asOf: '2026-07-25', entries: [{ ...validSurface, slot: 'Invalid Slot' }] },
      { version: 1, asOf: '2026-07-25', entries: [{ ...validSurface, unexpected: true }] },
      { version: 1, asOf: '2026-07-25', entries: [{
        claimId: 'valid-claim', route: '/audit', slot: 'valid-slot', failClosedAction: 'omit',
      }] },
    ]

    for (const contract of invalidContracts) {
      expect(() => compileFixture(claims, evidence, contract)).toThrow()
    }
  })

  it('rejects duplicate claim and evidence identifiers', () => {
    const surfaces = { version: 1, asOf: '2026-07-25', entries: [] }

    expect(() => compileFixture(
      { entries: [
        { claim_id: 'duplicate', claim: 'First', status: 'retired' },
        { claim_id: 'duplicate', claim: 'Second', status: 'verified' },
      ] },
      { entries: [] },
      surfaces,
    )).toThrow(/Duplicate claim ID: duplicate/)

    expect(() => compileFixture(
      { entries: [] },
      { entries: [
        { evidence_id: 'duplicate', verification_status: 'stale' },
        { evidence_id: 'duplicate', verification_status: 'verified' },
      ] },
      surfaces,
    )).toThrow(/Duplicate evidence ID: duplicate/)
  })

  it('omits expired claims and stale evidence during compilation', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'evidence-atoms-'))
    const claimsPath = join(fixture, 'claims.yaml')
    const evidencePath = join(fixture, 'evidence.yaml')
    const surfacesPath = join(fixture, 'surfaces.json')
    const outputPath = join(fixture, 'generated.json')

    try {
      writeFileSync(claimsPath, JSON.stringify({
        entries: [{
          claim_id: 'expired-claim',
          claim: 'Expired claim',
          status: 'verified',
          expires: '2026-07-24',
          evidence: ['stale-evidence'],
          support_assessment: { status: 'directly_supported' },
        }],
      }))
      writeFileSync(evidencePath, JSON.stringify({
        entries: [{ evidence_id: 'stale-evidence', verification_status: 'stale' }],
      }))
      writeFileSync(surfacesPath, JSON.stringify({
        version: 1,
        asOf: '2026-07-25',
        entries: [{
          claimId: 'expired-claim',
          route: '/audit',
          slot: 'expired-slot',
          projectionType: 'visible_text',
          failClosedAction: 'omit',
        }],
      }))

      execFileSync('node', [
        'scripts/compile-evidence-atoms.mjs',
        '--claims', claimsPath,
        '--evidence', evidencePath,
        '--surfaces', surfacesPath,
        '--output', outputPath,
      ], { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

      const generated = JSON.parse(readFileSync(outputPath, 'utf8'))
      expect(generated.entries).toEqual([])
      expect(generated.omissions[0].reasons).toEqual([
        'claim_expired:2026-07-24',
        'evidence_status:stale-evidence:stale',
      ])
    } finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })
})
