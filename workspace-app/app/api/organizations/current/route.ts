import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { platformPool } from '@/lib/platform-db'

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response

  try {
    const result = await platformPool.query(
      `SELECT o.id::text, o.name, o.slug, o.is_agency
       FROM organizations o
       JOIN memberships m ON m.organization_id = o.id
       WHERE m.user_id = $1 AND m.status = 'active'
       ORDER BY CASE m.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END
       LIMIT 1`,
      [auth.user.id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('[workspace-app org current]', err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
