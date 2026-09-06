import { render, screen } from '@testing-library/react'
import DifferentiationBlock from '@/components/DifferentiationBlock'

describe('DifferentiationBlock', () => {
  it('states the four factual differences without outcome promises', () => {
    render(<DifferentiationBlock />)

    expect(screen.getByRole('heading', { name: /how nebula differs/i })).toBeInTheDocument()
    expect(screen.getByText(/evidence-grade observation/i)).toBeInTheDocument()
    expect(screen.getByText(/does not promise conversion lift/i)).toBeInTheDocument()
    expect(screen.getByText(/same-condition re-audit/i)).toBeInTheDocument()
    expect(screen.getByText(/bounded \$97 repair sprint/i)).toBeInTheDocument()
    expect(screen.queryByText(/guaranteed conversion|increase revenue|best-in-class/i)).not.toBeInTheDocument()
  })
})
