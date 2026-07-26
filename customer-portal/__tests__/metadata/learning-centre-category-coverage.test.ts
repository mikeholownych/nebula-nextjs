import fs from 'fs'
import path from 'path'
import { getArticles } from '@/app/learning-centre/lib/getArticles'

describe('learning-centre category coverage', () => {
  it('has every article category listed in the index page categoryOrder, so no article is silently dropped from the hub', () => {
    // Regression guard: CategoryAccordion only renders an article if its
    // category exists as a key in `categories`, which is built from
    // page.tsx's local `categoryOrder` array. An article whose meta.json
    // category isn't in that array isn't hidden — it's never rendered
    // anywhere on the hub at all, with no error. This happened in practice
    // when founder-second-brain/linkedin-skill-engine/specialist-ai-agent-library
    // were given category "AI Ops Systems" and landing-page-intelligence-stack
    // was given "Conversion Systems", neither of which was in categoryOrder.
    const pageSource = fs.readFileSync(
      path.join(process.cwd(), 'app', 'learning-centre', 'page.tsx'),
      'utf8'
    )

    const categories = [...new Set(getArticles().map((a) => a.category))]
    const missing = categories.filter((category) => !pageSource.includes(`'${category}'`))

    expect(missing).toEqual([])
  })
})
