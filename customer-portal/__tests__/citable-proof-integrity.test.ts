/** @jest-environment node */

import { execFileSync, spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import packageManifest from '@/package.json'
import proofProjection from '@/data/public-proof.generated.json'
import {
  getPublishedBenchmarks,
  getPublishedCaseStudies,
} from '@/app/lib/public-facts'
import { generateStaticParams } from '@/app/case-studies/[slug]/page'
import sitemap from '@/app/sitemap'

const root = process.cwd()
const compiler = path.join(root, 'scripts/compile-public-proof.mjs')

type JsonRecord = Record<string, any>

const governedClaims = {
  entries: [
    {
      claim_id: 'claim-supported-proof',
      claim: 'A bounded governed outcome was observed.',
      status: 'verified',
      expires: '2026-12-31',
      evidence: ['evidence-supported-proof'],
      support_assessment: { status: 'directly_supported' },
    },
  ],
}

const governedEvidence = {
  entries: [
    {
      evidence_id: 'evidence-supported-proof',
      verification_status: 'reviewed',
      valid_until: '2026-12-31',
    },
  ],
}

const validCase = {
  type: 'case',
  slug: 'supported-case',
  claimId: 'claim-supported-proof',
  evidenceIds: ['evidence-supported-proof'],
  title: 'Supported case',
  eyebrow: 'Evidence-backed case',
  description: 'A bounded, fully governed case record.',
  outcome: 'Observed change',
  outcomeLabel: 'Measured during the stated window',
  situation: 'The documented starting state.',
  diagnosis: 'The evidenced finding.',
  fixes: ['The documented remediation.'],
  result: 'The observed result without a causal guarantee.',
  methodology: 'Compared the declared metric over the stated measurement window.',
  measurementWindow: {
    startedAt: '2026-06-01',
    endedAt: '2026-06-30',
  },
  sourceArtifactUrl: 'https://nebulacomponents.com/evidence/supported-case',
  disclosure: 'Nebula audited the page; the customer implemented the change.',
  publicationPermission: {
    granted: true,
    grantedAt: '2026-07-01',
  },
  review: {
    status: 'approved',
    reviewedAt: '2026-07-02',
    expiresAt: '2026-12-31',
  },
  publishedAt: '2026-07-15',
  modifiedAt: '2026-07-15',
}

const validBenchmark = {
  type: 'benchmark',
  slug: 'supported-benchmark',
  claimId: 'claim-supported-proof',
  evidenceIds: ['evidence-supported-proof'],
  title: 'Supported benchmark',
  description: 'A bounded, fully governed benchmark record.',
  outcome: 'Observed benchmark result',
  outcomeLabel: 'Measured during the stated window',
  methodology: 'Applied the declared protocol to the documented sample.',
  measurementWindow: {
    startedAt: '2026-05-01',
    endedAt: '2026-05-31',
  },
  sourceArtifactUrl: 'https://nebulacomponents.com/evidence/supported-benchmark',
  disclosure: 'Nebula authored and reviewed the benchmark.',
  publicationPermission: {
    granted: true,
    grantedAt: '2026-07-01',
  },
  review: {
    status: 'approved',
    reviewedAt: '2026-07-02',
    expiresAt: '2026-12-31',
  },
  publishedAt: '2026-07-15',
  modifiedAt: '2026-07-15',
}

function compileFixture(
  entries: JsonRecord[],
  options: {
    claims?: JsonRecord
    evidence?: JsonRecord
    asOf?: string
    at?: string
    check?: boolean
    mutateOutput?: (outputPath: string) => void
  } = {},
) {
  const fixture = mkdtempSync(path.join(tmpdir(), 'public-proof-'))
  const claimsPath = path.join(fixture, 'claims.json')
  const evidencePath = path.join(fixture, 'evidence.json')
  const surfacesPath = path.join(fixture, 'surfaces.json')
  const outputPath = path.join(fixture, 'generated.json')

  writeFileSync(claimsPath, JSON.stringify(options.claims ?? governedClaims))
  writeFileSync(evidencePath, JSON.stringify(options.evidence ?? governedEvidence))
  writeFileSync(surfacesPath, JSON.stringify({
    version: 1,
    asOf: options.asOf ?? '2026-07-26',
    entries,
  }))

  const args = [
    compiler,
    '--at', options.at ?? '2026-07-26',
    '--claims', claimsPath,
    '--evidence', evidencePath,
    '--surfaces', surfacesPath,
    '--output', outputPath,
  ]

  try {
    execFileSync('node', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    options.mutateOutput?.(outputPath)

    const checkResult = options.check
      ? spawnSync('node', [...args, '--check'], {
          cwd: root,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      : undefined

    return {
      projection: JSON.parse(readFileSync(outputPath, 'utf8')),
      checkResult,
    }
  } finally {
    rmSync(fixture, { recursive: true, force: true })
  }
}

describe('evidence-gated public proof projection', () => {
  test('keeps the committed case and benchmark inventories empty', async () => {
    expect(proofProjection.cases).toEqual([])
    expect(proofProjection.benchmarks).toEqual([])
    expect(getPublishedCaseStudies()).toEqual([])
    expect(getPublishedBenchmarks()).toEqual([])
    expect(generateStaticParams()).toEqual([])
    expect((await sitemap()).filter(({ url }) => url.includes('/case-studies/'))).toEqual([])
  })

  test('publishes fully governed cases and benchmarks in deterministic slug order', () => {
    const { projection } = compileFixture([
      validBenchmark,
      validCase,
      { ...validCase, slug: 'another-supported-case', title: 'Another supported case' },
    ])

    expect(projection.cases.map(({ slug }: { slug: string }) => slug)).toEqual([
      'another-supported-case',
      'supported-case',
    ])
    expect(projection.benchmarks.map(({ slug }: { slug: string }) => slug)).toEqual([
      'supported-benchmark',
    ])
    expect(projection.omissions).toEqual([])
    expect(projection.cases[1]).toMatchObject({
      claimId: 'claim-supported-proof',
      evidenceIds: ['evidence-supported-proof'],
      methodology: validCase.methodology,
      evidenceUrl: validCase.sourceArtifactUrl,
      review: validCase.review,
      validUntil: '2026-12-31',
    })
  })

  test.each([
    ['missing evidence IDs', (entry: JsonRecord) => { entry.evidenceIds = [] }, 'missing_evidence'],
    ['unknown claim', (entry: JsonRecord) => { entry.claimId = 'claim-unknown' }, 'missing_claim:claim-unknown'],
    ['unknown evidence', (entry: JsonRecord) => { entry.evidenceIds = ['evidence-unknown'] }, 'missing_evidence:evidence-unknown'],
    ['unreferenced evidence', (entry: JsonRecord) => { entry.evidenceIds = ['evidence-supported-proof', 'evidence-unknown'] }, 'missing_evidence:evidence-unknown'],
    ['expired review', (entry: JsonRecord) => { entry.review.expiresAt = '2026-07-25' }, 'review_expired:2026-07-25'],
    ['missing methodology', (entry: JsonRecord) => { entry.methodology = '' }, 'missing_methodology'],
    ['missing measurement window', (entry: JsonRecord) => { delete entry.measurementWindow }, 'missing_measurement_window'],
    ['reversed measurement window', (entry: JsonRecord) => {
      entry.measurementWindow = { startedAt: '2026-06-30', endedAt: '2026-06-01' }
    }, 'measurement_window_out_of_order'],
    ['future measurement window', (entry: JsonRecord) => {
      entry.measurementWindow = { startedAt: '2026-07-01', endedAt: '2026-07-27' }
    }, 'measurement_window_not_complete:2026-07-27'],
    ['missing source artifact', (entry: JsonRecord) => { entry.sourceArtifactUrl = '' }, 'missing_source_artifact'],
    ['non-HTTPS source artifact', (entry: JsonRecord) => {
      entry.sourceArtifactUrl = 'http://example.com/evidence'
    }, 'source_artifact_not_https'],
    ['missing disclosure', (entry: JsonRecord) => { entry.disclosure = '' }, 'missing_disclosure'],
    ['missing publication permission', (entry: JsonRecord) => {
      entry.publicationPermission.granted = false
    }, 'publication_permission_not_granted'],
    ['future publication date', (entry: JsonRecord) => {
      entry.publishedAt = '2026-07-27'
      entry.modifiedAt = '2026-07-27'
    }, 'publication_not_effective:2026-07-27'],
    ['future modification date', (entry: JsonRecord) => {
      entry.modifiedAt = '2026-07-27'
    }, 'modification_not_effective:2026-07-27'],
    ['invalid declared type', (entry: JsonRecord) => { entry.type = 'testimonial' }, 'invalid_type:testimonial'],
    ['invalid declared slug', (entry: JsonRecord) => { entry.slug = 'Invalid Slug' }, 'invalid_slug:Invalid Slug'],
  ])('omits a case with %s and emits a stable diagnostic', (_label, mutate, reason) => {
    const entry = structuredClone(validCase) as JsonRecord
    mutate(entry)

    const { projection } = compileFixture([entry])

    expect(projection.cases).toEqual([])
    expect(projection.benchmarks).toEqual([])
    expect(projection.omissions).toHaveLength(1)
    expect(projection.omissions[0].reasons).toContain(reason)
  })

  test.each([
    ['unsupported claim status', {
      claims: {
        entries: [{
          ...governedClaims.entries[0],
          status: 'retired',
        }],
      },
      evidence: governedEvidence,
      reason: 'claim_status:retired',
    }],
    ['unsupported evidence state', {
      claims: governedClaims,
      evidence: {
        entries: [{
          ...governedEvidence.entries[0],
          verification_status: 'stale',
        }],
      },
      reason: 'evidence_status:evidence-supported-proof:stale',
    }],
    ['expired evidence', {
      claims: governedClaims,
      evidence: {
        entries: [{
          ...governedEvidence.entries[0],
          valid_until: '2026-07-25',
        }],
      },
      reason: 'evidence_expired:evidence-supported-proof:2026-07-25',
    }],
  ])('omits proof with %s', (_label, fixture) => {
    const { projection } = compileFixture([validCase], fixture)

    expect(projection.cases).toEqual([])
    expect(projection.omissions[0].reasons).toContain(fixture.reason)
  })

  test('rejects duplicate slugs across public proof types', () => {
    expect(() => compileFixture([
      validCase,
      { ...validBenchmark, slug: validCase.slug },
    ])).toThrow(/Duplicate public proof slug: supported-case/)
  })

  test('uses an explicit deterministic clock and detects projection drift', () => {
    const current = compileFixture([validCase], { check: true })
    expect(current.projection.asOf).toBe('2026-07-26')
    expect(current.checkResult?.status).toBe(0)

    const drifted = compileFixture([validCase], {
      check: true,
      mutateOutput: (outputPath) => writeFileSync(outputPath, '{}\n'),
    })
    expect(drifted.checkResult?.status).toBe(1)
    expect(drifted.checkResult?.stderr).toContain('Public proof projection drift')
  })

  test('treats registry asOf as provenance and evaluates expiry at the supplied clock', () => {
    const { projection } = compileFixture([validCase], {
      asOf: '2026-07-01',
      at: '2027-01-01',
    })

    expect(projection.asOf).toBe('2026-07-01')
    expect(projection.cases).toEqual([])
    expect(projection.omissions[0].reasons).toEqual(expect.arrayContaining([
      'claim_expired:2026-12-31',
      'evidence_expired:evidence-supported-proof:2026-12-31',
      'review_expired:2026-12-31',
    ]))
    expect(projection).not.toHaveProperty('evaluatedAt')
  })

  test('rejects registry provenance dated after the evaluation clock', () => {
    expect(() => compileFixture([validCase], {
      asOf: '2026-07-27',
      at: '2026-07-26',
    })).toThrow(/asOf date 2026-07-27 is after evaluation date 2026-07-26/)
  })

  test('keeps generated proof as the only runtime case authority', () => {
    const publicFactsSource = readFileSync(
      path.join(root, 'app/lib/public-facts.ts'),
      'utf8',
    )
    expect(publicFactsSource).toContain(
      "import publicProofProjection from '../../data/public-proof.generated.json'",
    )
    expect(publicFactsSource).not.toMatch(/caseStudies:\s*\{[\s\S]*?entries:\s*\[\]/)

    for (const relative of [
      'app/case-studies/page.tsx',
      'app/case-studies/[slug]/page.tsx',
      'app/sitemap.ts',
    ]) {
      expect(readFileSync(path.join(root, relative), 'utf8'))
        .toContain("from '@/app/lib/public-facts'")
    }

    const detailSource = readFileSync(
      path.join(root, 'app/case-studies/[slug]/page.tsx'),
      'utf8',
    )
    expect(detailSource).not.toMatch(
      /const\s+caseStudies\s*=\s*getPublishedCaseStudies\(\)/,
    )
  })

  test('renders every proof-bearing route dynamically so expired proof is never served stale', () => {
    for (const relative of [
      'app/case-studies/page.tsx',
      'app/case-studies/[slug]/page.tsx',
      'app/sitemap.ts',
      'app/resources/citable/page.tsx',
      'app/resources/citable/quick-start/page.tsx',
      'app/resources/citable/jobs/[slug]/page.tsx',
      'app/resources/citable/compare/page.tsx',
      'app/resources/citable/releases/page.tsx',
    ]) {
      expect(readFileSync(path.join(root, relative), 'utf8')).toContain(
        "export const dynamic = 'force-dynamic'",
      )
    }
  })

  test('adds the deterministic drift gate to package scripts and root CI', () => {
    const scripts = packageManifest.scripts as Record<string, string>
    expect(scripts['compile:public-proof']).toBe('node scripts/compile-public-proof.mjs')
    expect(scripts['check:public-proof']).toBe(
      'node scripts/compile-public-proof.mjs --check',
    )
    expect(scripts.ci).toContain('npm run check:public-proof')

    const workflow = readFileSync(
      path.join(root, '../.github/workflows/ci.yml'),
      'utf8',
    )
    expect(workflow).toContain('npm run check:public-proof')
  })

  test('does not create a thin benchmark route', () => {
    const content = readFileSync(path.join(root, 'app/benchmarks/page.tsx'), 'utf8')
    // Page must render the Benchmarks component (with or without props)
    expect(content).toMatch(/<Benchmarks(\s[^>]*)?\s*\/>/)
  })
})
