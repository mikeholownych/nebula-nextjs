import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'
import { collectDefaultMetrics, Registry, Counter, Gauge } from 'prom-client'

// Prometheus registry and metrics
const registry = new Registry()
collectDefaultMetrics({ register: registry })

// Custom metrics
const auditsTotal = new Gauge({
  name: 'nebula_audits_total',
  help: 'Total number of audits',
  registers: [registry],
})

const auditsPending = new Gauge({
  name: 'nebula_audits_pending',
  help: 'Number of pending audits',
  registers: [registry],
})

const auditsCompleted24h = new Gauge({
  name: 'nebula_audits_completed_24h',
  help: 'Number of audits completed in the last 24 hours',
  registers: [registry],
})

const customersTotal = new Gauge({
  name: 'nebula_customers_total',
  help: 'Total number of customers',
  registers: [registry],
})

const activeMonitors = new Gauge({
  name: 'nebula_active_monitors',
  help: 'Number of active monitors',
  registers: [registry],
})

const findingsTotal = new Gauge({
  name: 'nebula_findings_total',
  help: 'Total number of findings',
  registers: [registry],
})

export async function GET() {
  try {
    // Fetch metrics from database
    const [auditsResult, pendingResult, recentResult, customersResult, monitorsResult, findingsResult] = await Promise.all([
      auditPool.query('SELECT COUNT(*) as count FROM audits'),
      auditPool.query("SELECT COUNT(*) as count FROM audits WHERE status = 'pending'"),
      auditPool.query("SELECT COUNT(*) as count FROM audits WHERE completed_at > NOW() - INTERVAL '24 hours'"),
      auditPool.query('SELECT COUNT(*) as count FROM customers'),
      auditPool.query('SELECT COUNT(*) as count FROM monitors WHERE active = true'),
      auditPool.query('SELECT COUNT(*) as count FROM findings'),
    ])

    // Update Prometheus gauges
    auditsTotal.set(parseInt(auditsResult.rows[0].count))
    auditsPending.set(parseInt(pendingResult.rows[0].count))
    auditsCompleted24h.set(parseInt(recentResult.rows[0].count))
    customersTotal.set(parseInt(customersResult.rows[0].count))
    activeMonitors.set(parseInt(monitorsResult.rows[0].count))
    findingsTotal.set(parseInt(findingsResult.rows[0].count))

    // Return metrics in Prometheus format
    const metrics = await registry.metrics()
    return new NextResponse(metrics, {
      headers: { 'Content-Type': registry.contentType },
    })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
