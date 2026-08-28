import { NextResponse } from 'next/server'
import {
  createWebhookIntegration,
  triggerWebhook,
  createZapierWebhook,
  getIntegrations,
  testWebhook,
} from '@/app/lib/integrations'

export async function POST(request: Request) {
  const body = await request.json()
  const { action, integrationData, zapierData, provider, event, payload, url } = body

  try {
    let result

    if (action === 'create') {
      if (!integrationData) {
        return NextResponse.json(
          { error: 'integrationData required for create action' },
          { status: 400 }
        )
      }
      result = await createWebhookIntegration(integrationData)
    } else if (action === 'zapier') {
      if (!zapierData) {
        return NextResponse.json(
          { error: 'zapierData required for zapier action' },
          { status: 400 }
        )
      }
      result = await createZapierWebhook(zapierData)
    } else if (action === 'trigger') {
      if (!provider || !event) {
        return NextResponse.json(
          { error: 'provider and event required for trigger action' },
          { status: 400 }
        )
      }
      const { success, messageId, error } = await triggerWebhook(provider, event, payload || {})
      result = { success, messageId, error }
    } else if (action === 'test') {
      if (!url) {
        return NextResponse.json(
          { error: 'url required for test action' },
          { status: 400 }
        )
      }
      result = await testWebhook(url, event)
    } else {
      return NextResponse.json(
        { error: 'Action must be "create", "zapier", "trigger", or "test"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { integrations } = await getIntegrations()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      integrations,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
