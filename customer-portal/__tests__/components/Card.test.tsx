import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui/Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('applies variant styles', () => {
    const { rerender, container } = render(<Card variant="default">Default</Card>)
    expect(container.firstChild).toHaveClass('bg-bg-panel')

    rerender(<Card variant="elevated">Elevated</Card>)
    expect(container.firstChild).toHaveClass('shadow-glow')

    rerender(<Card variant="bordered">Bordered</Card>)
    expect(container.firstChild).toHaveClass('border')
  })

  it('applies padding styles', () => {
    const { rerender, container } = render(<Card padding="none">No padding</Card>)
    expect(container.firstChild).toHaveClass('p-0')

    rerender(<Card padding="lg">Large padding</Card>)
    expect(container.firstChild).toHaveClass('p-8')
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Custom</Card>)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
