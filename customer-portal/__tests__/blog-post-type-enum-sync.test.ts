/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ACQUISITION_POST_TYPES } from '@/app/lib/blog/types'

const loaderSource = readFileSync(
  path.join(process.cwd(), 'app/lib/blog/loader.ts'),
  'utf8',
)

describe('blog post_type enum sync (deploy blocker)', () => {
  it('accepts problem_guide, which the content pipeline emits for acquisition content', () => {
    // scripts/content_pipeline/generate_brief.py defaults acquisition-lane
    // briefs to post_type "problem_guide". The loader enum must accept it or
    // every build that encounters such a draft fails with
    // "Unsupported post type: problem_guide".
    expect(ACQUISITION_POST_TYPES).toContain('problem_guide')
  })

  it('the loader validates post_type against the acquisition enum', () => {
    expect(loaderSource).toContain('ACQUISITION_POST_TYPES')
  })
})
