/**
 * Domain claims and exclusions: single source of truth for org_domains
 * lookups. Queries the platform DB (where the table lives).
 *
 * Precedence: active claim grants access outright; 'excluded' suppresses
 * email-chain inference for that domain (owner says it is not theirs).
 */

import { platformPool } from './platform-db'

/** True when any of the actor's orgs holds an active claim on the domain. */
export async function claimExistsForDomain(organizationIds: string[], domain: string): Promise<boolean> {
  if (organizationIds.length === 0) return false
  const result = await platformPool.query(
    `SELECT 1 FROM org_domains
     WHERE status = 'active'
       AND lower(domain) = lower($2)
       AND organization_id::text = ANY($1::text[])
     LIMIT 1`,
    [organizationIds, domain]
  )
  return (result.rowCount ?? 0) > 0
}

/** Active claims across the actor's orgs. */
export async function orgClaimedDomains(organizationIds: string[]): Promise<string[]> {
  if (organizationIds.length === 0) return []
  const result = await platformPool.query(
    `SELECT DISTINCT lower(domain) AS domain
     FROM org_domains
     WHERE status = 'active'
       AND organization_id::text = ANY($1::text[])`,
    [organizationIds]
  )
  return result.rows.map((r: { domain: string }) => String(r.domain))
}

/**
 * Domains an org has explicitly marked "not mine" (status='excluded').
 * Email-chain inference must suppress these even though a member's email
 * appears on their audits (demo runs, teardowns, competitor research).
 */
export async function orgExcludedDomains(organizationIds: string[]): Promise<string[]> {
  if (organizationIds.length === 0) return []
  const result = await platformPool.query(
    `SELECT DISTINCT lower(domain) AS domain
     FROM org_domains
     WHERE status = 'excluded'
       AND organization_id::text = ANY($1::text[])`,
    [organizationIds]
  )
  return result.rows.map((r: { domain: string }) => String(r.domain))
}
