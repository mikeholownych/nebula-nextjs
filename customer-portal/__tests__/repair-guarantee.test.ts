import { REPAIR_GUARANTEE, EARLY_STAGE_DISCLOSURE } from '@/config/repair-guarantee'

describe('Repair Guarantee', () => {
  it('has a title', () => {
    expect(REPAIR_GUARANTEE.title).toBe('Repair Guarantee')
  })

  it('does not promise conversion lift (only disclaims it)', () => {
    const statement = REPAIR_GUARANTEE.statement.toLowerCase()
    expect(statement).not.toContain('guarantee conversion lift')
    expect(statement).not.toContain('guarantee revenue')
    expect(statement).not.toContain('will increase conversions')
  })

  it('covers refund case', () => {
    expect(REPAIR_GUARANTEE.statement.toLowerCase()).toContain('refund')
  })

  it('covers revision case', () => {
    expect(REPAIR_GUARANTEE.statement.toLowerCase()).toContain('revise')
  })

  it('has reasonable exclusions (between 3 and 10)', () => {
    expect(REPAIR_GUARANTEE.exclusions.length).toBeGreaterThanOrEqual(3)
    expect(REPAIR_GUARANTEE.exclusions.length).toBeLessThanOrEqual(10)
  })

  it('evidence boundary explicitly disclaims business outcomes', () => {
    expect(REPAIR_GUARANTEE.evidenceBoundary.toLowerCase()).toContain('does not guarantee')
  })
})

describe('Early Stage Disclosure', () => {
  it('acknowledges no paid-client outcomes yet', () => {
    expect(EARLY_STAGE_DISCLOSURE.toLowerCase()).toContain('does not yet publish')
  })

  it('describes what IS sold', () => {
    expect(EARLY_STAGE_DISCLOSURE.toLowerCase()).toContain('bounded deliverable')
  })
})
