/** @jest-environment jsdom */
/**
 * Render smoke: an invalid/expired audit (HTTP 404 from the status endpoint)
 * must land the visitor on a human-readable terminal state instead of
 * spinning forever (production defect D2).
 *
 * Only the 404 path is rendered here - it resolves on the first immediate
 * poll, avoiding the deferred-commit unreliability this jsdom environment
 * exhibits for late single updates. The full state machine is covered
 * deterministically in audit-status-poller.test.ts.
 */
import { render, screen, act } from '@testing-library/react'

const AUDIT_ID = '123e4567-e89b-12d3-a456-426614174000'

const pushMock = jest.fn()

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: AUDIT_ID }),
  useRouter: () => ({ push: pushMock }),
}))

jest.mock('@/app/lib/posthog-browser', () => ({
  default: {
    capture: jest.fn(),
    captureException: jest.fn(),
    identify: jest.fn(),
  },
}))

jest.mock('@/app/audit/_lib/view-transition', () => ({
  pushWithViewTransition: jest.fn(),
}))

beforeAll(() => {
  global.fetch = ((input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/api/auth/me')) {
      return Promise.resolve(new Response(null, { status: 401 }))
    }
    if (url.includes(`/api/audit/${AUDIT_ID}/status`)) {
      return Promise.resolve(
        new Response(JSON.stringify({ error: 'Audit not found' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        }),
      )
    }
    return Promise.resolve(new Response(null, { status: 404 }))
  }) as typeof fetch
})

beforeEach(() => {
  pushMock.mockReset()
})

it('renders the terminal not-found state with a recovery action', async () => {
  const ProcessingPage = (await import('@/app/audit/[id]/processing/page')).default
  render(<ProcessingPage />)

  await act(async () => {
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 20))
    await Promise.resolve()
  })

  expect(screen.getByText('Audit Not Found')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /run a new audit/i })).toBeInTheDocument()
})
