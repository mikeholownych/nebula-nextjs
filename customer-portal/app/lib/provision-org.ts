import crypto from 'node:crypto'

/**
 * Find-or-create User + default Organization + owner Membership.
 * Mirrors platform_api auth signup provisioning (platform_api/db/models.py).
 *
 * Schema facts verified against live nebula_platform (2026-08-23):
 * - users.email has a PARTIAL unique index (WHERE email IS NOT NULL), so the
 *   insert must use a bare ON CONFLICT DO NOTHING (a named target cannot
 *   match a partial index predicate without its WHERE clause).
 * - memberships.status exists (CHECK active|suspended|removed); default 'active'.
 * - organizations.slug is a plain UNIQUE constraint.
 *
 * Callers must pass a dedicated PoolClient (pool.connect()): the helper runs
 * BEGIN/COMMIT itself and pooled .query() calls can land on different
 * connections, which would silently break the transaction.
 */
export async function provisionOrgForEmail(
  db: { query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<{ user_id?: string; org_id?: string; id?: string }> }> },
  rawEmail: string,
): Promise<{ userId: string; organizationId: string }> {
  const email = rawEmail.trim().toLowerCase()
  const existing = await db.query(
    `SELECT u.id AS user_id, o.id AS org_id
       FROM users u
       JOIN memberships m ON m.user_id = u.id AND m.status = 'active'
       JOIN organizations o ON o.id = m.organization_id
      WHERE LOWER(u.email) = $1
      ORDER BY m.role = 'owner' DESC, o.created_at
      LIMIT 1`,
    [email],
  )
  if (existing.rows.length > 0) {
    return { userId: existing.rows[0].user_id as string, organizationId: existing.rows[0].org_id as string }
  }
  const userId = crypto.randomUUID()
  const orgId = crypto.randomUUID()
  const slug = `org-${crypto.createHash('sha256').update(email).digest('hex').slice(0, 12)}`
  await db.query('BEGIN')
  try {
    await db.query(
      `INSERT INTO users (id, email) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, email],
    )
    const urow = await db.query(`SELECT id FROM users WHERE LOWER(email)=$1`, [email])
    const uid = urow.rows[0].id as string
    await db.query(
      `INSERT INTO organizations (id, name, slug)
       VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING`,
      [orgId, `${email.split('@')[0]} Organization`, slug],
    )
    const orow = await db.query(`SELECT id FROM organizations WHERE slug=$1`, [slug])
    const oid = orow.rows[0].id as string
    await db.query(
      `INSERT INTO memberships (id, user_id, organization_id, role, status)
       VALUES ($1, $2, $3, 'owner', 'active')
       ON CONFLICT DO NOTHING`,
      [crypto.randomUUID(), uid, oid],
    )
    await db.query('COMMIT')
    return { userId: uid, organizationId: oid }
  } catch (e) {
    await db.query('ROLLBACK')
    throw e
  }
}
