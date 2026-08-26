import { NextResponse } from 'next/server'
import { db } from '@/app/lib/db'

export async function GET() {
  try {
    // Database stats
    const auditsCount = await db.query('SELECT COUNT(*) as count FROM audits')
    const customersCount = await db.query('SELECT COUNT(*) as count FROM customers')
    
    // Recent audits (last 24h)
    const recentAudits = await db.query(`
      SELECT COUNT(*) as count FROM audits 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `)

    // Errors (last 24h)
    const recentErrors = await db.query(`
      SELECT error_type, COUNT(*) as count 
      FROM audit_errors 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY error_type
    `)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database: {
        audits_total: parseInt(auditsCount.rows[0].count),
        customers_total: parseInt(customersCount.rows[0].count),
        recent_audits_24h: parseInt(recentAudits.rows[0].count),
      },
      errors_24h: recentErrors.rows.reduce((acc, row) => {
        acc[row.error_type] = parseInt(row.count)
        return acc
      }, {}),
    })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
