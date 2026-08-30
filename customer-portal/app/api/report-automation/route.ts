import { NextResponse } from 'next/server'
import {
  generateAuditReport,
  emailReport,
  scheduleReportDelivery,
  triggerScheduledReports,
} from '@/app/lib/report-automation'
import { auditPool } from '@/app/lib/audit-db'

export async function POST(request: Request) {
  const body = await request.json()
  const { action, auditId, email, scheduleData } = body

  try {
    let result

    if (action === 'generate') {
      if (!auditId) {
        return NextResponse.json(
          { error: 'auditId required for generate action' },
          { status: 400 }
        )
      }
      result = await generateAuditReport(auditId)
    } else if (action === 'email') {
      if (!auditId || !email) {
        return NextResponse.json(
          { error: 'auditId and email required for email action' },
          { status: 400 }
        )
      }
      result = await emailReport(auditId, email, body.reportType)
    } else if (action === 'schedule') {
      if (!scheduleData) {
        return NextResponse.json(
          { error: 'scheduleData required for schedule action' },
          { status: 400 }
        )
      }
      result = await scheduleReportDelivery(scheduleData)
    } else if (action === 'trigger') {
      result = await triggerScheduledReports()
    } else {
      return NextResponse.json(
        { error: 'Action must be "generate", "email", "schedule", or "trigger"' },
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

export async function GET() {
  try {
    // Return stats about scheduled reports
    const result = await auditPool.query(`
      SELECT 
        COUNT(*) as total_schedules,
        COUNT(*) FILTER (WHERE is_enabled = true) as active_schedules,
        COUNT(*) FILTER (WHERE next_delivery <= NOW() AND is_enabled = true) as pending_deliveries
      FROM report_schedules
    `)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      totalSchedules: parseInt(result.rows[0].total_schedules),
      activeSchedules: parseInt(result.rows[0].active_schedules),
      pendingDeliveries: parseInt(result.rows[0].pending_deliveries),
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
