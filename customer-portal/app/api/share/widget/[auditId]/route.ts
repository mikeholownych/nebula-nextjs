import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'widget'
  const theme = searchParams.get('theme') || 'light'

  if (!auditId) {
    return NextResponse.json(
      { error: 'auditId is required' },
      { status: 400 }
    )
  }

  const validFormats = ['widget', 'embed', 'json', 'iframe']
  if (!validFormats.includes(format)) {
    return NextResponse.json(
      { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const auditResult = await auditPool.query(`
      SELECT 
        a.id as audit_id,
        a.url,
        a.score,
        a.grade,
        a.completed_at,
        a.created_at
      FROM audits a
      WHERE a.id = $1
    `, [auditId])

    if (auditResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      )
    }

    const audit = auditResult.rows[0]
    const score = parseFloat(audit.score) * 10

    let widgetHtml = ''
    if (format === 'widget' || format === 'embed') {
      widgetHtml = `
<div class="nebula-audit-widget" data-audit-id="${auditId}" data-theme="${theme}">
  <div class="widget-header">
    <h2>Audit Score</h2>
    <span class="score-circle">${score.toFixed(1)}/10</span>
  </div>
  <p class="widget-url">${audit.url || 'Loading...'}</p>
  <div class="widget-grade">${audit.grade || 'N/A'}</div>
</div>
<style>
.nebula-audit-widget {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 20px;
  border-radius: 8px;
  background: ${theme === 'dark' ? '#1a1a2e' : '#ffffff'};
  border: 1px solid ${theme === 'dark' ? '#3a3a5e' : '#e0e0e0'};
  max-width: 400px;
}
.nebula-audit-widget .widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.nebula-audit-widget .widget-header h2 {
  font-size: 14px;
  margin: 0;
  color: ${theme === 'dark' ? '#e0e0e0' : '#333'};
}
.nebula-audit-widget .score-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${theme === 'dark' ? '#2a2a4e' : '#f5f5f5'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  color: ${theme === 'dark' ? '#c7ff2f' : '#22c55e'};
  border: 2px solid ${theme === 'dark' ? '#c7ff2f' : '#22c55e'};
}
.nebula-audit-widget .widget-url {
  font-size: 12px;
  color: ${theme === 'dark' ? '#888' : '#666'};
  margin: 5px 0 10px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nebula-audit-widget .widget-grade {
  font-size: 48px;
  font-weight: bold;
  color: ${theme === 'dark' ? '#c7ff2f' : '#22c55e'};
}
</style>
`
    }

    return NextResponse.json({
      auditId: audit.audit_id,
      url: audit.url,
      score: score.toFixed(1),
      grade: audit.grade,
      format,
      theme,
      html: widgetHtml,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
