import { NextResponse } from 'next/server'
import { sendEmail, createDripCampaign, triggerDripCampaign, getEmailStats } from '@/app/lib/email-automation'

export async function POST(request: Request) {
  const body = await request.json()
  const { action, emailData, campaignData, customerId, campaignId, triggerType } = body

  try {
    let result

    if (action === 'send') {
      if (!emailData) {
        return NextResponse.json(
          { error: 'emailData required for send action' },
          { status: 400 }
        )
      }
      result = await sendEmail(emailData)
    } else if (action === 'create') {
      if (!campaignData) {
        return NextResponse.json(
          { error: 'campaignData required for create action' },
          { status: 400 }
        )
      }
      result = await createDripCampaign(campaignData)
    } else if (action === 'trigger') {
      if (!customerId || !campaignId) {
        return NextResponse.json(
          { error: 'customerId and campaignId required for trigger action' },
          { status: 400 }
        )
      }
      result = await triggerDripCampaign(customerId, campaignId, triggerType || 'manual')
    } else if (action === 'stats') {
      result = await getEmailStats(body.campaignId)
    } else {
      return NextResponse.json(
        { error: 'Action must be "send", "create", "trigger", or "stats"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
