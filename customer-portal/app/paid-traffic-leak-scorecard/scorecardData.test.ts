import { scoreScorecard, scorecardQuestions } from './scorecardData'

describe('scoreScorecard', () => {
  test.each([
    [0, 'low'],
    [1, 'low'],
    [2, 'inspect'],
    [3, 'inspect'],
    [4, 'audit'],
    [7, 'audit'],
  ])('risk count %i maps to %s', (count, band) => {
    const answers = Object.fromEntries(
      scorecardQuestions.map((question, index) => [question.id, index >= count]),
    )
    const result = scoreScorecard(answers)
    expect(result.band).toBe(band)
    expect(result.riskCount).toBe(count)
  })

  test('every question has a risk explanation and next action', () => {
    for (const question of scorecardQuestions) {
      expect(question.riskExplanation.length).toBeGreaterThan(20)
      expect(question.nextAction.length).toBeGreaterThan(20)
    }
  })

  test('the result contains only failed questions as risks', () => {
    const answers = Object.fromEntries(
      scorecardQuestions.map((question, index) => [question.id, index !== 0]),
    )
    const result = scoreScorecard(answers)
    expect(result.risks).toHaveLength(1)
    expect(result.risks[0].questionId).toBe(scorecardQuestions[0].id)
  })
})
