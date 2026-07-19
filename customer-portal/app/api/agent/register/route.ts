import { NextResponse } from 'next/server'

/**
 * Agent registration endpoint for Auth.md
 * Spec: https://workos.com/auth-md
 *
 * Nebula Components does not require OAuth credentials for public read access.
 * This endpoint documents the registration contract for agents requiring API or
 * webhook credentials.
 */

const REGISTRATION_INFO = {
  service: 'Nebula Components',
  url: 'https://nebulacomponents.shop',
  auth_required: false,
  public_endpoints: [
    { path: '/api/audit/run', method: 'POST', description: 'Run a landing page conversion audit' },
    { path: '/api/audit/results', method: 'GET', description: 'Retrieve audit results by run ID' },
    { path: '/llms.txt', method: 'GET', description: 'Machine-readable service description' },
    { path: '/llms-full.txt', method: 'GET', description: 'Full machine-readable service description' },
  ],
  credential_provisioning: {
    method: 'email',
    contact: 'nebulashop@agentmail.to',
    credential_types_supported: ['bearer_token'],
    scopes_supported: ['read', 'write'],
    note: 'Contact the above address to request API credentials for write-access endpoints.',
  },
  identity_types_supported: ['anonymous'],
  anonymous: {
    credential_types_supported: ['none'],
    note: 'All public endpoints accept unauthenticated requests.',
  },
}

export async function GET() {
  return NextResponse.json(REGISTRATION_INFO, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  })
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    // body is optional
  }

  // Log agent registration intent (no-op for now; extend to store in DB as needed)
  const agentId = (body.agent_id as string) || 'anonymous'
  const purpose = (body.purpose as string) || 'unspecified'

  return NextResponse.json(
    {
      status: 'received',
      message: 'Registration noted. No credentials required for public endpoints.',
      agent_id: agentId,
      purpose,
      next_steps: [
        'Use public endpoints without credentials.',
        'Contact nebulashop@agentmail.to for API key provisioning if write access is needed.',
      ],
      documentation: 'https://nebulacomponents.shop/auth.md',
    },
    { status: 201 }
  )
}
