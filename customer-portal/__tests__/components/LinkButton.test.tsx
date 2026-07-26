import { render, screen } from '@testing-library/react'
import { LinkButton } from '@/components/ui/LinkButton'

describe('LinkButton', () => {
  it('renders a downloadable accessible anchor with stable caller props', () => {
    render(
      <LinkButton
        href="/downloads/example.zip"
        download
        data-testid="download-link"
        variant="primary"
        size="lg"
      >
        Download
      </LinkButton>,
    )

    const link = screen.getByRole('link', { name: 'Download' })
    expect(link).toHaveAttribute('href', '/downloads/example.zip')
    expect(link).toHaveAttribute('download')
    expect(link).toHaveAttribute('data-testid', 'download-link')
    expect(link).toHaveClass('bg-accent', 'px-8', 'py-4', 'focus-visible:ring-2')
  })
})
