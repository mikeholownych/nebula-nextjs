import { platformPool } from './platform-db'
import { WorkspaceUser } from './auth'

export interface AgencyOrg {
  organizationId: string
  role: string
}

/**
 * Returns the first agency org the user belongs to as owner or admin,
 * or null if the user is not in any agency org.
 */
export async function getAgencyOrg(user: WorkspaceUser): Promise<AgencyOrg | null> {
  try {
    const result = await platformPool.query(
      `SELECT m.organization_id::text, m.role
       FROM memberships m
       JOIN organizations o ON o.id = m.organization_id
       WHERE m.user_id = $1
         AND m.status = 'active'
         AND o.is_agency = true
       ORDER BY
         CASE m.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END
       LIMIT 1`,
      [user.id]
    )
    if (result.rows.length === 0) return null
    return { organizationId: result.rows[0].organization_id, role: result.rows[0].role }
  } catch (err) {
    console.error('[workspace-app getAgencyOrg]', err)
    return null
  }
}
