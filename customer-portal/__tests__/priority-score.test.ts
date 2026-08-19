import { PRIORITY_SCORE_DEFINITION, PRIORITY_SCORE_SHORT, PRIORITY_SCORE_TOOLTIP } from '@/config/priority-score'

describe('Priority Score Definition', () => {
  it('uses correct term name', () => {
    expect(PRIORITY_SCORE_DEFINITION.term).toBe('Priority Score')
  })

  it('has a defined scale', () => {
    expect(PRIORITY_SCORE_DEFINITION.scale).toBe('1–10')
  })

  it('does not claim to measure conversion lift', () => {
    const fullText = [
      PRIORITY_SCORE_DEFINITION.definition,
      PRIORITY_SCORE_SHORT,
      PRIORITY_SCORE_TOOLTIP,
    ].join(' ').toLowerCase()

    expect(fullText).not.toContain('guarantee')
    expect(fullText).not.toContain('will increase')
    expect(fullText).not.toContain('causes')
  })

  it('explicitly states what it is NOT', () => {
    expect(PRIORITY_SCORE_DEFINITION.notAMeasureOf).toContain('Conversion lift')
    expect(PRIORITY_SCORE_DEFINITION.notAMeasureOf).toContain('Revenue loss')
    expect(PRIORITY_SCORE_DEFINITION.notAMeasureOf).toContain('Business impact')
  })

  it('documents actual scoring factors', () => {
    expect(PRIORITY_SCORE_DEFINITION.factors.length).toBeGreaterThanOrEqual(2)
    for (const factor of PRIORITY_SCORE_DEFINITION.factors) {
      expect(factor.name).toBeTruthy()
      expect(factor.description).toBeTruthy()
    }
  })

  it('short definition mentions it is not a prediction', () => {
    expect(PRIORITY_SCORE_SHORT.toLowerCase()).toContain('not a prediction')
  })
})
