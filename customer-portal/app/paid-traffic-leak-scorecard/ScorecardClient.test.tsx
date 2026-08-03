import { fireEvent, render, screen } from '@testing-library/react'
import ScorecardClient from './ScorecardClient'
import { scorecardQuestions } from './scorecardData'

describe('ScorecardClient', () => {
  test('starts with the first question and advances through all seven', () => {
    render(<ScorecardClient />)

    expect(screen.getByRole('heading', { name: /paid-traffic leak scorecard/i })).toBeInTheDocument()

    for (const question of scorecardQuestions) {
      expect(screen.getByText(question.prompt)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: question.yesLabel }))
    }

    expect(screen.getByRole('heading', { name: /your scorecard result/i })).toBeInTheDocument()
    expect(screen.getByText(/0 risk signals/i)).toBeInTheDocument()
  })

  test('links results to the measured audit with source attribution', () => {
    render(<ScorecardClient />)

    for (const question of scorecardQuestions) {
      fireEvent.click(screen.getByRole('button', { name: question.noLabel }))
    }

    expect(screen.getByRole('link', { name: /run the free evidence-backed audit/i }))
      .toHaveAttribute('href', '/audit?source=paid-traffic-leak-scorecard')
    expect(screen.getByText(/self-assessment, not a measured audit/i)).toBeInTheDocument()
  })

  test('can go back one question without losing the answer', () => {
    render(<ScorecardClient />)
    fireEvent.click(screen.getByRole('button', { name: scorecardQuestions[0].yesLabel }))
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText(scorecardQuestions[0].prompt)).toBeInTheDocument()
  })
})
