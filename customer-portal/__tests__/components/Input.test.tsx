import { render, screen } from '@testing-library/react'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input id="test" label="Email Address" />)
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Input id="test" label="Email" error="Invalid email" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email')
  })

  it('shows helper text', () => {
    render(<Input id="test" helper="Enter your email" />)
    expect(screen.getByText('Enter your email')).toBeInTheDocument()
  })

  it('hides helper when error is present', () => {
    render(<Input id="test" helper="Helper text" error="Error message" />)
    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument()
  })

  it('applies error styling when error is present', () => {
    render(<Input id="test" error="Error" />)
    expect(screen.getByRole('textbox')).toHaveClass('border-danger')
  })

  it('supports required attribute', () => {
    render(<Input id="test" required />)
    expect(screen.getByRole('textbox')).toBeRequired()
  })
})
