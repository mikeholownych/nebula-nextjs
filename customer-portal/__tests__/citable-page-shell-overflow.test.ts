import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('CitablePageShell mobile overflow', () => {
  it('clips horizontal overflow on the page shell so 375px viewports cannot scroll sideways', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'components/citable/CitablePageShell.tsx'),
      'utf8',
    )
    expect(source).toMatch(/<main[^>]*overflow-x-clip/)
    expect(source).toMatch(/min-w-0/)
  })
})
