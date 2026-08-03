import { scorecardFaqItems } from './scorecardFaq'

describe('scorecardFaqItems', () => {
  test('has four bounded answer-first entries', () => {
    expect(scorecardFaqItems).toHaveLength(4)
    for (const item of scorecardFaqItems) {
      expect(item.question.length).toBeGreaterThan(20)
      expect(item.answer.length).toBeGreaterThan(80)
      expect(item.answer).not.toMatch(/guarantee|will increase|proves? conversion/i)
    }
  })
})
